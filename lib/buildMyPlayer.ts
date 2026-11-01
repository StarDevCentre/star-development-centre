import {collectibleBoots,bootKey} from './bootChallenges';
import type {SpaceUnlock} from './playerSpace';
import {builderWardrobe} from './builderWardrobe';
import {builderKitOptions,builderKitLabel} from './builderKits';
export const builderOptions={
 skin:['fair','light','medium','brown','deep'],hair:['blonde','brown','black','ginger','silver'],hairstyle:['ponytail','curls','coils','braids'],
 face:['oval','round','freckles'],eyes:['brown','blue','green','grey'],build:['slim','standard','strong'],
 top:['base','star','arsenal','chelsea','navy-tee','white-tee','hoodie','gold-hoodie',...builderWardrobe.filter(item=>item.slot==='top').map(item=>item.id),...builderKitOptions],bottoms:['base','shorts','arsenal','chelsea','leggings','trackies',...builderWardrobe.filter(item=>item.slot==='bottoms').map(item=>item.id),...builderKitOptions],
 socks:['none','white','navy','black','red',...builderKitOptions],accessory:['none','glasses','headband','gold-headband']
} as const;
export type BuilderLook = {[K in keyof typeof builderOptions]:typeof builderOptions[K][number]} & {boots:string};
export const defaultBuilderLook:BuilderLook={skin:'light',hair:'brown',hairstyle:'ponytail',face:'oval',eyes:'brown',build:'standard',top:'base',bottoms:'base',socks:'none',boots:'none',accessory:'none'};
export const playerPresets:Array<{label:string;look:BuilderLook}>=[
 {label:'Alex',look:{...defaultBuilderLook}},
 {label:'Sam',look:{...defaultBuilderLook,skin:'deep',hair:'black',hairstyle:'coils',eyes:'brown'}},
 {label:'Charlie',look:{...defaultBuilderLook,skin:'medium',hair:'black',hairstyle:'braids',build:'strong'}},
 {label:'Taylor',look:{...defaultBuilderLook,skin:'fair',hair:'ginger',hairstyle:'curls',face:'freckles',eyes:'green'}}
];
export const builderLabels:Record<string,string>={base:'Base layer',star:'STAR training top',arsenal:'Arsenal home',chelsea:'Chelsea home','navy-tee':'Navy T-shirt','white-tee':'White T-shirt',hoodie:'Navy hoodie','gold-hoodie':'Gold hoodie',shorts:'Navy football shorts',leggings:'Sports leggings',trackies:'Tracksuit bottoms',none:'None',ponytail:'Wavy ponytail',curls:'Curly bob',coils:'Coily puff',braids:'Braided bun','gold-headband':'Gold headband'};
export const builderRequirements:Record<string,{key:string;label:string}>={'gold-hoodie':{key:'avatar-captain',label:'Earn your first coach badge'},'gold-headband':{key:'decoration-laurel',label:'Earn three coach badges'}};
for(const item of builderWardrobe)builderLabels[item.id]=item.label;
for(const id of builderKitOptions)builderLabels[id]=builderKitLabel(id);
builderLabels.arsenal=builderKitLabel('arsenal');builderLabels.chelsea=builderKitLabel('chelsea');
export function builderAvailable(value:string,unlocks:SpaceUnlock[],playerId:string,demo=false){const r=builderRequirements[value];return demo||!r||unlocks.some(u=>u.player_id===playerId&&u.cosmetic===r.key);}
export function validateBuilderLook(value:unknown,unlocks:SpaceUnlock[],playerId:string,demo=false):string|null {
 if(!value||typeof value!=='object'||Array.isArray(value))return 'Choose your player look.';
 const v=value as Record<string,unknown>;
 if(Object.keys(v).length!==Object.keys(builderOptions).length+1)return 'Your player look has an unavailable option.';
 for(const [k,choices] of Object.entries(builderOptions)){
  if(typeof v[k]!=='string'||!(choices as readonly string[]).includes(v[k] as string))return 'Choose an available '+k+'.';
  if(!builderAvailable(v[k] as string,unlocks,playerId,demo))return builderRequirements[v[k] as string].label+' to use this item.';
 }
 if(typeof v.boots!=='string'||!['none','starter',...collectibleBoots.map(b=>b.id)].includes(v.boots))return 'Choose boots from your locker.';
 if(!['none','starter'].includes(v.boots)&&!demo&&!unlocks.some(u=>u.player_id===playerId&&u.cosmetic===bootKey(v.boots as string)))return 'Complete this pair’s Boot Challenge to wear them.';
 return null;
}
export function builderLook(value:unknown):BuilderLook {
 if(!value||typeof value!=='object')return {...defaultBuilderLook};
 const v=value as Record<string,unknown>,out={...defaultBuilderLook};
 for(const [key,options] of Object.entries(builderOptions))if((options as readonly unknown[]).includes(v[key]))(out as Record<string,unknown>)[key]=v[key];
 if(typeof v.boots==='string'&&['none','starter',...collectibleBoots.map(b=>b.id)].includes(v.boots))out.boots=v.boots;
 return out;
}
export function builderDressed(look:BuilderLook){return look.top!=='base'&&look.bottoms!=='base';}
