'use client';
import {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {BuildMyPlayer} from './BuildMyPlayer';
import {defaultBuilderLook,type BuilderLook} from '../lib/buildMyPlayer';

/** Standalone artwork preview: synthetic ID, no portal data or server saves. */
export function BuilderArtworkPreview(){
 const[saved,setSaved]=useState<BuilderLook>({...defaultBuilderLook,socks:'nike-ankle-white'}),[onCard,setOnCard]=useState(false),[notice,setNotice]=useState('');
 return <main style={{background:'#06142e',minHeight:'100dvh',padding:'clamp(16px,4vw,40px)',fontFamily:'DM Sans, sans-serif'}}><div style={{maxWidth:1200,margin:'0 auto'}}><header style={{display:'flex',gap:20,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',marginBottom:20}}><Image src="/images/star-logo.jpg" alt="STAR Development Centre" width={120} height={106} style={{width:100,height:'auto',background:'#fff',borderRadius:8,padding:8}}/><Link href="/player-portal" style={{color:'#fff',textDecoration:'underline'}}>Back to Player Space</Link></header><aside style={{border:'1px solid #d6b463',borderRadius:12,padding:'16px 20px',background:'#102c4e',color:'#fff'}}><strong style={{color:'#f5d389'}}>ARTWORK PREVIEW · SOCKS &amp; BOOTS</strong><p style={{margin:'8px 0 0',lineHeight:1.6}}>Try the current fitting changes in front and back views. The rest of the wardrobe is still being worked on. Changes here stay in this preview and do not change your saved player or rewards.</p></aside>{notice&&<p role="status" style={{color:'#fff',lineHeight:1.6}}>{notice}</p>}<BuildMyPlayer playerId="artwork-preview" saved={saved} onCard={onCard} unlocks={[]} demo onSave={async(look,card)=>{setSaved(look);setOnCard(card);}} onBootLocker={()=>setNotice('Every Boot Locker pair is available to try in the Boots tab of this preview.')}/></div></main>;
}
