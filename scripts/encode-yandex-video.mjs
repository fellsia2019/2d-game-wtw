import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const language = process.argv[2] ?? 'ru';
if (!['ru', 'en'].includes(language)) throw new Error('Expected ru or en');
const root = resolve(`artifacts/yandex-video-${language}`);
const frames = JSON.parse(readFileSync(`${root}/frames.json`, 'utf8'));
if (frames.length < 2) throw new Error('Capture the real gameplay frames first');
const lines = frames.flatMap((frame, index) => {
  if (!/^frame-\d+\.jpg$/.test(frame.name)) throw new Error('Invalid frame filename');
  const duration = Math.max(.001, (frames[index + 1]?.time ?? frame.time + 1 / 30) - frame.time);
  return [`file '${frame.name}'`, `duration ${duration.toFixed(6)}`];
});
lines.push(`file '${frames.at(-1).name}'`);
writeFileSync(`${root}/capture.ffconcat`, ['ffconcat version 1.0', ...lines].join('\n'));
const target = resolve(`docs/yandex/promo/gameplay-${language}.mp4`);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '1', '-i', `${root}/capture.ffconcat`, '-t', '24', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', target], { stdio: 'inherit' });
console.log(target);
