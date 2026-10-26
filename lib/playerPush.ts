import {supabaseBrowser as db} from './supabaseBrowser';
export const pushCategories=['message','practice','session','goal','badge','cosmetic'] as const;
export type PushCategory=typeof pushCategories[number];
export type PushPreferences={enabled:boolean;categories:PushCategory[];quiet_hours:boolean;consented_at:string|null};
export const defaultPushPreferences:PushPreferences={enabled:false,categories:[...pushCategories],quiet_hours:true,consented_at:null};
export const pushChoices=[{key:'message',label:'Coach messages and feedback'},{key:'practice',label:'New or updated practices'},{key:'session',label:'Session reminders and changes'},{key:'goal',label:'Goal reviews'},{key:'badge',label:'Badges and new extras'}] as const;
export function pushSupport(){
 if(typeof window==='undefined')return 'checking';
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 if(ios&&!window.matchMedia('(display-mode: standalone)').matches)return 'install';
 return window.isSecureContext&&'Notification'in window&&'serviceWorker'in navigator&&'PushManager'in window?'supported':'unsupported';
}
export async function playerPushRegistration(){
 const registration=await navigator.serviceWorker.register('/player-portal-sw.js',{scope:'/player-portal'});
 if(registration.active)return registration;
 const worker=registration.installing||registration.waiting;
 if(!worker)throw new Error('The app is still getting ready. Please try again.');
 await new Promise<void>((resolve,reject)=>{
  const timer=window.setTimeout(()=>{worker.removeEventListener('statechange',check);reject(new Error('The app is still getting ready. Please try again.'));},12000);
  function check(){if(worker!.state==='activated'){clearTimeout(timer);worker!.removeEventListener('statechange',check);resolve();}else if(worker!.state==='redundant'){clearTimeout(timer);worker!.removeEventListener('statechange',check);reject(new Error('Please refresh and try again.'));}}
  worker.addEventListener('statechange',check);check();
 });
 return registration;
}
export function applicationServerKey(value:string){
 const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4));
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
export async function removeDevicePush(userId:string){
 if(!db||!('serviceWorker'in navigator))return;
 const registration=await navigator.serviceWorker.getRegistration('/player-portal');
 const subscription=await registration?.pushManager?.getSubscription();
 if(!subscription)return;
 const [removed,unsubscribed]=await Promise.allSettled([
  db.from('player_push_subscriptions').delete().eq('user_id',userId).eq('endpoint',subscription.endpoint),
  subscription.unsubscribe()
 ]);
 const databaseStopped=removed.status==='fulfilled'&&!removed.value.error;
 const browserStopped=unsubscribed.status==='fulfilled'&&unsubscribed.value;
 if(!databaseStopped&&!browserStopped)throw new Error('Could not switch off alerts on this device. Please try again.');
}
