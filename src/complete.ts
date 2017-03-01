import fs = require("fs");
import path = require("path");
import ffmpeg = require("fluent-ffmpeg");
import readline = require("readline");

class Complete {
	mp4Encoders: string[] = ["libfdk_aac", "aac", "default"];
	oggEncoders: string[] = ["libvorbis", "default"];
	overwrite: string = "question";

	constructor(ffmpegPath?: string) {
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
		console.log("***", "convert", input, "to", output, "with", codec, "encoder", "***");
		var converter = ffmpeg(input);
		if (codec !== "default") {
			converter = converter.addOption("-acodec " + codec);
		} else {
			converter = converter.addOption("-strict 2");
		}
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
						}
					}
				}
			});
		};
		loop(0);
	}

	toMP4(filepath: string, cb: (err?: any) => void): void {
		var output = this.replaceExt(filepath, "mp4");
		this.selectEncoderAndConvert(this.mp4Encoders, filepath, output, cb);
	}

	toOGG(filepath: string, cb: (err?: any) => void): void {
		var output = this.replaceExt(filepath, "ogg");
		this.selectEncoderAndConvert(this.oggEncoders, filepath, output, cb);
	}

	toOGGAndMP4(filepath: string, cb: (err?: any) => void): void {
		this.toOGG(filepath, (err?: any) => {
			if (err) {
				cb(err);
			} else {
				this.toMP4(filepath, cb);
			}
		});
	}

	auto(filepath: string, cb: (err?: any) => void): void {
		var ext = path.extname(filepath);
		switch (ext) {
		case ".wav":
			this.toOGGAndMP4(filepath, cb);
			break;
		case ".aac":
			this.toOGGAndMP4(filepath, cb);
			break;
		case ".ogg":
			this.toMP4(filepath, cb);
			break;
		case ".mp4":
			this.toOGG(filepath, cb);
			break;
		default:
			cb("ERR: " + filepath + " must be wav, ogg or aac.");
			break;
		}
	}
}

export = Complete;
