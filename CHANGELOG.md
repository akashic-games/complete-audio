# CHANGELOG

## 2.1.0
* Ogg Vorbisのlogical bitstreamのシリアルナンバーを指定する `--ogg-serial-offset` オプションを追加

## 2.0.1
* カバー画像付きmp3を扱えない不具合を修正

## 2.0.0
* デフォルトの出力先を入力ファイルと同じ場所に出力するように変更
* 出力先を指定する `-o` オプションを追加

## 1.0.0
* デフォルトの出力形式を `.ogg` と `.m4a` に変更 (従来は `.ogg` と `.aac`)
* `--experimental-output-m4a` オプションを非推奨に
  * (このオプションの有無に関わらず `.m4a` が出力されます)
* 以前の動作を行う `--output-aac` オプションを追加

## 0.3.1
* 未知の拡張子に対する警告が誤って表示される不具合を修正

## 0.3.0
* `--output-experimental-m4a` オプションを追加
* コード全体をリライト

## 0.2.5
* コマンド実行に起こるエラーの修正

## 0.2.4
* 引数無しで実行したときヘルプを表示するように

## 0.2.3
* `-b` `-c` `-r` オプションを追加

## 0.2.2
* Ogg Vorbisを出力できない場合エラーを表示する

## 0.2.1
* 入力オーディオ形式にMP3を追加

## 0.2.0
* 出力オーディオ形式をMP4からAACに変更

## 0.1.1
* 初期リリース
