const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {staffTouchMode}=require('../lib/staffTouchMode.ts');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const base={standalone:false,fullscreen:false,iosStandalone:false,coarsePointer:false,touchPoints:0,screenWidth:393,screenHeight:852,viewportWidth:393};
test('installed Android PWA is detected even when Chrome gives it a virtual desktop viewport',()=>{
 assert.deepEqual(staffTouchMode({...base,standalone:true,coarsePointer:true,viewportWidth:980}),{installedTouch:true,virtualDesktopViewport:true});
 assert.deepEqual(staffTouchMode({...base,standalone:true,coarsePointer:true}),{installedTouch:true,virtualDesktopViewport:false});
});
test('installed iOS and full-screen touch PWAs use the same compact mode',()=>{
 assert.equal(staffTouchMode({...base,iosStandalone:true,touchPoints:5}).installedTouch,true);
 assert.equal(staffTouchMode({...base,fullscreen:true,touchPoints:1}).installedTouch,true);
});
test('desktop installations and regular phone browser views do not inherit installed-app styles',()=>{
 assert.equal(staffTouchMode({...base,standalone:true,screenWidth:1920,screenHeight:1080,touchPoints:1}).installedTouch,false);
 assert.equal(staffTouchMode({...base,coarsePointer:true}).installedTouch,false);
 assert.equal(staffTouchMode({...base,standalone:true,touchPoints:0}).installedTouch,false);
});
test('PWA mode logic is shared by app shell and calendar, while manual view choices remain respected',()=>{
 const shell=read('components/StaffAppShell.tsx'),cal=read('components/StaffCalendar.tsx');
 assert.match(shell,/readStaffTouchMode\(\)/);
 assert.match(cal,/readStaffTouchMode\(\)\.installedTouch\|\|window\.matchMedia/);
 assert.match(cal,/if\(manualView\.current\)return/);
 assert.match(cal,/manualView\.current=true;setView\(v\)/);
 assert.match(cal,/data-view=\{view\}/);
});
test('calendar keeps a usable day agenda without a 24-hour scroller on installed phones',()=>{
 const cal=read('components/StaffCalendar.tsx'),css=read('components/staff-calendar.css');
 assert.match(cal,/className="calendar-agenda"/);
 assert.match(cal,/className="calendar-touch-tip"/);
 assert.match(css,/\.staff-app--installed-touch \.staff-calendar\[data-view="day"\] \.calendar-scroll\s*\{\s*display:none/);
 assert.match(css,/\.staff-app--installed-touch \.staff-calendar\[data-view="day"\] \.calendar-touch-tip/);
 assert.match(css,/\.staff-app--installed-touch \.calendar-dialog/);
});
test('calendar modal closes cleanly on Escape and restores keyboard focus to original event',()=>{
 const cal=read('components/StaffCalendar.tsx');
 assert.match(cal,/onCancel=\{e=>\{e\.preventDefault\(\);onClose\(\)\}\}/);
 assert.match(cal,/previousFocus\.current\?\.focus\(\{preventScroll:true\}\)/);
 assert.match(cal,/modal\?\.showModal\(\)/);
 assert.match(cal,/aria-label="Session details"/);
});
test('next appointment and quick coaching actions are prioritised on PWA home only',()=>{
 const home=read('components/StaffHome.tsx'),css=read('components/staff-app.css');
 assert.match(home,/className="staff-home-dashboard"/);
 for(const selector of [
 '.staff-app--installed-touch .staff-home-dashboard>.staff-home',
 '.staff-app--installed-touch .staff-home>.staff-next-session',
 '.staff-app--installed-touch .staff-home>.staff-home-actions-panel',
 '.staff-app--installed-touch .staff-home-dashboard>.staff-48h'
 ])assert.ok(css.includes(selector),'Missing PWA-specific ordering rule: '+selector);
 assert.match(css,/\.staff-app--installed-touch \.staff-home>\.staff-next-session\{order:0\}/);
 assert.match(css,/\.staff-app--installed-touch \.staff-home-dashboard>\.staff-48h\{order:1\}/);
});
test('offline indicator never claims updates are saved and reconnect refresh does not reload unsaved forms',()=>{
 const shell=read('components/StaffAppShell.tsx');
 assert.match(shell,/window\.addEventListener\("offline",update\)/);
 assert.match(shell,/window\.addEventListener\("online",update\)/);
 assert.match(shell,/window\.dispatchEvent\(new Event\("star:staff-refresh"\)\)/);
 assert.doesNotMatch(shell,/window\.location\.reload|location\.reload/);
 assert.match(shell,/Saved information may be out of date/);
 assert.match(shell,/role="status" aria-live="polite"/);
});
test('reconnect refresh is scoped to visible home, next sessions and calendar without mutating bookings',()=>{
 for(const file of ['components/StaffHome.tsx','components/StaffNext48Hours.tsx','components/StaffCalendar.tsx']){
  assert.ok(read(file).includes('star:staff-refresh'),file+' does not listen for refresh');
 }
 const cal=read('components/StaffCalendar.tsx');
 assert.match(cal,/setNetworkRevision\(v=>v\+1\)/);
 assert.doesNotMatch(read('components/StaffAppShell.tsx'),/from\("training_sessions"\)|from\('training_sessions'\)/);
});
test('installed PWA dock and menus preserve keyboard and screen reader accessibility',()=>{
 const shell=read('components/StaffAppShell.tsx'),css=read('components/staff-app.css');
 assert.match(shell,/onCancel=\{e=>\{e\.preventDefault\(\);close\(\)\}\}/);
 assert.match(shell,/data-staff-close/);
 assert.match(shell,/aria-label="Staff navigation"/);
 assert.match(shell,/aria-label="All staff tools"/);
 assert.match(css,/\.staff-app--installed-touch \.staff-app-dock>button/);
 assert.match(css,/env\(safe-area-inset-bottom\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('specialist phone layouts remain independent of desktop mode viewport width',()=>{
 const css=read('components/staff-app.css');
 assert.match(css,/\.staff-app--installed-touch :is\(input:not\(\[type=checkbox\]\)/);
 assert.match(css,/\.staff-app--installed-touch \.staff-app-content :is\(h2,h3,h4,section,details\)/);
 assert.match(css,/\.staff-app--installed-touch \.staff-app-sheet/);
});
