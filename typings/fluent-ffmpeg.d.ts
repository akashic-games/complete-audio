interface FluentFfmpeg {
    (path: string): FfmpegCommand;
    setFfmpegPath(path: string): void;
    getAvailableCodecs(callback: (err: Error, codecs: any) => void): void;
}

interface FfmpegCommand {
	output(path: string): FfmpegCommand;
    on(event: 'error', callback: (err: Error, stdout: string, stderr: string) => void): FfmpegCommand;
    on(event: string, callback: Function): FfmpegCommand;
	addOption(option: string): FfmpegCommand;
    kill(): void;
	run(): void;
}

declare var fluentFfmpeg: FluentFfmpeg;

declare module 'fluent-ffmpeg' {
    export = fluentFfmpeg;
}