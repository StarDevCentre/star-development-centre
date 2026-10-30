// Preserve the visible area of the old 230%-wide image, without shipping the poster.
// The lossless intermediate keeps the original pixels; Next Image encodes delivery sizes.
const sharp = require('sharp');
const {createHash} = require('node:crypto');
const {writeFileSync} = require('node:fs');
const {join} = require('node:path');

async function build() {
  const directory = join(__dirname, '..', 'public', 'images');
  const data = await sharp(join(directory, 'star-dean-profile.webp'))
    .extract({left: 480, top: 8, width: 370, height: 414})
    .webp({lossless: true})
    .toBuffer();
  const hash = createHash('sha256').update(data).digest('hex').slice(0, 12);
  const filename = `star-dean-portrait-${hash}.webp`;
  writeFileSync(join(directory, filename), data);
  process.stdout.write(`${filename}\n`);
}

build().catch(error => { console.error(error); process.exitCode = 1; });
