jest.mock("fluent-ffmpeg");
import ffmpeg from "fluent-ffmpeg";
var  { completeAkashicAudio } = require("../lib/completeAkashicAudio");

describe("ffmpeg", () => {
	it("sourcePath", (done) => {
		const ffmpegPath = "/hoge/fuga/bin/ffmpeg";
		(ffmpeg as any).mockReturnValue({
			setFfmpegPath: (path: string) => {
				expect(path).toBe(ffmpegPath);
				done();
			},
			getAvailableCodecs: () => {}
		});
		completeAkashicAudio({
			sourcePaths: [],
			overwrite: "force",
			ffmpegPath
		});
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
			expectFuncs.output = (destPath: string) => {
				expect(destPath).toEqual("foo.aac");
			};
			expectFuncs.addOption = (options: string) => {
				expect(["-strict 2", "-acodec libvorbis"].includes(options)).toBe(true);
			}
			await completeAkashicAudio({
				sourcePaths: ["foo.ogg"],
				overwrite: "force"
			});
		});

		it("AACToOGG", async () => {
			expectFuncs.output = (destPath: string) => {
				expect(destPath).toEqual("foo.ogg");
			};
			expectFuncs.addOption = (options: string) => {
				expect(["-strict 2", "-acodec libvorbis"].includes(options)).toBe(true);
			}
			await completeAkashicAudio({
				sourcePaths: ["foo.aac"],
				overwrite: "force"
			});
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
