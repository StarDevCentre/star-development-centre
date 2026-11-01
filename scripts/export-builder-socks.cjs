// Usage: node scripts/export-builder-socks.cjs manifest.json
// Each entry supplies source and measured front/back {dx,dy} offsets. Preserve
// the fixed template scale; ship only the 460x190 lower-leg strip (drawn at y740).
const fs=require('fs'),sharp=require('sharp');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
 fs.mkdirSync('public/player-space/builder/v2/socks',{recursive:true});
 for(const [id,entry] of Object.entries(manifest)){
  if(!/^[a-z0-9-]+$/.test(id))throw Error('Invalid sock ID');
  const size=await sharp(entry.source).metadata();
  if(size.width!==1536||size.height!==1024)throw Error('Keep the aligned template canvas');
  for(const [view,left] of [['front',222],['back',854]]){
   const {dx=0,dy=0}=entry.offsets?.[view]??{};
   if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)>40||Math.abs(dy)>10)throw Error('Invalid sock alignment');
   await sharp(entry.source).extract({left:left+dx,top:740+dy,width:460,height:190}).webp({quality:95,alphaQuality:100}).toFile(`public/player-space/builder/v2/socks/${id}-${view}.webp`);
  }
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
