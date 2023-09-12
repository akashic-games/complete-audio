import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
import { completeAkashicAudio } from "./completeAkashicAudio";

const commander = new Command();

var ver = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf8")).version;
commander
	.version(ver)
	.usage("<filepath> <options>")
	.option("-f, --force", "出力ファイルが既に存在する場合、上書きする")
	.option("-i, --ignore", "出力ファイルが既に存在する場合、何もしない")
	.option("--ffmpeg <path>", "ffmpegのバイナリのフルパスを直接指定する場合に使うオプション")
	.option("-b, --bitrate <bitrate>", "出力する音声のビットレート。FFmpegの-abオプションに相当（experimental）")
	.option("-c, --channels <channels>", "出力する音声のチャンネル数。FFmpegの-acオプションに相当")
	.option("-r, --rate <rate>", "出力する音声のサンプリングレート。FFmpegの-arオプションに相当")
	.option("--output-aac", "m4aファイルのかわりにaacファイルを出力する")
	.option("--experimental-output-m4a", "非推奨 (現在はこの値に関わらずm4aを出力する)");

async function cli(): Promise<void> {
	const options = commander.opts();
	const force: string = options.force;
	const ignore: string = options.ignore;
	const ffmpeg: string = options.ffmpeg;
	const bitrate: string = options.bitrate;
	const channels: string = options.channels;
	const rate: string = options.rate;
	const outputAac = options.outputAac;
	if (force && ignore) {
		console.log("You can not provide force and ignore at the same time");
		process.exit(1);
	}
	await completeAkashicAudio({
		sourcePaths: commander.args,
		overwrite: force ? "force" : (ignore ? "ignore" : "question"),
		ffmpegPath: ffmpeg,
		outputM4a: !outputAac,
		options: { bitrate, channels, rate }
	});
	console.log("done!");
	process.exit(0);
}

export function run(argv: string[]): void {
	if (argv.length < 3) {
		commander.help();
	}
	commander.parse(argv);
	cli();
}
