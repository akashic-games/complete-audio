
var pkg = require("../package.json");
var Complete = require("../lib/complete").Complete;
var commander = require("commander");

commander
	.version(pkg.version)
	.usage("<filepath> <options>")
	.option("-f, --force", "出力ファイルが既に存在する場合、上書きする")
	.option("-i, --ignore", "出力ファイルが既に存在する場合、何もしない")
	.option("--ffmpeg <path>", "ffmpegのバイナリのフルパスを直接指定する場合に使うオプション")
	.option("-b, --bitrate <bitrate>", "出力する音声のビットレート。FFmpegの-abオプションに相当（experimental）")
	.option("-c, --channels <channels>", "出力する音声のチャンネル数。FFmpegの-acオプションに相当")
	.option("-r, --rate <rate>", "出力する音声のサンプリングレート。FFmpegの-arオプションに相当")
	.action(() => {
		var options = {
			bitrate: commander["bitrate"],
			channels: commander["channels"],
			rate: commander["rate"]
		};

		var complete = new Complete(options, commander.ffmpeg);
		if (commander.force && commander.ignore) {
			console.log("You can not provide force and ignore at the same time");
			process.exit(1);
		} else {
			if (commander.force)
				complete.overwrite = "force";
			if (commander.ignore)
				complete.overwrite = "ignore";
			var loop = function(index: number) {
				var filepath = commander.args[index];
				complete.auto(filepath, function(err: any) {
					if (err) {
						console.log(err);
						process.exit(1);
					}
					if (index < commander.args.length - 1) {
						setTimeout(function(){loop(index + 1)}, 0);
					} else {
						console.log("done!");
					}
				});
			};
			loop(0);
		}

	});

export function run(argv: string[]): void {
    if (argv.length < 3) {
        commander.help();
        process.exit(1);
	}
    commander.parse(argv);
}
