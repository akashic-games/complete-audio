var Complete = new require("../lib/complete");
var fs = require("fs");
var path = require("path");
var ffmpeg = require("fluent-ffmpeg");
var originFfmpeg = undefined;

describe("complete", function() {
	beforeEach(function() {
		originFfmpeg = ffmpeg;
	});

	afterEach(function() {
		ffmpeg = originFfmpeg;
	});

	it("ffmpeg path", function(done) {
		ffmpeg.setFfmpegPath = function(path) {
			expect(path).toBe("/hoge/fuga/bin/ffmpeg");
			done();
		};
		var complete = new Complete("/hoge/fuga/bin/ffmpeg");
	});

	it("isAvailable", function(done) {
		ffmpeg.getAvailableCodecs = function(cb) {
			cb(undefined, {hoge: "dummy", foo: "dummy", bar: "dummy"});
		};
		var complete = new Complete();
		complete.isAvailable("hoge", function(can) {
			expect(can).toBe(true);
			complete.isAvailable("foo", function(can2) {
				expect(can2).toBe(true);
				complete.isAvailable("bar", function(can3) {
					expect(can3).toBe(true);
					complete.isAvailable("notexist", function(can4) {
						expect(can4).toBe(false);
						done();
					});
				});
			});
		});
	});

	it("OGGToMP4", function(done) {
		var complete = new Complete();
		var exit = function(err) {
			expect(err).toBeUndefined();
			done();
		};
		complete.isAvailable = function(libName, cb) {
			if (libName === "default") {
				cb(true);
			} else {
				cb(false);
			}
		};
		complete.convert = function(input, output, codec, cb) {
			expect(input).toBe("foo.ogg");
			expect(output).toBe("foo.mp4");
			expect(codec).toBe("default");
			cb();
		};
		complete.toMP4("foo.ogg", exit);
	});

	it("MP4ToOGG", function(done) {
		var complete = new Complete();
		var exit = function(err) {
			expect(err).toBeUndefined();
			done();
		};
		complete.isAvailable = function(libName, cb) {
			if (libName === "default") {
				cb(true);
			} else {
				cb(false);
			}
		};
		complete.convert = function(input, output, codec, cb) {
			expect(input).toBe("foo.mp4");
			expect(output).toBe("foo.ogg");
			expect(codec).toBe("default");
			cb();
		};
		complete.toOGG("foo.mp4", exit);
	});

	it("toOGGAndMP4 - wav", function(done) {
		var convertedMap = {
			"foo.mp4": false,
			"foo.ogg": false
		};
		var complete = new Complete();
		var exit = function(err) {
			expect(err).toBeUndefined();
			done();
		};
		complete.convert = function(input, output, codec, cb) {
			expect(convertedMap[output]).toBe(false);
			convertedMap[output] = true;
			if (convertedMap["foo.mp4"] && convertedMap["foo.ogg"]) {
				exit();
			} else {
				cb();
			}
		};
		complete.toOGGAndMP4("foo.wav", exit);
	});

	it("toOGGAndMP4 - aac", function(done) {
		var convertedMap = {
			"foo.mp4": false,
			"foo.ogg": false
		};
		var complete = new Complete();
		var exit = function(err) {
			expect(err).toBeUndefined();
			done();
		};
		complete.convert = function(input, output, codec, cb) {
			expect(convertedMap[output]).toBe(false);
			convertedMap[output] = true;
			if (convertedMap["foo.mp4"] && convertedMap["foo.ogg"]) {
				exit();
			} else {
				cb();
			}
		};
		complete.toOGGAndMP4("foo.aac", exit);
	});

	it("auto wav", function(done) {
		var complete = new Complete();
		complete.toOGGAndMP4 = function(filepath, cb) {
			expect(filepath).toBe("foo.wav");
			expect(cb).toBeUndefined();
			done();
		};
		complete.auto("foo.wav", undefined);
	});

	it("auto ogg", function(done) {
		var complete = new Complete();
		complete.toMP4 = function(filepath, cb) {
			expect(filepath).toBe("foo.ogg");
			expect(cb).toBeUndefined();
			done();
		};
		complete.auto("foo.ogg", undefined);
	});

	it("auto mp4", function(done) {
		var complete = new Complete();
		complete.toOGG = function(filepath, cb) {
			expect(filepath).toBe("foo.mp4");
			expect(cb).toBeUndefined();
			done();
		};
		complete.auto("foo.mp4", undefined);
	});

	it("auto error", function(done) {
		var complete = new Complete();
		complete.auto("foo.mp3", function(err) {
			expect(err).toBe("ERR: foo.mp3 must be wav, ogg or aac.");
			done();
		});
	});
});
