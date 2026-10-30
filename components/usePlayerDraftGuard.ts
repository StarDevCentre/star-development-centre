'use client';
import {useEffect} from 'react';
/** No private drafts are stored in browser storage. Leaving requires an explicit discard. */
export function usePlayerDraftGuard(dirty:boolean) {
 useEffect(()=>{
  if(!dirty)return;
  const unload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
  const navigate=(event:Event)=>{if(event.defaultPrevented)return;if(!window.confirm('You have unsaved changes. Leave and discard them?'))event.preventDefault();};
  const link=(event:MouseEvent)=>{const target=(event.target as Element).closest?.('a[href]') as HTMLAnchorElement|null;const samePage=target&&target.origin===location.origin&&target.pathname===location.pathname&&target.search===location.search;if(target&&!samePage&&!window.confirm('You have unsaved changes. Leave and discard them?'))event.preventDefault();};
  window.addEventListener('beforeunload',unload);window.addEventListener('ps:before-navigate',navigate);document.addEventListener('click',link);
  return()=>{window.removeEventListener('beforeunload',unload);window.removeEventListener('ps:before-navigate',navigate);document.removeEventListener('click',link);};
 },[dirty]);
}
export function playerMayNavigate(){return window.dispatchEvent(new Event('ps:before-navigate',{cancelable:true}));}
