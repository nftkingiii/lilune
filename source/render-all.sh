#!/bin/bash
set -e
cd /home/user/films/lilune
for f in ${@:-demo pitch envio mera ad}; do
  echo "== $f"
  node audio.mjs $f
  rm -rf out/$f/frames
  node render.mjs --page=film.html --film=$f --frames --workers=4 --sub=2 --dir=out/$f/frames > out/$f/render.log 2>&1
  node render.mjs --encode --dir=out/$f/frames --out=out/$f/silent.mp4 >> out/$f/render.log 2>&1
  if [ "$f" = ad ]; then
    node mix.mjs --video=out/$f/silent.mp4 --music=out/$f/bed.wav --music-vol=0.9 --sfx=out/$f/sfx.wav --sfx-vol=1.2 --lufs=-14 --out=out/$f/final.mp4
  else
    node mix.mjs --video=out/$f/silent.mp4 --music=out/$f/bed.wav --music-vol=0.35 --sfx=out/$f/sfx.wav --voice=out/$f/voice.wav --lufs=-16 --out=out/$f/final.mp4
  fi
  rm -rf out/$f/frames
  echo "DONE $f $(ffprobe -v error -show_entries format=duration -of csv=p=0 out/$f/final.mp4)"
done
