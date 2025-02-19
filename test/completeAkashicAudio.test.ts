jest.mock("fluent-ffmpeg");
import ffmpeg from "fluent-ffmpeg";
var  { completeAkashicAudio } = require("../lib/completeAkashicAudio");

describe("ffmpeg", () => {
	it("sourcePath", () => {
		const ffmpegPath = "/hoge/fuga/bin/ffmpeg";
		const receivedFfmpegPath: string[] = [];
		(ffmpeg as any).mockReturnValue({
			setFfmpegPath: (path: string) => {
				receivedFfmpegPath.push(path);
			},
			getAvailableCodecs: () => {}
		});
		completeAkashicAudio({
			sourcePaths: [],
			overwrite: "force",
			ffmpegPath
		});
		expect(receivedFfmpegPath).toEqual([ffmpegPath]);
	});
});

describe("FfmpegCommand", () => {
	let ffmpegMockImpl: any;
	let expectFuncs: any = {};
	beforeEach(function() {
		ffmpegMockImpl = {
			getAvailableCodecs: (cb: any) => {
				cb(undefined, {
					libvorbis: {
						type: 'audio',
						description: 'Vorbis (decoders: vorbis libvorbis ) (encoders: vorbis libvorbis )',
						intraFrameOnly: true,
						isLossy: true,
						isLossless: false,
						canEncode: true,
						canDecode: true
					  }
				});
			},
			output: (destPath: string) => {
				if (expectFuncs.output) expectFuncs.output(destPath);
				return ffmpegMockImpl;
			},
			addOption: (options: string[]) => {
				if (expectFuncs.addOption) expectFuncs.addOption(options);
			},
			on: (event: string, cb: any) => {
				cb();
				return ffmpegMockImpl;
			}
		};
		(ffmpeg as any).mockReturnValue(ffmpegMockImpl);
	});
	afterEach(function() {
		expectFuncs = {};
	});

	describe("convert", () => {
		it("OGGtoAAC", async () => {
			const receivedOutputs: string[] = [];
			const receivedOptions: string[] = [];
			expectFuncs.output = (destPath: string) => {
				receivedOutputs.push(destPath);
			};
			expectFuncs.addOption = (options: string) => {
				receivedOptions.push(options);
			}
			await completeAkashicAudio({
				sourcePaths: ["foo.ogg"],
				overwrite: "force"
			});
			expect(receivedOutputs).toEqual(["foo.aac"]);
			expect(receivedOptions).toEqual(["-map a", "-strict 2"]);
		});

		it("OGGtoM4A", async () => {
			const receivedOutputs: string[] = [];
			const receivedOptions: string[] = [];
			expectFuncs.output = (destPath: string) => {
				receivedOutputs.push(destPath);
			};
			expectFuncs.addOption = (options: string) => {
				receivedOptions.push(options);
			}
			await completeAkashicAudio({
				sourcePaths: ["foo.ogg"],
				overwrite: "force",
				outputM4a: true
			});
			expect(receivedOutputs).toEqual(["foo.m4a"]);
			expect(receivedOptions).toEqual(["-map a", "-strict 2"]);
		});

		it("AACToOGG", async () => {
			const receivedOutputs: string[] = [];
			const receivedOptions: string[] = [];
			expectFuncs.output = (destPath: string) => {
				receivedOutputs.push(destPath);
			};
			expectFuncs.addOption = (options: string) => {
				receivedOptions.push(options);
			}
			await completeAkashicAudio({
				sourcePaths: ["foo.aac"],
				overwrite: "force"
			});
			expect(receivedOutputs).toEqual(["foo.ogg"]);
			expect(receivedOptions).toEqual(["-map a", "-acodec libvorbis"]);
		});

		it("toOGGAndAAC", async () => {
			const receivedOutputs: string[] = [];
			const receivedOptions: string[] = [];
			expectFuncs.output = (destPath: string) => {
				receivedOutputs.push(destPath);
			};
			expectFuncs.addOption = (options: string) => {
				receivedOptions.push(options);
			}
			await completeAkashicAudio({
				sourcePaths: ["foo.wav"],
				overwrite: "force"
			});
			expect(receivedOutputs).toEqual(["foo.aac", "foo.ogg"]);
			expect(receivedOptions).toEqual(["-map a", "-strict 2", "-map a", "-acodec libvorbis"]);
		});

		it("toOGGAndM4A", async () => {
			const receivedOutputs: string[] = [];
			const receivedOptions: string[] = [];
			expectFuncs.output = (destPath: string) => {
				receivedOutputs.push(destPath);
			};
			expectFuncs.addOption = (options: string) => {
				receivedOptions.push(options);
			}
			await completeAkashicAudio({
				sourcePaths: ["foo.wav"],
				overwrite: "force",
				outputM4a: true
			});
			expect(receivedOutputs).toEqual(["foo.m4a", "foo.ogg"]);
			expect(receivedOptions).toEqual(["-map a", "-strict 2", "-map a", "-acodec libvorbis"]);
		});

	});

	describe("output option", () => {
		it ("no output option", async() => { 
			const receivedOutputs: string[] = [];
			expectFuncs.output = (destPath: string) => {
				receivedOutputs.push(destPath);
			};
			
			await completeAkashicAudio({
				sourcePaths: ["foo/foo1.ogg","foo/foo2.ogg", "hoge/hoge.ogg"],
				overwrite: "force",
				outputM4a: true
			});
			expect(receivedOutputs).toEqual(["foo/foo1.m4a", "foo/foo2.m4a", "hoge/hoge.m4a"]);
		});

		it ("specify file path", async() => { 
			try { 
				await completeAkashicAudio({
					sourcePaths: ["foo.ogg"],
					outputPath: "./hogeDir/hoge.m4a",
					overwrite: "force",
					outputM4a: true
				});
			} catch (e) {
				expect(e.message).toBe("Invalid -o option value, Please specify the directory path.")
			}
		});

		it ("specify directory path", async() => { 
			let receivedOutputs: string[] = [];
			expectFuncs.output = (destPath: string) => {
				receivedOutputs.push(destPath);
			};
			await completeAkashicAudio({
				sourcePaths: ["foo/foo1.ogg","foo/foo2.ogg", "hoge/hoge.ogg"],
				outputPath: "audio/out",
				overwrite: "force",
				outputM4a: true
			});
			expect(receivedOutputs).toEqual(["audio/out/foo1.m4a", "audio/out/foo2.m4a", "audio/out/hoge.m4a"]);

			receivedOutputs = [];
			await completeAkashicAudio({
				sourcePaths: ["foo/foo1.ogg", "hoge/hoge.ogg"],
				outputPath: ".",
				overwrite: "force",
				outputM4a: true
			});
			expect(receivedOutputs).toEqual(["foo1.m4a", "hoge.m4a"]);

		});
	});
});
