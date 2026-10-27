// Compose app icons from the existing, unaltered official STAR logo.
const sharp=require('sharp');
const path=require('node:path');
const fs=require('node:fs/promises');
const root=path.join(__dirname,'..');
(async()=>{
 const directory=path.join(root,'public/parent-app/icons');await fs.mkdir(directory,{recursive:true});
 const plate=Buffer.from('<svg width="512" height="512"><rect x="54" y="64" width="404" height="300" rx="48" fill="#faf9f5"/><text x="256" y="433" text-anchor="middle" fill="#e8d3a0" font-family="DejaVu Sans,sans-serif" font-size="36" font-weight="700" letter-spacing="4">PARENTS</text></svg>');
 const logo=await sharp(path.join(root,'public/images/star-colour-transparent.webp')).resize(350,175,{fit:'contain'}).png().toBuffer();
 const master=await sharp({create:{width:512,height:512,channels:4,background:'#102943'}}).composite([{input:plate},{input:logo,left:81,top:126}]).png().toBuffer();
 await fs.writeFile(path.join(directory,'icon-512.png'),master);
 await sharp(master).resize(192,192).png().toFile(path.join(directory,'icon-192.png'));
 console.log('Created STAR Parents app icons.');
})().catch(error=>{console.error(error);process.exitCode=1});
