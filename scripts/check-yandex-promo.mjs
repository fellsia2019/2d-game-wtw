import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = 'docs/yandex';
const copy = JSON.parse(readFileSync(`${root}/store-copy.json`, 'utf8'));
for (const language of ['ru', 'en']) {
  const fields = copy[language];
  for (const [key, min, max] of [['title',1,50],['shortDescription',1,70],['seo',50,160],['about',100,1000],['howToPlay',100,1000],['keywords',1,100]]) {
    assert(fields[key].length >= min && fields[key].length <= max, `${language}.${key}: ${fields[key].length} characters`);
  }
  for (const [name,width,height] of [[`cover-${language}`,800,470],[`showcase-${language}`,1560,520],['icon',512,512]]) {
    const png = readFileSync(`${root}/promo/${name}.png`);
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16),width,name); assert.equal(png.readUInt32BE(20),height,name);
  }
  for (const device of ['desktop','mobile']) for (const shot of ['stone','line']) {
    const file = `${root}/promo/screenshots/${device}-${shot}-${language}.jpg`;
    const { streams } = JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height','-of','json',file],{encoding:'utf8'}));
    const { width,height } = streams[0];
    assert.equal(width * 9,height * 16,`${file}: expected 16:9`);
    assert(width >= 1280 && width <= 2560,`${file}: invalid long side`);
  }
  const file = `${root}/promo/gameplay-${language}.mp4`;
  const data = JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height','-show_entries','format=duration','-of','json',file],{encoding:'utf8'}));
  const stream = data.streams[0];
  assert.equal(stream.codec_name,'h264'); assert.equal(stream.width * 9, stream.height * 16);
  assert(stream.height >= 400); assert(Number(data.format.duration) > 0 && Number(data.format.duration) <= 28);
  assert(statSync(file).size <= 100_000_000);
}
assert(copy.moderatorComment.length <= 2048);
console.log('Yandex promo checked: RU/EN copy, five PNG images, eight gameplay JPEGs and two MP4 videos.');
