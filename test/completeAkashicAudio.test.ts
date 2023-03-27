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
	describe("convert", () => {
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
			expect(receivedOptions).toEqual(["-strict 2"]);
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
			expect(receivedOptions).toEqual(["-acodec libvorbis"]);
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
			expect(receivedOptions).toEqual(["-strict 2", "-acodec libvorbis"]);
		});
	});
});
