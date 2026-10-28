"use client";
import {useEffect,useRef,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {mediaBucket,type PlayerMedia} from '../lib/playerMedia';
export function PlayerMediaPreview({item,client}:{item:PlayerMedia;client:SupabaseClient|null}){
 const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');const live=useRef(true),object=useRef('');
 useEffect(()=>{live.current=true;return()=>{live.current=false;if(object.current)URL.revokeObjectURL(object.current)}},[]);
 async function open(){if(!client||busy)return;setBusy(true);setError('');try{const {data,error}=await client.storage.from(mediaBucket).download(item.object_path);if(error||!data)throw Error();if(live.current){const next=URL.createObjectURL(data);if(object.current)URL.revokeObjectURL(object.current);object.current=next;setUrl(next);}}catch{if(live.current)setError('Media is unavailable. Refresh to check access or try again.');}finally{if(live.current)setBusy(false);}}
 return <div className="player-media-preview">{url?<>{item.mime_type.startsWith('image/')?<img src={url} alt={item.title}/>:<video src={url} controls playsInline preload="metadata" aria-label={item.title}/>}<button type="button" className="media-secondary" onClick={()=>{URL.revokeObjectURL(object.current);object.current='';setUrl('')}}>Close media</button></>:<button type="button" className="media-open" disabled={busy||!client} onClick={()=>void open()}><span aria-hidden="true">{item.mime_type.startsWith('image/')?'▧':'▷'}</span>{busy?'Opening securely…':item.mime_type.startsWith('image/')?'View private photo':'Play private clip'}<small>{(item.file_size/1048576).toFixed(1)} MB</small></button>}{error&&<p role="alert">{error}</p>}</div>;
}
