// Emit an additive catalogue migration; never rewrite applied migrations.
const fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {squadRoster}=require('../lib/playerSquad.ts');
const {extraBoots,extraBootChallenges}=require('../lib/playerCollectionExpansion.ts');
const {bootKey,bootMarker}=require('../lib/bootChallenges.ts');
const q=s=>"'"+s.replaceAll("'","''")+"'",arr=a=>'array['+a.map(q).join(',')+']';
const old=fs.readFileSync('supabase/migrations/20261029150000_player_collections.sql','utf8');
let validation=old.match(/create function star_private.validate_player_squad\(\)[\s\S]*?end \$\$;/)[0].replace('create function','create or replace function');
validation=validation.replace(/keepers text\[\]:=array\[[^\]]*\]/,'keepers text[]:='+arr(squadRoster.filter(p=>p.role==='Goalkeeper').map(p=>p.id))).replace(/roster text\[\]:=array\[[^\]]*\]/,'roster text[]:='+arr(squadRoster.map(p=>p.id)));
const allowed=old.match(/add constraint player_cosmetic_unlocks_cosmetic_check check\(cosmetic in \(([^;]+)\)\);/)[1];
const options=extraBootChallenges.flatMap(c=>c.decisions.flatMap(d=>d.choices.map(a=>`(${q(d.id)},${q(a.id)},${q(bootMarker(d.id))},${a.useful})`)));
const rewards=extraBoots.map(b=>`(${q(b.challenge)},${arr(extraBootChallenges.find(c=>c.id===b.challenge).decisions.map(d=>bootMarker(d.id)))},${q(bootKey(b.id))})`);
const sql=`-- Add 16 players and nine boot challenges. Existing progress, rewards and permissions are retained.\n${validation}\nalter table public.player_cosmetic_unlocks drop constraint player_cosmetic_unlocks_cosmetic_check;\nalter table public.player_cosmetic_unlocks add constraint player_cosmetic_unlocks_cosmetic_check check(cosmetic in (${allowed},${extraBoots.map(b=>q(bootKey(b.id))).join(',')}));\ninsert into star_private.boot_challenge_options(item,choice,marker,useful) values\n${options.join(',\n')};\ninsert into star_private.boot_reward_catalogue(challenge,requirements,cosmetic) values\n${rewards.join(',\n')};\nnotify pgrst,'reload schema';\n`;
const dest=process.argv[2];if(!dest||fs.existsSync(dest))throw Error('Provide a new output path; applied migrations must not be overwritten.');fs.writeFileSync(dest,sql);console.log(dest);
