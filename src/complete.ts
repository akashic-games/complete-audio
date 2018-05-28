import fs = require("fs");
import path = require("path");
import ffmpeg = require("fluent-ffmpeg");
import readline = require("readline");

export interface FfmpegOption {
	bitrate?: string;
	channels?: string;
	rate?: string;
}

export class Complete {
	aacEncoders: string[] = ["libfaac", "libvo_aacenc", "default"];
	oggEncoders: string[] = ["libvorbis"];
	overwrite: string = "question";
	option: FfmpegOption;

	constructor(option: FfmpegOption, ffmpegPath?: string) {
		this.option = {
			bitrate: option.bitrate,
			channels: option.channels,
			rate: option.rate
		};
		if (ffmpegPath)
			ffmpeg.setFfmpegPath(ffmpegPath);
	}

	/*
	  拡張子のないファイルを与えると意図しない動作を起こします。
	  この関数が呼ばれるときは拡張子があることが保証されていなければいけません。
	*/
	replaceExt(filepath: string, targetExt: string): string {
		return filepath.substr(0, filepath.lastIndexOf(".")) + "." + targetExt;
	}

	isAvailable(libName: string, cb: (isAvailable: boolean, err?: any) => void): void {
		if (libName === "default") {
			cb(true);
		} else {
			ffmpeg.getAvailableCodecs((err: any, codecs: any) => {
				if (err) {
					cb(false, "error at ffmpeg.getAvailableCodecs. " + err);
				} else if (codecs[libName] !== undefined) {
					cb(true);
				} else {
					cb(false);
				}
			});
		}
	}

	convert(input: string, output: string, codec: string, cb: (err?: any) => void): void {
		var converter = ffmpeg(input);
		if (codec !== "default") {
			converter = converter.addOption("-acodec " + codec);
		} else {
			converter = converter.addOption("-strict 2");
		}

		if (!!this.option.bitrate) converter = converter.addOption("-ab " + this.option.bitrate);
		if (!!this.option.channels) converter = converter.addOption("-ac " + this.option.channels);
		if (!!this.option.rate) converter = converter.addOption("-ar " + this.option.rate);

		converter = converter.output(output)
			.on("end", () => {
				console.log("write " + output);
				cb();
			}).on("error", (err: any, stdout: string, stderr: string) => {
				cb("ffmpeg stdout:\n" + stdout + "\nffmpeg stderr:\n" + stderr + "\n" + err);
			});
		if (this.overwrite !== "force" && fs.existsSync(output)) {
			if (this.overwrite !== "ignore") {
				var rl = readline.createInterface({input: process.stdin, output: process.stdout});
				rl.question("Do you want to overwrite " + output + " ? y/N : ", (value: string) => {
					rl.close();
					if (value === "y") {
						converter.run();
					} else {
						cb();
					}
				});
			} else {
				cb();
			}
		} else {
			converter.run();
		}
	}

	selectEncoderAndConvert(encoders: string[], filepath: string, output: string, cb: (err?: any) => void) {
		var loop = (index: number) => {
			var encoder = encoders[index];
			this.isAvailable(encoder, (isAvailable: boolean, err?: any) => {
				if (err) {
					cb(err);
				} else {
					if (isAvailable) {
						this.convert(filepath, output, encoder, cb);
					} else {
						if (index < encoders.length - 1) {
							loop(index + 1);
						} else {
							if (path.extname(output) === ".ogg") {
								console.log(
									"Cannot covert Ogg vorbis without libvorbis. " +
									"Compile your ffmpeg with '--enable_libvorbis' or reinstall ffmpeg with libborvis.");
							}
						}
					}
				}
			});
		};
		loop(0);
	}

	toAAC(filepath: string, cb: (err?: any) => void): void {
		var output = this.replaceExt(filepath, "aac");
		this.selectEncoderAndConvert(this.aacEncoders, filepath, output, cb);
	}

	toOGG(filepath: string, cb: (err?: any) => void): void {
		var output = this.replaceExt(filepath, "ogg");
		this.selectEncoderAndConvert(this.oggEncoders, filepath, output, cb);
	}

	toOGGAndAAC(filepath: string, cb: (err?: any) => void): void {
		this.toOGG(filepath, (err?: any) => {
			if (err) {
				cb(err);
			} else {
				this.toAAC(filepath, cb);
			}
		});
	}

	auto(filepath: string, cb: (err?: any) => void): void {
		var ext = path.extname(filepath);
		switch (ext) {
		case ".wav":
			this.toOGGAndAAC(filepath, cb);
			break;
		case ".aac":
			this.toOGG(filepath, cb);
			break;
		case ".ogg":
			this.toAAC(filepath, cb);
			break;
		case ".mp4":
		case ".mp3":
			this.toOGGAndAAC(filepath, cb);
			break;
		default:
			cb("ERR: " + filepath + " must be wav, aac, ogg or mp4.");
			break;
		}
	}
}
