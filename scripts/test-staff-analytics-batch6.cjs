const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {staffAnalyticsSnapshot,emptyAnalytics,percentage}=require('../lib/staffAnalytics.ts');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const now=Date.parse('2026-11-06T18:00:00Z');
const data=()=>{
 const rows=emptyAnalytics();
 rows.players=[{id:'a',programme:'Prestige'},{id:'b',programme:'Sparks'},{id:'c',programme:'Prestige'}];
 rows.sessions=[{id:'s1',title:'Individual',programme:'Prestige',starts_at:'2026-11-01T16:00:00Z'},{id:'s2',title:'Group',programme:'Sparks',starts_at:'2026-11-02T16:00:00Z'},{id:'s3',title:'Old session',programme:'Prestige',starts_at:'2026-01-01T16:00:00Z'},{id:'s4',title:'Future session',programme:'Prestige',starts_at:'2026-11-08T16:00:00Z'}];
 rows.participants=[{session_id:'s1',player_id:'a'},{session_id:'s1',player_id:'c'},{session_id:'s2',player_id:'b'},{session_id:'s3',player_id:'c'},{session_id:'s4',player_id:'a'}];
 rows.attendance=[{session_id:'s1',player_id:'a',status:'present'},{session_id:'s1',player_id:'c',status:'absent'},{session_id:'s2',player_id:'b',status:'late'}];
 rows.assessments=[{player_id:'a',assessed_on:'2026-11-02',category:'Technical'},{player_id:'c',assessed_on:'2026-11-03',category:'Technical'},{player_id:'c',assessed_on:'2026-11-03',category:'Technical'}];
 rows.observations=[{player_id:'a',recorded_at:'2026-11-04T16:00:00Z',recorded_by:'staff-a'},{player_id:'b',recorded_at:'2026-11-04T16:00:00Z',recorded_by:'staff-b'}];
 rows.goals=[{player_id:'a',status:'working_on'},{player_id:'c',status:'achieved'}];
 return rows;
};
test('analytics uses actual booked rosters and correct attendance denominators',()=>{
 const s=staffAnalyticsSnapshot(data(),{now,days:30});
 assert.equal(s.sessions.length,2);
 assert.equal(s.rosterPlaces,3);
 assert.equal(s.summary.present,1);
 assert.equal(s.summary.late,1);
 assert.equal(s.summary.absent,1);
 assert.equal(s.attendedPercentage,'67%');
 assert.equal(s.registerCoverage,'100%');
});
test('unknown and non-roster attendance cannot inflate totals',()=>{
 const d=data();
 d.attendance.push({session_id:'s1',player_id:'b',status:'present'},{session_id:'not-booked',player_id:'a',status:'present'},{session_id:'s2',player_id:'b',status:'draft'});
 const result=staffAnalyticsSnapshot(d,{now,days:30});
 assert.equal(result.rosterPlaces,3);assert.equal(result.recorded,3);assert.equal(result.attendedPercentage,'67%');
});
test('duplicate attendance is counted once per session and player',()=>{
 const d=data();d.attendance.push({session_id:'s1',player_id:'a',status:'present'});
 const s=staffAnalyticsSnapshot(d,{now,days:30});assert.equal(s.recorded,3);assert.equal(s.summary.present,1);assert.equal(s.summary.unmarked,0);
});
test('unmarked registers and excused statuses are distinguishable from absences',()=>{
 const d=data();d.attendance=d.attendance.filter(a=>a.player_id!=='c');
 let s=staffAnalyticsSnapshot(d,{now,days:30});
 assert.equal(s.unmarked,1);assert.equal(s.registerCoverage,'67%');assert.equal(s.attendedPercentage,'100%');
 d.attendance.push({session_id:'s1',player_id:'c',status:'excused'});
 s=staffAnalyticsSnapshot(d,{now,days:30});
 assert.equal(s.unmarked,0);assert.equal(s.summary.excused,1);assert.equal(s.attendedPercentage,'100%');
});
test('programme filters combine session programme and current player visibility',()=>{
 const s=staffAnalyticsSnapshot(data(),{now,days:30,programme:'Prestige'});
 assert.equal(s.sessions.length,1);assert.equal(s.scopedPlayers.length,2);
 assert.equal(s.rosterPlaces,2);assert.equal(s.summary.late,0);
 assert.equal(s.assessedPlayers,2);assert.equal(s.observedPlayers,1);
 assert.equal(s.byCategory.find(x=>x.category==='Technical').count,2);
});
test('old and future sessions cannot be counted as completed-period sessions',()=>{
 const d=data();const s=staffAnalyticsSnapshot(d,{now,days:30});
 assert.equal(s.sessions.length,2);
 assert.equal(s.bySession.some(x=>x.id==='s3'||x.id==='s4'),false);
});
test('empty data has neither invented completion nor invented performance',()=>{
 const s=staffAnalyticsSnapshot(emptyAnalytics(),{now,days:30});
 assert.equal(s.attendedPercentage,'—');assert.equal(s.registerCoverage,'—');
 assert.equal(s.unmarked,0);assert.equal(s.assessedPlayers,0);
 assert.equal(percentage(0,0),'—');
});
test('source uses the authenticated shared browser client, never a separate unauthenticated client',()=>{
 const src=read('components/SessionAnalytics.tsx');
 assert.match(src,/supabaseBrowser as db/);
 assert.doesNotMatch(src,/createClient\(/);
 assert.match(src,/if\(!active\)return/);
});
test('session analytics queries exclude cancelled and future sessions, and use reporting window',()=>{
 const src=read('components/SessionAnalytics.tsx');
 assert.match(src,/\.is\("cancelled_at",null\)\.gte\("starts_at",lower\)\.lte\("starts_at",upper\)/);
 assert.match(src,/\.gte\("recorded_at",lower\)\.lte\("recorded_at",upper\)/);
 assert.match(src,/\.gte\("assessed_on",lower\.slice\(0,10\)\)/);
 assert.match(src,/\.in\("session_id",ids\)/);
 assert.match(src,/setTruncated\(cap\)/);
 assert.match(src,/data reached a query limit/);
});
test('reporting UI distinguishes roster completion from attendance and alerts on partial loads',()=>{
 const src=read('components/SessionAnalytics.tsx');
 assert.match(src,/registerCoverage/);
 assert.match(src,/Missing marks are not treated as absences/);
 assert.match(src,/role="alert" className="staff-analytics-error"/);
 assert.match(src,/role="progressbar"/);
 assert.match(src,/aria-valuetext=/);
 assert.match(src,/disabled=\{loading\}/);
});
test('manager role still gates analytics and hidden views do not keep querying in background',()=>{
 const src=read('components/StaffWorkspace.tsx');
 assert.match(src,/canManage\?<SessionAnalytics active=\{section==="analytics"&&!menuOpen\}/);
 const analytics=read('components/SessionAnalytics.tsx');
 assert.match(analytics,/if\(!active\)return/);
 assert.match(analytics,/return\(\)=>\{live=false;\}/);
});
test('staff shell has keyboard skip-link, main landmark and high-contrast focus controls',()=>{
 const src=read('components/StaffAppShell.tsx');
 const css=read('components/staff-analytics-polish.css');
 assert.match(src,/className="staff-skip-link"/);
 assert.match(src,/<main className="staff-app-content" id="staff-app-content" tabIndex=\{-1\} aria-label="Staff workspace content"/);
 assert.match(css,/\.staff-skip-link:focus-visible/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.staff-analytics-v2 :is\(button,select\):focus-visible/);
});
test('new styling stays scoped to staff analytics and installed touch PWA',()=>{
 const css=read('components/staff-analytics-polish.css');
 assert.ok(css.includes('.staff-app--installed-touch .staff-analytics-v2'));
 assert.ok(!css.includes('body{'));
 assert.ok(!css.includes('.site-header{'));
});
