import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import ffmpeg from "fluent-ffmpeg";

export type OverwriteType = "force" | "question" | "ignore";
export const BUILTIN_AAC_ENCODER = "<builtin-aac>";

export interface FfmpegOption {
	bitrate?: string;
	channels?: string;
	rate?: string;
}

export interface CompleteAkashicAudioParameterObject {
	sourcePaths: string[];
	overwrite: OverwriteType;
	ffmpegPath?: string;
	aacCodecNames?: string[];
	oggCodecNames?: string[];
	options?: FfmpegOption;
}

export async function completeAkashicAudio(param: CompleteAkashicAudioParameterObject): Promise<void> {
	const {
		sourcePaths,
		overwrite,
		ffmpegPath,
		aacCodecNames = ["libfaac", "libvo_aacenc"],
		oggCodecNames = ["libvorbis"],
		options = {}
	} = param;

	const availableCodecs = await getAvailableCodecs(ffmpegPath);
	const aacCodecName = aacCodecNames.find(name => !!availableCodecs[name]) ?? BUILTIN_AAC_ENCODER;
	const oggCodecName = oggCodecNames.find(name => !!availableCodecs[name]);
	if (!oggCodecName) {
		if (sourcePaths.some(p => path.extname(p) !== ".ogg")) {
			throw new Error(
				`No available codec in ${JSON.stringify(oggCodecNames)}.` +
				"You need to rebuild ffmpeg with approprite options (e.g. --enable-libvorbis) " +
				"or to reinstall ffmpeg with appropriate libraries (e.g. libvorbis)."
			);
		}
	}

	for (let i = 0; i < sourcePaths.length; ++i) {
		const sourcePath = sourcePaths[i];
		const srcExt = path.extname(sourcePath);
		if (srcExt === "")
			throw new Error(`The input ${sourcePath} must have a file extension`);
		if (/^\.(wav|ogg|aac|mp3|mp4|m4a)$/.test(srcExt)) {
			console.warn(
				`Unknown file type: ${srcExt}. ` +
				"complete-audio does not officially support this type and may cause error."
			);
		}

		if (srcExt !== ".aac") {
			const destPath = path.basename(sourcePath, srcExt) + ".aac";
			await convert({ sourcePath, destPath, codecName: aacCodecName, overwrite, options, ffmpegPath });
		}
		if (srcExt !== ".ogg") {
			const destPath = path.basename(sourcePath, srcExt) + ".ogg";
			await convert({ sourcePath, destPath, codecName: oggCodecName, overwrite, options, ffmpegPath });
		}
	}
}

interface ConvertParameterObject {
	sourcePath: string;
	destPath: string;
	/// 利用するコーデック名、または組み込みのAACエンコーダを使うための `"<builtin-aac>"`
	codecName: string;
	overwrite: OverwriteType;
	options: FfmpegOption;
	ffmpegPath?: string;
}

function convert(param: ConvertParameterObject): Promise<void> {
	const { sourcePath, destPath, codecName, overwrite, options, ffmpegPath } = param;

	// 上書きチェック
	if (overwrite !== "force" && fs.existsSync(destPath)) {
		if (overwrite === "ignore" || (overwrite === "question" && !askOverwrite(destPath)))
			return;
	}

	const ffmpegCmd = ffmpeg(sourcePath);
	if (ffmpegPath)
		ffmpegCmd.setFfmpegPath(ffmpegPath);

	if (codecName !== BUILTIN_AAC_ENCODER)
		ffmpegCmd.addOption("-acodec " + codecName);

	// TODO 必要性確認 (2015-12-05 までビルトインの AAC エンコードに -strict -2 が必要だった名残？ (のしかも値がおかしいもの？))
	// ref. https://trac.ffmpeg.org/wiki/Encode/AAC?action=diff&version=40&old_version=39
	if (codecName === BUILTIN_AAC_ENCODER)
		ffmpegCmd.addOption("-strict 2");

	if (!!options.bitrate)
		ffmpegCmd.addOption("-ab " + options.bitrate);
	if (!!options.channels)
		ffmpegCmd.addOption("-ac " + options.channels);
	if (!!options.rate)
		ffmpegCmd.addOption("-ar " + options.rate);

	return new Promise((resolve, reject) => {
		ffmpegCmd.output(destPath)
			.on("end", () => {
				console.log("write " + destPath);
				resolve();
			})
			.on("error", (err: any, stdout: string, stderr: string) => {
				// TODO error を投げるようにする
				reject("ffmpeg stdout:\n" + stdout + "\nffmpeg stderr:\n" + stderr + "\n" + err);
			});
		ffmpegCmd.run();
	});
}

function getAvailableCodecs(ffmpegPath: string | undefined): Promise<ffmpeg.Codecs> {
	return new Promise((resolve, reject) => {
		const ffmpegCmd = ffmpeg();
		if (ffmpegPath)
			ffmpegCmd.setFfmpegPath(ffmpegPath);
		ffmpegCmd.getAvailableCodecs((err: any, codecs: ffmpeg.Codecs) => {
			return err ? void reject(err) : resolve(codecs);
		});
	});
}

function askOverwrite(dest: string): Promise<boolean> {
	return new Promise((resolve, _reject) => {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
		rl.question("Do you want to overwrite " + dest + " ? y/N : ", (value: string) => {
			rl.close();
			resolve(value === "y");
		});
	});
}
