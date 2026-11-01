// Usage: node scripts/export-builder-branded.cjs manifest.json
// Manifest maps approved catalogue IDs to unchanged aligned 1536x1024 sheets.
const fs=require('fs'),sharp=require('sharp');
(async()=>{const items=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));for(const [id,input]of Object.entries(items)){if(!/^[a-z0-9-]+$/.test(id))throw Error('Invalid ID');const m=await sharp(input).metadata();if(m.width!==1536||m.height!==1024)throw Error('Keep the original template canvas');for(const [view,left]of [['front',222],['back',854]])await sharp(input).extract({left,top:0,width:460,height:1024}).webp({quality:95,alphaQuality:100}).toFile(`public/player-space/builder/v2/${id}-${view}.webp`);}})().catch(e=>{console.error(e);process.exitCode=1;});
