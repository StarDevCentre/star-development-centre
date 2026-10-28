'use client';
import {useEffect,useState} from 'react';
import {supabaseBrowser as db} from '../lib/supabaseBrowser';
export function IntakePhoto({path}:{path:string|null}){
 const[url,setUrl]=useState('');
 useEffect(()=>{let active=true,objectUrl='';setUrl('');if(path&&db)void db.storage.from('player-intake-photos').download(path).then(r=>{if(active&&r.data){objectUrl=URL.createObjectURL(r.data);setUrl(objectUrl);}});return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};},[path]);
 return path?<figure className="intake-photo">{url?<a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="Private player identification photograph"/><span>View full photograph ↗</span></a>:<p>Loading private photograph…</p>}<figcaption>Identification and private player profile</figcaption></figure>:null;
}
