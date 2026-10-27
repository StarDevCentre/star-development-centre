"use client";
import {useEffect,useRef,useState} from 'react';
import {supabaseBrowser as db} from '../lib/supabaseBrowser';
import {applicationServerKey,defaultParentAlerts,parentPushRegistration,parentAlertChoices,pushSupport,removeParentDevicePush,type ParentAlertPreferences,type ParentAlertCategory} from '../lib/parentPush';
import {ParentInstall} from './ParentAppChrome';
import './parent-updates.css';

export function ParentPhoneAlerts({userKey,demo=false}:{userKey:string;demo?:boolean}){
 const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 const [attempt,setAttempt]=useState(0);
 const[prefs,setPrefs]=useState<ParentAlertPreferences>(defaultParentAlerts),[support,setSupport]=useState('checking'),[ready,setReady]=useState(false),[device,setDevice]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[devices,setDevices]=useState(0);
 useEffect(()=>{let active=true;setReady(false);setSupport(pushSupport());
  if(demo){setReady(true);return;}
  void(async()=>{try{
   if(!db)throw new Error('Please sign in to change alerts.');
   const [p,s]=await Promise.all([db.from('parent_push_preferences').select('enabled,categories,quiet_hours,consented_at').eq('user_id',userKey).maybeSingle(),db.from('parent_push_subscriptions').select('endpoint').eq('user_id',userKey)]);
   if(p.error||s.error)throw new Error('Could not load your alert settings. Please try again.');
   const registration='serviceWorker'in navigator?await navigator.serviceWorker.getRegistration('/parent-portal'):undefined;
   const subscription=await registration?.pushManager?.getSubscription();
   if(active){setPrefs(p.data||defaultParentAlerts);setDevices(s.data.length);setDevice(!!subscription&&s.data.some(row=>row.endpoint===subscription.endpoint));setReady(true);}
  }catch(value){if(active)setError(value instanceof Error?value.message:'Could not load alert settings.');}})();
  return()=>{active=false;};
 },[userKey,demo,attempt]);
 async function save(next:ParentAlertPreferences){
  if(!db||!alive.current)throw new Error('Please sign in again.');
  const result=await db.from('parent_push_preferences').upsert({user_id:userKey,...next,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(result.error)throw new Error('Could not save alert choices. Please try again.');
  setPrefs(next);
 }
 async function enable(){
  if(busy)return;
  if(demo){setNotice('This is a sample. Sign in to your own linked account to enable phone alerts.');return;}
  setBusy(true);setError('');setNotice('');let fresh:PushSubscription|null=null;
  try{
   if(!db||support!=='supported')throw new Error('Open your parent portal in a supported browser or home-screen app.');
   // Request permission directly from this explicit tap, never on first login.
   const permission=await Notification.requestPermission();
   if(permission!=='granted')throw new Error(permission==='denied'?'Notifications are blocked in your browser settings. You can still read every update here.':'You can enable phone alerts later.');
   const session=await db.auth.getUser();if(!alive.current||session.data.user?.id!==userKey)throw new Error('Please sign in again.');
   const key=await db.rpc('parent_push_public_key');
   if(key.error||!key.data)throw new Error('Phone alerts are taking a breather. Please try again later.');
   const registration=await parentPushRegistration();
   let subscription=await registration.pushManager.getSubscription();
   if(!subscription){subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:applicationServerKey(key.data)});fresh=subscription;}
   const next={...prefs,enabled:true,consented_at:prefs.consented_at||new Date().toISOString()};
   await save(next);
   if(!alive.current)throw new Error('Please sign in again.');
   let result=await db.rpc('register_parent_push_subscription',{subscription:{...subscription.toJSON(),account_id:userKey}});
   if(result.error?.code==='42501'&&!fresh){
    if(!alive.current)throw new Error('Please sign in again.');
    await subscription.unsubscribe();
    subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:applicationServerKey(key.data)});fresh=subscription;
    result=await db.rpc('register_parent_push_subscription',{subscription:{...subscription.toJSON(),account_id:userKey}});
   }
   if(result.error)throw new Error(result.error.code==='42501'?'This device needs a fresh subscription. Turn alerts off on this device, then enable them again.':result.error.message.includes('Five devices')?'Five devices are already enabled. Turn off alerts everywhere to start fresh.':'Could not enable alerts on this device. Please try again.');
   setDevice(true);setDevices(n=>device?n:n+1);setNotice('Phone alerts are on for this device. You’re in control of what arrives.');
  }catch(value){if(fresh)await fresh.unsubscribe().catch(()=>false);setError(value instanceof Error?value.message:'Could not enable phone alerts.');}
  finally{setBusy(false);}
 }
 async function updateChoices(){if(busy)return;setBusy(true);setError('');setNotice('');try{if(!demo)await save(prefs);setNotice(demo?'Sample alert choices updated for this visit.':'Your alert choices are saved.');}catch(value){setError(value instanceof Error?value.message:'Could not save choices.');}finally{setBusy(false);}}
 async function disable(everywhere:boolean){if(busy||demo)return;setBusy(true);setError('');setNotice('');try{
  if(everywhere){await save({...prefs,enabled:false});const result=await db!.from('parent_push_subscriptions').delete().eq('user_id',userKey);if(result.error)throw new Error('Alerts are paused, but devices could not be removed. Please try again.');}
  await removeParentDevicePush(userKey);setDevice(false);setDevices(n=>everywhere?0:Math.max(0,n-1));setNotice(everywhere?'Phone alerts are off on all your devices.':'Phone alerts are off on this device.');
 }catch(value){setError(value instanceof Error?value.message:'Could not turn off alerts.');}finally{setBusy(false);}}
 return <section className="parent-alert-phone-alerts" aria-label="Phone alert settings"><span className="parent-eyebrow">YOUR UPDATES. YOUR CHOICE.</span><h3>Phone alerts</h3><p>Choose whether STAR can send updates to your phone or browser, even when your parent portal is closed.</p><p className="parent-alert-fineprint">Lock-screen alerts keep things private: no player names, message text, school or location details. Open your parent portal and sign in to read more.</p>
  {demo&&<p className="parent-alert-notice">Sample space · explore the choices here. Real phone alerts are enabled from your own account.</p>}
  {support==='install'&&<><p>Add your parent portal to your iPhone or iPad home screen, open it from there, then enable alerts.</p><ParentInstall/></>}
  {support==='unsupported'&&!demo&&<p>This browser doesn’t support phone alerts here. Your updates will still appear inside your parent portal.</p>}
  {!ready&&!error&&<p role="status">Loading your alert choices…</p>}
  <fieldset disabled={busy||!ready}><legend>Which updates would you like?</legend><div className="parent-alert-alert-options">{parentAlertChoices.map(choice=><label key={choice.key}><input type="checkbox" checked={prefs.categories.includes(choice.key)} onChange={e=>{const keys:ParentAlertCategory[]=[choice.key];setPrefs(p=>({...p,categories:e.target.checked?[...new Set([...p.categories,...keys])]:p.categories.filter(k=>!keys.includes(k))}));}}/><span>{choice.label}</span></label>)}</div><label className="parent-alert-quiet-hours"><input type="checkbox" checked={prefs.quiet_hours} onChange={e=>setPrefs(p=>({...p,quiet_hours:e.target.checked}))}/><span>Quiet time: 9 pm–8 am, UK time. Updates wait until morning.</span></label></fieldset>
  <div className="parent-alert-alert-actions"><button className="parent-alert-action" type="button" disabled={busy||!ready||(!demo&&support!=='supported')} onClick={()=>void enable()}>{busy?'PLEASE WAIT…':device&&prefs.enabled?'REFRESH THIS DEVICE':'ENABLE PHONE ALERTS'}</button><button className="parent-alert-text-link" type="button" disabled={busy||!ready} onClick={()=>void updateChoices()}>Save alert choices ✓</button>{!demo&&device&&<button className="parent-alert-text-link" disabled={busy} type="button" onClick={()=>void disable(false)}>Turn off on this device</button>}{!demo&&(prefs.enabled||devices>0)&&<button className="parent-alert-text-link" disabled={busy} type="button" onClick={()=>void disable(true)}>Turn off everywhere</button>}</div>
  {!demo&&ready&&<p className="parent-alert-fineprint">{device&&prefs.enabled?'This device is enabled.':prefs.enabled?'Your account is enabled; turn on alerts for this device when you’re ready.':'Phone alerts are off.'}{devices>0?` ${devices} ${devices===1?'device':'devices'} connected.`:''} Signing out disconnects alerts on this device.</p>}
  {error&&<p className="parent-alert-error" role="alert">{error} {!ready&&<button type="button" onClick={()=>{setError('');setAttempt(n=>n+1)}}>Try again</button>}</p>}{notice&&<p className="parent-alert-notice" role="status">{notice}</p>}
 </section>;
}
