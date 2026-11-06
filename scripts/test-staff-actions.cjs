const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,file);
require.extensions['.tsx']=require.extensions['.ts'];
const {intakeAction,buildStaffActions,loadStaffActions,actionIntakeSelect}=require('../lib/staffActions.ts');
const base={id:'a',first_name:'Example',last_name:'Player',assessment_status:'requested',assessment_requested_at:'2026-10-02T12:00:00Z',assessment_contacted_at:null,completed_at:'2026-10-01T12:00:00Z',guardian_reviewed_at:'2026-10-01T12:00:00Z',created_at:'2026-10-01T12:00:00Z'};
test('assessment actions distinguish contact, arrangements and invalidated parent review',()=>{
 assert.match(intakeAction(base).task,/Contact family/);
 assert.match(intakeAction({...base,assessment_contacted_at:base.created_at}).task,/Agree assessment/);
 assert.match(intakeAction({...base,guardian_reviewed_at:null}).task,/review needed/);
 assert.equal(intakeAction({...base,assessment_status:'confirmed'}),null);
 for(const assessment_status of ['completed','cancelled'])assert.equal(intakeAction({...base,assessment_status,completed_at:null,guardian_reviewed_at:null}),null);
});
test('unfinished onboarding is awaiting the family, never implies a confirmed assessment request',()=>{
 const draft=intakeAction({...base,assessment_status:'not_requested',completed_at:null,assessment_requested_at:null});
 assert.equal(draft.category,'onboarding');assert.match(draft.task,/Awaiting family/);
 assert.match(intakeAction({...base,assessment_status:'confirmed',guardian_reviewed_at:null}).task,/Awaiting parent/);
 assert.equal(intakeAction({...base,assessment_status:'not_requested'}),null);
});
test('combined queue deduplicates intakes, sorts oldest first and links exact records',()=>{
 const requests=[{id:'r',player_id:'p',request_type:'reschedule',created_at:'2026-09-30T12:00:00Z'}];
 const actions=buildStaffActions([base,base],requests,[{id:'p',first_name:'Demo',last_name:'Player'}]);
 assert.equal(actions.length,2);assert.equal(actions[0].targetId,'r');assert.equal(actions[0].area,'sessionRequests');assert.equal(actions[0].name,'Demo Player');assert.equal(actions[1].targetId,'a');
 assert.equal(buildStaffActions([],requests,[])[0].name,'Player');
});
function mockDb(failure){const calls=[];let intakes=0;return {calls,from(table){const key=table==='player_intakes'?(['assessments','outcomes','onboarding'][intakes++]||'onboarding'):table;const result={data:key==='assessments'?[base]:key==='onboarding'?[]:key==='family_session_requests'?[{id:'r',player_id:'p',request_type:'absence',created_at:base.created_at}]:[{id:'p',first_name:'Demo',last_name:'Player'}],count:key==='assessments'?123:key==='family_session_requests'?1:0,error:key===failure?{message:'Denied'}:null};const q={then(resolve,reject){return Promise.resolve(result).then(resolve,reject)}};for(const method of ['select','eq','lte','in','or','order','limit'])q[method]=(...args)=>{calls.push({key,method,args});return q};return q}}}
test('read queries are bounded and retain exact counts beyond the display limit',async()=>{
 const db=mockDb();const result=await loadStaffActions(db);assert.equal(result.counts.assessments,123);assert.equal(result.items.length,2);
 assert.equal(db.calls.filter(c=>c.method==='limit'&&c.args[0]===100).length,4);
 assert.ok(db.calls.some(c=>c.key==='family_session_requests'&&c.method==='eq'&&c.args[0]==='status'&&c.args[1]==='pending'));
 assert.ok(db.calls.some(c=>c.key==='onboarding'&&c.method==='or'&&c.args[0]==='completed_at.is.null,guardian_reviewed_at.is.null'));
 assert.doesNotMatch(actionIntakeSelect,/details|photo|date_of_birth|contact_email|contact_phone/);
});
test('permission and query failures cannot become an empty success',async()=>{
 for(const key of ['assessments','outcomes','onboarding','family_session_requests','coaching_players'])await assert.rejects(()=>loadStaffActions(mockDb(key)),/unavailable/);
});

const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {StaffOverview}=require('../components/StaffHome.tsx');
const {StaffActionList}=require('../components/StaffActionList.tsx');
test('staff overview hides the action list from coaching-only roles',()=>{
 const data={sessions:[],recent:[],players:[],attendance:[],goals:[],observations:[],applications:0,requests:0,unread:0};
 const actionData={items:buildStaffActions([base],[],[]),counts:{assessments:1,onboarding:0,sessions:0}};
 const html=canManage=>renderToStaticMarkup(React.createElement(StaffOverview,{data,actionData,canManage,onNavigate:()=>{},now:0}));
 assert.doesNotMatch(html(false),/Staff action list|Example Player/);
 assert.match(html(true),/Staff action list/);assert.match(html(true),/Contact family about assessment/);
});
test('unavailable actions show an error, never an all-clear result',()=>{
 const html=renderToStaticMarkup(React.createElement(StaffActionList,{data:null,error:true,loading:false,onNavigate:()=>{}}));
 assert.match(html,/role="alert"/);assert.doesNotMatch(html,/No outstanding items/);
});

test('past confirmed assessment appears as a manual outcome follow-up, not a booking change',()=>{
 const finished={...base,assessment_status:'confirmed',assessment_starts_at:'2026-11-01T12:00:00Z'};
 const action=intakeAction(finished);
 assert.equal(action?.category,'assessments');assert.match(action.task,/Review assessment outcome/);
 assert.equal(intakeAction({...finished,assessment_status:'completed'}),null);
 assert.equal(intakeAction({...finished,assessment_starts_at:'2099-11-01T12:00:00Z'}),null);
});
