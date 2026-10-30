const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
require.extensions['.tsx']=require.extensions['.ts'];require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {playerExperience,playerExperiences,requestedExperience,childrenLearning}=require('../lib/playerExperience.ts');
const {PlayerExperienceProvider}=require('../components/PlayerExperienceContext.tsx');
const {PlayerPersonalGoals}=require('../components/PlayerPersonalGoals.tsx');
const {PracticeRating}=require('../components/PlayerPracticeRatings.tsx');
const {PlayerCard}=require('../components/PlayerCard.tsx');
const {learningArticles}=require('../lib/playerLearning.ts');
const render=(experience,component,props)=>renderToStaticMarkup(React.createElement(PlayerExperienceProvider,{experience},React.createElement(component,props)));
test('exactly Children and Teenagers are offered, and legacy teen choices keep the teenage presentation',()=>{
 assert.deepEqual(playerExperiences.map(v=>v.label),['Children','Teenagers']);assert.deepEqual(playerExperiences.map(v=>v.ages),['7–11','12–18']);
 assert.equal(playerExperience('children'),'children');
 for(const value of ['junior','senior','teenagers',undefined,'unknown'])assert.equal(playerExperience(value),'teenagers');
 assert(requestedExperience('children'));assert(requestedExperience('teenagers'));assert(!requestedExperience('senior'));assert(!requestedExperience('junior'));
});
test('child goal prompts and teenage prompts differ while both keep the same saved personal goal',()=>{
 const props={playerId:'p',goals:[{id:'g',player_id:'p',goal:'My already saved football goal',status:'active',target_date:null}],onSaveGoal:async()=>{}};
 const child=render('children',PlayerPersonalGoals,props),teen=render('teenagers',PlayerPersonalGoals,props);
 assert(child.includes('Something I want to try'));assert(child.includes('Try a new football trick'));assert(teen.includes('GOALS I SET MYSELF.'));
 assert(child.includes('My already saved football goal'));assert(teen.includes('My already saved football goal'));assert(!teen.includes('Something I want to try'));
});
test('child check-in prompts keep the same optional one-to-five rating values',()=>{
 const props={kind:'confidence',value:4,onChange(){}};
 const child=render('children',PracticeRating,props),teen=render('teenagers',PracticeRating,props);
 assert(child.includes('Did you feel ready to try?'));assert(teen.includes('How confident did you feel?'));
 assert(child.includes('Confidence 4 of 5: Ready'));assert(teen.includes('Confidence 4 of 5: Confident'));
 assert.equal((child.match(/aria-pressed=/g)||[]).length,5);assert(child.includes('Optional'));
});
test('children have a short adaptation for every available introductory guide without changing guide IDs',()=>{
 const guides=learningArticles.filter(a=>a.level==='all');
 assert.equal(guides.length,Object.keys(childrenLearning).length);
 for(const guide of guides){const copy=childrenLearning[guide.id];assert(copy?.title);assert(copy?.summary);assert(copy?.tryIt);assert(copy.tryIt.length<180);}
});
test('player card setup offers two canonical saved preferences and retires both old option labels',()=>{
 const html=render('teenagers',PlayerCard,{name:'Alex',playerId:'p',userKey:'u',unlocks:[],demo:true,setup:true,onUpdateProfile:async()=>{}});
 assert(html.includes('value="children"'));assert(html.includes('value="teenagers"'));assert(!html.includes('younger teens'));assert(!html.includes('older teens'));assert(!html.includes('value="senior"'));assert(!html.includes('value="junior"'));
});
