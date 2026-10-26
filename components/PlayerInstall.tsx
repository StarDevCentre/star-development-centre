"use client";
import {useEffect,useState} from 'react';
type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export function PlayerInstall(){
 const[prompt,setPrompt]=useState<InstallPrompt|null>(null),[installed,setInstalled]=useState(false),[help,setHelp]=useState(false);
 useEffect(()=>{if('serviceWorker'in navigator)void navigator.serviceWorker.register('/player-portal-sw.js',{scope:'/player-portal'}).catch(()=>{});setInstalled(window.matchMedia('(display-mode: standalone)').matches);const show=(e:Event)=>{e.preventDefault();setPrompt(e as InstallPrompt);};const done=()=>{setInstalled(true);setPrompt(null);};window.addEventListener('beforeinstallprompt',show);window.addEventListener('appinstalled',done);return()=>{window.removeEventListener('beforeinstallprompt',show);window.removeEventListener('appinstalled',done);};},[]);
 return <div className="ps-install-control">{installed?<p>Player Space is running as your home-screen app.</p>:<><button className="ps-text-link" onClick={async()=>{if(prompt){await prompt.prompt();await prompt.userChoice;setPrompt(null);}else setHelp(v=>!v);}}>Add Player Space to my home screen ↗</button>{help&&<p>On iPhone or iPad, open Player Space in Safari, tap Share, then “Add to Home Screen”. On Android or desktop, use your browser’s “Install app” or “Add to Home screen” option. You’ll sign in normally; private player records aren’t saved for offline use.</p>}</>}</div>;
}
