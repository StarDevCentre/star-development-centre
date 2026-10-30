const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
require.extensions['.tsx']=require.extensions['.ts'];require.extensions['.css']=()=>{};
const {parentPlayerCardFor,loadParentPlayerCard}=require('../lib/parentPlayerCard.ts');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {ParentPlayerCard}=require('../components/ParentPlayerCard.tsx');
const profile=(player_id='p')=>({player_id,shirt_name:'ALEX',shirt_number:7,ambition:'Enjoy playing midfield',photo_path:player_id+'/card.webp'});
const award=(player_id='p',awarded_on='2026-10-20')=>({id:player_id+'-'+awarded_on,player_id,title:'Brave Heart',description:'Kept asking for the ball.',awarded_on,badge_id:'brave-heart-silver'});

test('card summaries exclude other families and distinguish personal goals from coaching goals',()=>{
 const card=parentPlayerCardFor('p',profile('other'),[{player_id:'other',goal:'Private goal',status:'active'}],[award('other')]);
 assert.equal(card.profile,null);assert.equal(card.goal,'');assert.equal(card.award,null);
});
test('active personal goals take priority, then her own ambition; archived and achieved goals stay out',()=>{
 const goals=[{player_id:'p',goal:'Old goal',status:'archived'},{player_id:'p',goal:'Completed goal',status:'achieved'},{player_id:'p',goal:'  Ask for the ball  ',status:'active'}];
 assert.equal(parentPlayerCardFor('p',profile(),goals,[]).goal,'Ask for the ball');
 assert.equal(parentPlayerCardFor('p',profile(),goals.slice(0,2),[]).goal,'Enjoy playing midfield');
 assert.equal(parentPlayerCardFor('p',null,[],[]).goal,'');
});
test('latest real award is chosen without mutating input or inventing an award',()=>{
 const awards=[award('p','2026-09-12'),award('other','2026-10-30'),award('p','2026-10-20')],before=JSON.stringify(awards);
 assert.equal(parentPlayerCardFor('p',null,[],awards).award.awarded_on,'2026-10-20');
 assert.equal(JSON.stringify(awards),before);assert.equal(parentPlayerCardFor('p',null,[],[]).award,null);
});

function database(rows,{photoError=false}={}){
 const calls=[],photos=[];
 const db={from(table){const query={then(resolve,reject){return Promise.resolve(rows[table]||{data:[],error:null}).then(resolve,reject)}};for(const method of ['select','eq','order','limit','maybeSingle'])query[method]=(...args)=>{calls.push({table,method,args});return query;};return query;},storage:{from(bucket){return{async createSignedUrl(path,seconds){photos.push({bucket,path,seconds});return photoError?{data:null,error:{message:'Unavailable'}}:{data:{signedUrl:'https://private.example/signed-photo'},error:null};}}}}};
 return {db,calls,photos};
}
const rows=()=>({player_space_profiles:{data:profile(),error:null},player_personal_goals:{data:[{player_id:'p',goal:'Ask for the ball',status:'active'}],error:null},player_achievements:{data:[award()],error:null}});
test('loader scopes every read to the selected player, bounds history, and signs only private card photos',async()=>{
 const {db,calls,photos}=database(rows()),card=await loadParentPlayerCard(db,'p');
 for(const table of ['player_space_profiles','player_personal_goals','player_achievements']){
  assert(calls.some(c=>c.table===table&&c.method==='eq'&&c.args[0]==='player_id'&&c.args[1]==='p'));
  assert(!calls.some(c=>c.table===table&&c.method==='select'&&c.args[0]==='*'));
 }
 assert(calls.some(c=>c.table==='player_personal_goals'&&c.method==='eq'&&c.args[0]==='status'&&c.args[1]==='active'));
 for(const table of ['player_personal_goals','player_achievements'])assert(calls.some(c=>c.table===table&&c.method==='limit'&&c.args[0]===1));
 assert.deepEqual(photos,[{bucket:'player-card-photos',path:'p/card.webp',seconds:3600}]);assert.equal(card.photoUrl,'https://private.example/signed-photo');
});
test('denied reads fail explicitly; unavailable or foreign photos use the shirt without signing another player path',async()=>{
 const denied=rows();denied.player_achievements={data:null,error:{message:'Denied'}};
 await assert.rejects(loadParentPlayerCard(database(denied).db,'p'));
 const foreign=rows();foreign.player_space_profiles.data.photo_path='other/card.webp';const mock=database(foreign);
 assert.equal((await loadParentPlayerCard(mock.db,'p')).photoUrl,undefined);assert.deepEqual(mock.photos,[]);
 const unavailable=await loadParentPlayerCard(database(rows(),{photoError:true}).db,'p');assert.equal(unavailable.photoUrl,undefined);assert.equal(unavailable.goal,'Ask for the ball');
});
const props={player:{id:'p',first_name:'Alex',last_name:'Sample',programme:'flyers'},programme:'Flyers',shirtName:'ALEX',shirtNumber:'7',photoMode:false,focus:'Look before receiving',onCustomise(){},onDevelopment(){},onAchievement(){}};
test('render uses actual goal, badge, date and reason; missing records create no empty highlight panels',()=>{
 const data=parentPlayerCardFor('p',profile(),[],[award()]);
 const html=renderToStaticMarkup(React.createElement(ParentPlayerCard,{...props,data}));
 assert(html.includes('Enjoy playing midfield'));assert(html.includes('/badges/brave-heart-silver.png'));assert(html.includes('20 Oct 2026'));assert(html.includes('Kept asking for the ball.'));
 const empty=renderToStaticMarkup(React.createElement(ParentPlayerCard,{...props,data:null}));assert(!empty.includes('ppx-player-card-highlights'));assert(!empty.includes('LATEST ACHIEVEMENT'));
 const foreign=renderToStaticMarkup(React.createElement(ParentPlayerCard,{...props,data:{...data,player_id:'other'}}));assert(!foreign.includes('Enjoy playing midfield'));
});
test('photo mode uses her chosen photo and safely falls back to the personalised shirt',()=>{
 const data={...parentPlayerCardFor('p',profile(),[],[]),photoUrl:'https://private.example/photo'};
 const photo=renderToStaticMarkup(React.createElement(ParentPlayerCard,{...props,photoMode:true,data}));assert(photo.includes('https://private.example/photo'));assert(!photo.includes('ppx-shirt'));
 const shirt=renderToStaticMarkup(React.createElement(ParentPlayerCard,{...props,photoMode:true,data:{...data,photoUrl:undefined}}));assert(shirt.includes('Personalised digital STAR shirt'));assert(!shirt.includes('/images/star-player-grass'));
});
