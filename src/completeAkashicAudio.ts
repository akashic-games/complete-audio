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
	outputPath: string | undefined;
	overwrite: OverwriteType;
	ffmpegPath?: string;
	aacCodecNames?: string[];
	oggCodecNames?: string[];
	outputM4a?: boolean;
	options?: FfmpegOption;
}

export async function completeAkashicAudio(param: CompleteAkashicAudioParameterObject): Promise<void> {
	const {
		sourcePaths,
		outputPath,
		overwrite,
		ffmpegPath,
		aacCodecNames = ["libfaac", "libvo_aacenc"],
		oggCodecNames = ["libvorbis"],
		options = {},
		outputM4a,
	} = param;

	const isOutputDirPath = outputPath ? path.extname(outputPath) === "" : undefined;
	if (outputPath) {
		const outDir = isOutputDirPath ? outputPath : path.dirname(outputPath);
		if (!fs.existsSync(outDir)) {
			fs.mkdirSync(outDir, { recursive: true });
		}
	}

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
		if (!/^\.(wav|ogg|aac|mp3|mp4|m4a)$/.test(srcExt)) {
			console.warn(
				`Unknown file type: ${srcExt}. ` +
				"complete-audio does not officially support this type and may cause error."
			);
		}

		const ext = outputM4a ? ".m4a" : ".aac";
		const srcDirPath = path.dirname(sourcePath);
		if (srcExt !== ext) {
			const fileName = path.basename(sourcePath, srcExt) + ext;
			const destPath = makeDestPath(srcDirPath, fileName, outputPath, isOutputDirPath);
			await convert({ sourcePath, destPath, codecName: aacCodecName, overwrite, options, ffmpegPath });
		}
		if (srcExt !== ".ogg") {
			const fileName = path.basename(sourcePath, srcExt) + ".ogg";
			const destPath = makeDestPath(srcDirPath, fileName, outputPath, isOutputDirPath);
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

function makeDestPath(srcDirPath: string, fileName: string, outputPath: string | undefined, isOutputDirPath: boolean | undefined): string {
	if (outputPath && !isOutputDirPath) return outputPath;

	const destDir = outputPath || srcDirPath;
	return path.join(destDir, fileName);
}
