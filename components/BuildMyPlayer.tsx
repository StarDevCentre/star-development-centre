"use client";

import {useState} from 'react';
import {defaultBuilderLook, playerPresets, type BuilderLook} from '../lib/buildMyPlayer';
import {heroSkinTones, heroHairColours} from '../lib/heroCharacter';
import './build-my-player.css';

const sections = ['Models','Appearance','Hair','Clothes','Accessories'] as const;
type Section = typeof sections[number];

/** Draft workbench: parent supplies the persisted value and performs the save. */
export function BuildMyPlayer({initial=defaultBuilderLook,onSave}:{initial?:BuilderLook;onSave:(look:BuilderLook)=>Promise<void>}) {
  const [look,setLook]=useState(initial);
  const [section,setSection]=useState<Section>('Models');
  const [view,setView]=useState<'front'|'back'>('front');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  function choose<K extends keyof BuilderLook>(key:K,value:BuilderLook[K]) {setLook(v=>({...v,[key]:value}));setMessage('');}
  async function save(){
    setBusy(true);setError('');setMessage('');
    try{await onSave(look);setMessage('Your player is saved.');}
    catch(e){setError(e instanceof Error?e.message:'Your player could not be saved. Please try again.');}
    finally{setBusy(false);}
  }
  function options<K extends keyof BuilderLook>(label:string,key:K,choices:ReadonlyArray<{value:BuilderLook[K];label:string}>){
    return <fieldset disabled={busy}><legend>{label}</legend><div className="bp-options">{choices.map(item=><button key={String(item.value)} type="button" aria-pressed={look[key]===item.value} onClick={()=>choose(key,item.value)}>{item.label}</button>)}</div></fieldset>;
  }
  return <section className="bp-workbench" aria-label="Build my player">
    <div className="bp-preview"><span className="bp-kicker">YOUR PLAYER · YOUR STYLE</span><PlayerBuilderFigure look={look} view={view}/><div className="bp-options" role="group" aria-label="Player view"><button type="button" aria-pressed={view==='front'} onClick={()=>setView('front')}>Front</button><button type="button" aria-pressed={view==='back'} onClick={()=>setView('back')}>Back</button></div></div>
    <div className="bp-controls"><h2>BUILD MY PLAYER</h2><p>Choose a starting model, then make her your own. Change categories in any order.</p><nav className="bp-tabs" aria-label="Customisation categories">{sections.map(s=><button type="button" key={s} aria-pressed={section===s} onClick={()=>setSection(s)}>{s}</button>)}</nav>
      {section==='Models'&&<fieldset disabled={busy}><legend>Choose a starting look</legend><div className="bp-options">{playerPresets.map(p=><button type="button" key={p.label} onClick={()=>{setLook({...p.look});setMessage('');}}>{p.label}</button>)}</div></fieldset>}
      {section==='Appearance'&&<>{options('Skin tone','skin',heroSkinTones.map(t=>({value:t.key,label:t.label})))}{options('Face','face',[{value:'oval',label:'Oval'},{value:'round',label:'Round'},{value:'freckles',label:'Freckles'}])}{options('Eye colour','eyes',[{value:'brown',label:'Brown'},{value:'blue',label:'Blue'},{value:'green',label:'Green'},{value:'grey',label:'Grey'}])}{options('Build','build',[{value:'slim',label:'Slim'},{value:'standard',label:'Standard'},{value:'strong',label:'Strong'}])}</>}
      {section==='Hair'&&<>{options('Hair colour','hair',heroHairColours.map(t=>({value:t.key,label:t.label})))}{options('Hairstyle','hairstyle',[{value:'ponytail',label:'Ponytail'},{value:'curls',label:'Curls'},{value:'coils',label:'Coily puff'},{value:'braids',label:'Braids'}])}</>}
      {section==='Clothes'&&<>{options('Top','top',[{value:'star',label:'STAR training top'},{value:'navy-tee',label:'Navy T-shirt'},{value:'white-tee',label:'White T-shirt'},{value:'hoodie',label:'Navy hoodie'}])}{options('Bottoms','bottoms',[{value:'shorts',label:'Shorts'},{value:'leggings',label:'Leggings'},{value:'trackies',label:'Tracksuit bottoms'}])}{options('Socks','socks',[{value:'white',label:'White'},{value:'navy',label:'Navy'},{value:'black',label:'Black'}])}</>}
      {section==='Accessories'&&options('Accessories','accessory',[{value:'none',label:'None'},{value:'glasses',label:'Glasses'},{value:'headband',label:'Headband'}])}
      <button className="bp-save" type="button" disabled={busy} onClick={()=>void save()}>{busy?'SAVING…':'SAVE MY PLAYER'}</button>{message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}
    </div>
  </section>;
}

/** Stand-in artwork used while the final illustrated layer assets are prepared. */
function PlayerBuilderFigure({look,view}:{look:BuilderLook;view:'front'|'back'}) {
  const skin=heroSkinTones.find(t=>t.key===look.skin)?.colour||'#e9a070';
  const hair=heroHairColours.find(t=>t.key===look.hair)?.colour||'#704528';
  const shirt=look.top==='star'||look.top==='white-tee'?'#fff':'#162b50';
  const eye={brown:'#63412b',blue:'#5081a1',green:'#527c5f',grey:'#798792'}[look.eyes];
  const leg=look.bottoms==='shorts'?skin:'#18243b';
  return <svg viewBox="0 0 240 520" className="bp-figure" role="img" aria-label={`${view} view of your custom player`}>
    <ellipse cx="120" cy="505" rx="74" ry="9" fill="#071429" opacity=".2"/>
    <path d="M85 251 L105 251 L105 420 L84 420 Z M135 251 L155 251 L156 420 L135 420 Z" fill={leg} stroke="#273044" strokeWidth="2"/>
    <path d="M84 382 H105 V453 H84 Z M135 382 H156 V453 H135 Z" fill={{white:'#f8fafc',navy:'#213558',black:'#1b1d24'}[look.socks]}/>
    <path d="M82 448 L105 448 L109 471 Q101 481 72 477 L70 469 Z M135 448 L158 448 L171 469 L169 477 Q140 481 132 471 Z" fill="#e75045" stroke="#263044" strokeWidth="2"/>
    <path d="M77 133 Q57 142 53 180 L45 242 Q45 253 53 255 Q62 254 64 245 L78 196 M163 133 Q183 142 187 180 L195 242 Q195 253 187 255 Q178 254 176 245 L162 196" fill={skin} stroke="#273044" strokeWidth="2"/>
    <path d="M84 233 H156 L163 279 H123 L120 266 L117 279 H77 Z" fill="#15243e" stroke="#273044" strokeWidth="2"/>
    <path d="M85 126 Q75 131 66 142 L56 176 L76 184 L80 167 L80 240 Q120 248 160 240 L160 167 L164 184 L184 176 L174 142 Q165 131 155 126 L137 119 H103 Z" fill={shirt} stroke="#273044" strokeWidth="2"/>
    {look.top==='star'&&<><path d="M81 145 L128 163 L128 174 L81 157 Z M81 174 L128 192 L128 203 L81 185 Z M81 203 L128 221 L128 232 L81 214 Z" fill="#5d249a"/><path d="M57 171 L76 178 M164 178 L183 171" stroke="#d82035" strokeWidth="5"/></>}
    <path d="M106 119 L106 106 H134 L134 119 Q120 132 106 119" fill={skin} stroke="#273044" strokeWidth="2"/>
    {look.hairstyle==='ponytail'||look.hairstyle==='braids'?<path d="M145 64 Q176 64 164 131 L150 137 L145 92 Z" fill={hair} stroke="#273044" strokeWidth="2"/>:null}
    <ellipse cx="120" cy="70" rx={look.face==='round'?32:29} ry="40" fill={skin} stroke="#273044" strokeWidth="2"/>
    <path d="M90 66 Q84 23 120 23 Q158 23 150 67 Q143 42 121 45 Q104 51 90 66" fill={hair} stroke="#273044" strokeWidth="2"/>
    {view==='front'&&<><ellipse cx="109" cy="69" rx="3" ry="4" fill={eye}/><ellipse cx="131" cy="69" rx="3" ry="4" fill={eye}/><path d="M111 89 Q120 95 129 89" fill="none" stroke="#704a3e" strokeWidth="2"/>{look.face==='freckles'&&<path d="M100 79 h2 m4 1 h2 m24-1 h2 m4-1 h2" stroke="#87523e" strokeWidth="2"/>}{look.accessory==='glasses'&&<g fill="none" stroke="#1d2c48" strokeWidth="2"><circle cx="109" cy="69" r="8"/><circle cx="131" cy="69" r="8"/><path d="M117 69 H123"/></g>}</>}
    {look.accessory==='headband'&&<path d="M92 54 Q120 40 148 54" fill="none" stroke="#eac05b" strokeWidth="5"/>}
  </svg>;
}
