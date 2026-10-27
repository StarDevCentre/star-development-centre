const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),ts=require('typescript');
const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../lib/parentExperiencePreview.ts'),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const context={exports:{}};vm.runInNewContext(code,context);const {safeSpace,defaultSpace,samplePlayers,homeWidgets,moveWidget,previewSections,assessmentSeries,spaceLooks,applySpaceLook,activeSpaceLook}=context.exports;
const plain=x=>JSON.parse(JSON.stringify(x));
assert.deepEqual(plain(safeSpace(null)),plain(defaultSpace()));
const broken=safeSpace({accent:'red',order:['coach','coach','invented'],hidden:['progress','bad'],wide:['bad'],name:'A'.repeat(100),number:'<9',hero:'bad'});
assert.equal(broken.accent,'gold');assert.equal(broken.name.length,14);assert.equal(broken.number,'7');assert.equal(broken.hero,'shirt');
assert.deepEqual(plain(broken.order),['coach','progress','milestones','moments','learning','pitch']);assert.deepEqual(plain(broken.hidden),['progress']);
assert.equal(safeSpace({},samplePlayers[1]).name,'SAM');assert.equal(safeSpace({},samplePlayers[1]).number,'11');
const original=[...homeWidgets];assert.deepEqual(plain(moveWidget(original,'coach',-1)),['coach','progress','milestones','moments','learning','pitch']);
assert.deepEqual(plain(moveWidget(original,'progress',-1)),plain(original));assert.deepEqual(plain(moveWidget(original,'pitch',1)),plain(original));assert.equal(original[0],'progress');
assert.equal(previewSections.length,7);assert.ok(assessmentSeries.every(s=>s.values.length===4&&s.values.every(v=>v>=1&&v<=4.5)));
const component=fs.readFileSync(path.join(__dirname,'../components/ParentExperiencePreview.tsx'),'utf8');
assert.ok(!/supabase|fetch\(|XMLHttpRequest|\.sendBeacon\(/.test(component),'Preview must not call production data or messaging APIs');
const css=fs.readFileSync(path.join(__dirname,'../app/parent-portal/preview/preview.css'),'utf8');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));assert.ok(css.includes('position:sticky'));
console.log('Parent experience preview: settings sanitisation, player defaults, complete widget ordering, bounded movement, sample scales and isolation checks passed.');

// Old browser preferences migrate without losing the player's identity or layout choices.
const migrated=safeSpace({accent:'ice',atmosphere:'midnight',name:'ALEX STAR',number:'23',order:['coach','progress'],hidden:['learning']});
assert.equal(migrated.typeface,'sport');assert.equal(migrated.name,'ALEX STAR');assert.equal(migrated.number,'23');assert.equal(migrated.accent,'ice');
for(const look of spaceLooks){
 const changed=applySpaceLook(migrated,look.id);
 assert.equal(activeSpaceLook(changed),look.id);
 assert.deepEqual(plain(safeSpace(JSON.parse(JSON.stringify(changed)))),plain(changed));
 assert.equal(changed.name,'ALEX STAR');assert.equal(changed.number,'23');
 assert.deepEqual(plain(changed.order),plain(migrated.order));assert.deepEqual(plain(changed.hidden),['learning']);
}
const invalid=safeSpace({typeface:'serif',cards:'unknown',layout:'unknown',stage:'unknown',glow:'unknown',atmosphere:'unknown',accent:'unknown'});
assert.equal(invalid.typeface,'sport');assert.equal(invalid.cards,'glass');assert.equal(invalid.layout,'balanced');assert.equal(invalid.stage,'floating');assert.equal(invalid.atmosphere,'stadium');
assert.equal(activeSpaceLook({...defaultSpace(),cards:'outline'}),'custom');
assert.equal(applySpaceLook(migrated,'unknown'),migrated);
console.log('Design studio: all six looks survive storage, migrate legacy preferences and preserve player identity and card choices.');

// Validate all nine pitch shapes and every role movement in both game formats.
const pitchSource=fs.readFileSync(path.join(__dirname,'../lib/parentPitchPreview.ts'),'utf8');
const pitchContext={exports:{}};vm.runInNewContext(ts.transpileModule(pitchSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,pitchContext);
const {pitchFormations,samplePitchProfiles,positionStatus,roleMovement,projectPitchPoint,selectFormationSlot}=pitchContext.exports;
assert.deepEqual(plain(pitchFormations.filter(f=>f.format===9).map(f=>f.id)),['2-4-2','3-3-2','3-2-3']);
assert.deepEqual(plain(pitchFormations.filter(f=>f.format===11).map(f=>f.id)),['4-3-3','4-4-2','4-2-3-1','3-5-2','4-5-1','3-1-4-2']);
for(const f of pitchFormations){
 assert.equal(f.slots.length,f.format,f.id);assert.equal(new Set(f.slots.map(s=>s.id)).size,f.format);
 assert.equal(f.id.split('-').map(Number).reduce((a,b)=>a+b,0),f.format-1);
 for(const slot of f.slots){
  for(const phase of ['attack','defend']){
   const move=roleMovement(slot,phase,f.format);assert.equal(move.points.length,3);assert.equal(move.labels.length,3);
   assert.deepEqual(plain(move.points[0]),{x:slot.x,y:slot.y});
   assert.ok(move.points.some(p=>p.x!==slot.x||p.y!==slot.y));
   for(const p of move.points){assert.ok(p.x>=0&&p.x<=100&&p.y>=0&&p.y<=100);for(const stadium of [false,true]){const drawn=projectPitchPoint(p,stadium);assert.ok(drawn.x>0&&drawn.x<600&&drawn.y>0&&drawn.y<720);}}
  }
 }
}
const alex=samplePitchProfiles.alex;const first=pitchFormations[0];const rw=pitchFormations.find(f=>f.id==='4-3-3').slots.find(s=>s.id==='RW');
assert.equal(positionStatus(rw,alex),'main');assert.equal(selectFormationSlot(first,rw,alex).id,'RM');
const noWinger=pitchFormations.find(f=>f.id==='3-5-2');assert.equal(selectFormationSlot(noWinger,rw,alex).group,'forward');
assert.equal(positionStatus(noWinger.slots.find(s=>s.id==='RWB'),alex),'explore','Wing back must not be mislabelled as a winger');
for(const file of ['ParentPitchProfile.tsx','ParentSpaceDesignStudio.tsx']){const src=fs.readFileSync(path.join(__dirname,'../components',file),'utf8');assert.ok(!/supabase|fetch\(|XMLHttpRequest|\.sendBeacon\(/.test(src),'Child preview components must remain isolated');}
assert.ok(component.includes('previewDevelopmentPlans[playerId].targets'),'Report shares the same plan as the pitch');
console.log('Pitch profile: all nine formations, role counts, attack/defend paths, view bounds, formation fallback and coach-role separation passed.');
