<p align="center">
<img src="img/akashic.png"/>
</p>

# complete-audio

[Akashic Engine](https://akashic-games.github.io/) のゲームに必要な音声ファイルの形式を取り揃えるための変換ツールです。

以下の音声ファイルから、Akashic ゲームで使う .ogg, .m4a ファイル (のうち足りないもの) を生成します。

* WAV ファイル (.wav)
* Ogg Vorvis ファイル (.ogg)
* AAC ファイル (.aac)
* MP3 ファイル (.mp3)
* AAC を格納した MP4 ファイル (.mp4, .m4a)

## インストール方法

このソフトウェアを利用するには、 `FFmpeg` のインストールが必要です。 `FFmpeg` のインストール方法は [公式サイト](https://www.ffmpeg.org/) を参照してください。

```
$ npm install -g @akashic/complete-audio
```

## 利用方法

akashicコンテンツで使用する音声ファイル名を指定してください。

```
$ complete-audio sound.wav
```

生成された音声ファイルの詳細な利用方法については、 [Akashic Engine 入門 - 音を鳴らす](https://akashic-games.github.io/tutorial/v3/audio.html) を参照してください。

### Akashic Engine v2 以前で利用する場合
complete-audio はデフォルトでは .ogg ファイルと .m4a ファイルを生成します。しかし Akashic Engine の v2 以前のバージョンは、.m4a ファイルに対応していません。
そのため、以下のように `--output-aac` オプションを用いて、.m4a ファイルのかわりに .aac ファイルを出力する必要があります。

```sh
complete-audio sound.wav --output-aac
```

### FFmpegのライブラリについて

oggファイルを生成するときに `libvorbis` が存在する場合は

```
libvorbis > ffmpeg default
```

の順に使用されます。

aacファイルを生成するときに `libfaac` か `libvo_aacenc` が存在する場合は

```
libfaac > libvo_aacenc > ffmpeg default
```

の順に使用されます。

### FFmpegのバイナリを直接指定して使う

```sh
complete-audio sound.wav --ffmpeg /path/to/your/ffmpeg
```

または、環境変数 `FFMPEG_PATH` にバイナリへのフルパスが設定されている場合、
complete-audio は環境変数 `FFMPEG_PATH` をFFmpegへのフルパスとして使用します。

### ファイルの上書きについて

出力先のファイルが既に存在する場合、デフォルトでは上書きするかどうかの確認が行われます。

常に上書きしたい場合は

```sh
complete-audio sound.wav -f
```

のように指定してください。

常に上書きを行わないようにしたい場合は

```sh
complete-audio sound.wav -i
```

のように指定してください。

## ライセンス
本リポジトリは MIT License の元で公開されています。
詳しくは [LICENSE](./LICENSE) をご覧ください。

ただし、画像ファイルおよび音声ファイルは
[CC BY 2.1 JP](https://creativecommons.org/licenses/by/2.1/jp/) の元で公開されています。
