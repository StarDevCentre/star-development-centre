// Export the two aligned generated v2 sheets without trimming/scaling garments.
// Usage: node scripts/export-builder-template.cjs training.png hoodie.png
// Requires sharp (also used by Next's image pipeline).
const sharp=require('sharp'),fs=require('fs');
(async()=>{const dest='public/player-space/builder/v2';fs.mkdirSync(dest,{recursive:true});for(const [name,input]of [['training',process.argv[2]],['hoodie',process.argv[3]]]){if(!input)throw Error('Supply the training and hoodie source sheets');const m=await sharp(input).metadata();if(m.width!==1536||m.height!==1024)throw Error('Expected unchanged 1536x1024 aligned sheet');for(const [view,left]of [['front',222],['back',854]])await sharp(input).extract({left,top:0,width:460,height:1024}).webp({quality:95,alphaQuality:100}).toFile(`${dest}/${name}-${view}.webp`);}})().catch(e=>{console.error(e);process.exitCode=1;});
