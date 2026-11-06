const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');

test('Owner preview entry point is visible to the owner, not managers or coaches',()=>{
 const workspace=read('components/StaffWorkspace.tsx');
 const roster=read('components/StaffPlayers.tsx');
 const detail=read('components/StaffPlayer360.tsx');
 assert.match(workspace,/ownerPreview=\{role==="owner"\}/);
 assert.match(roster,/ownerPreview=\{ownerPreview\}/);
 assert.match(detail,/\{ownerPreview&&<button/);
 assert.match(detail,/\/staff\/player-preview\?player=/);
});

test('Snapshot is server-authorised and never grants impersonation or edit privileges',()=>{
 const sql=read('supabase/migrations/20261106193705_owner_player_space_read_only_preview.sql');
 assert.match(sql,/role='owner'/);
 assert.match(sql,/active=true/);
 assert.match(sql,/security definer/i);
 assert.match(sql,/grant execute on function public\.owner_player_space_preview\(uuid\) to authenticated/);
 assert.match(sql,/create policy owner_preview_player_card_photo_read.*for select to authenticated/s);
 assert.doesNotMatch(sql,/create policy owner_preview_player_card_photo_(insert|update|delete)/);
 const viewer=read('components/OwnerPlayerSpacePreview.tsx');
 assert.match(viewer,/db\.rpc\("owner_player_space_preview"/);
 assert.doesNotMatch(viewer,/service_role|serviceRole|SUPABASE_SERVICE_ROLE_KEY/);
});

test('Actual Player Space is rendered with writes and account actions blocked',()=>{
 const viewer=read('components/OwnerPlayerSpacePreview.tsx');
 const space=read('components/PlayerSpace.tsx');
 const page=read('app/staff/player-preview/page.tsx');
 assert.match(viewer,/readOnlyPreview/);
 assert.match(viewer,/onSavePractice=\{noWrite\}/);
 assert.match(viewer,/onUpdateProfile=\{noWrite\}/);
 assert.match(viewer,/onSaveGoal=\{noWrite\}/);
 assert.match(viewer,/\.\.\.previewActions/);
 assert.match(space,/onClickCapture=\{guardPreviewClick\}/);
 assert.match(space,/onSubmitCapture=\{guardPreviewSubmit\}/);
 assert.match(space,/onAccount=\{readOnlyPreview\?undefined:/);
 assert.match(space,/\{!readOnlyPreview&&<PlayerWelcome/);
 assert.match(page,/robots:\{index:false,follow:false\}/);
});
