import type {CSSProperties} from 'react';

const navy='#071c3b';
function channels(hex:string){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))}
function luminance(rgb:number[]){const values=rgb.map(v=>{const s=v/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4});return values[0]*0.2126+values[1]*0.7152+values[2]*0.0722}
function hex(rgb:number[]){return '#'+rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')}
function tint(rgb:number[],white:number){return hex(rgb.map(v=>v*(1-white)+255*white))}

/** Saved colour is the identity; derived tones keep text readable for light and vivid brands. */
export function organisationTheme(colour?:string):CSSProperties{
 const brand=colour&&/^#[0-9a-f]{6}$/i.test(colour)?colour:navy;
 const rgb=channels(brand),light=luminance(rgb);
 const onBrand=(light+0.05)/0.05>=1.05/(light+0.05)?'#000000':'#ffffff';
 const soft=tint(rgb,0.93),softLight=luminance(channels(soft));
 let ink=rgb;
 while((softLight+0.05)/(luminance(ink)+0.05)<4.5)ink=ink.map(v=>Math.max(0,Math.floor(v*0.94)));
 return {
  '--organisation-colour':brand,
  '--organisation-on-colour':onBrand,
  '--organisation-ink':hex(ink),
  '--organisation-soft':soft,
  '--organisation-wash':tint(rgb,0.97),
  '--organisation-border':tint(rgb,0.7)
 } as CSSProperties;
}
