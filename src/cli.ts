import * as fs from "fs";
import * as path from "path";
import * as commander from "commander";
import { completeAkashicAudio } from "./completeAkashicAudio";

var ver = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf8")).version;
commander
	.version(ver)
	.usage("<filepath> <options>")
	.option("-f, --force", "出力ファイルが既に存在する場合、上書きする")
	.option("-i, --ignore", "出力ファイルが既に存在する場合、何もしない")
	.option("--ffmpeg <path>", "ffmpegのバイナリのフルパスを直接指定する場合に使うオプション")
	.option("-b, --bitrate <bitrate>", "出力する音声のビットレート。FFmpegの-abオプションに相当（experimental）")
	.option("-c, --channels <channels>", "出力する音声のチャンネル数。FFmpegの-acオプションに相当")
	.option("-r, --rate <rate>", "出力する音声のサンプリングレート。FFmpegの-arオプションに相当");

async function cli(): Promise<void> {
	const { force, ignore, ffmpeg, bitrate, channels, rate } = commander;
	if (force && ignore) {
		console.log("You can not provide force and ignore at the same time");
		process.exit(1);
	}
	await completeAkashicAudio({
		sourcePaths: commander.args,
		overwrite: force ? "force" : (ignore ? "ignore" : "question"),
		ffmpegPath: ffmpeg,
		options: { bitrate, channels, rate }
	});
	console.log("done!");
	process.exit(0);
}

export function run(argv: string[]): void {
	if (argv.length < 3) {
		commander.help();
		process.exit(1);
	}
	commander.parse(argv);
	cli();
}
