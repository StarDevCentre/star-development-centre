const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
require.extensions['.tsx']=require.extensions['.ts'];require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {playerExperience}=require('../lib/playerExperience.ts');
const {PlayerPersonalGoals}=require('../components/PlayerPersonalGoals.tsx');
const {PracticeRating}=require('../components/PlayerPracticeRatings.tsx');
const {PlayerCard}=require('../components/PlayerCard.tsx');
const {PlayerSpace}=require('../components/PlayerSpace.tsx');
const {defaultProfile,emptySpaceData}=require('../lib/playerSpace.ts');
const render=(component,props)=>renderToStaticMarkup(React.createElement(component,props));
test('all saved presentation preferences use the shared illustrated style',()=>{
 for(const value of ['children','junior','senior','teenagers',undefined,'unknown'])assert.equal(playerExperience(value),'teenagers');
});
test('shared goal wording retains saved personal goals and their status',()=>{
 const html=render(PlayerPersonalGoals,{playerId:'p',goals:[{id:'g',player_id:'p',goal:'My already saved football goal',status:'active',target_date:null}],onSaveGoal:async()=>{}});
 assert(html.includes('GOALS I SET MYSELF.'));assert(html.includes('My already saved football goal'));assert(html.includes('I DID IT'));
});
test('shared check-ins keep optional one-to-five values and the existing labels',()=>{
 const html=render(PracticeRating,{kind:'confidence',value:4,onChange(){}});
 assert(html.includes('How confident did you feel?'));assert(html.includes('Confidence 4 of 5: Confident'));
 assert.equal((html.match(/aria-pressed=/g)||[]).length,5);assert(html.includes('Optional'));
});
test('player card setup has no age-style selector and keeps normal customisation',()=>{
 const html=render(PlayerCard,{name:'Alex',playerId:'p',userKey:'u',unlocks:[],demo:true,setup:true,onUpdateProfile:async()=>{}});
 for(const label of ['Your colour','Your avatar','Shirt name','Shirt number','My football ambitions','SAVE MY CARD'])assert(html.includes(label));
 for(const label of ['Player Space style','value="children"','value="teenagers"','younger teens','older teens'])assert(!html.includes(label));
});
test('legacy child and teenage profiles render the same Home, with customisation before session cards',()=>{
 const data={...emptySpaceData,players:[{id:'p',first_name:'Alex',last_name:'Example',programme:'Assessment'}],profiles:[{...defaultProfile,player_id:'p',photo_path:null,experience:'children'}]};
 const props={data,userKey:'u',demo:true,onUpdateProfile:async()=>{},onSaveGoal:async()=>{},onCelebrate:async()=>{},onSavePractice:async()=>{}};
 const legacy=render(PlayerSpace,props);
 const standard=render(PlayerSpace,{...props,data:{...data,profiles:[{...data.profiles[0],experience:'teenagers'}]}});
 assert.equal(legacy,standard);
 assert(legacy.indexOf('STYLE MY SPACE')<legacy.indexOf('ps-next-session-hero'));
 assert(legacy.includes('Personalise my card'));assert(!legacy.includes('ps-experience-children'));
});
