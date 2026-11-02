import {builderOptions,type BuilderLook} from './buildMyPlayer';
import {collectibleBoots} from './bootChallenges';
/** Every persisted catalogue item has an independent sprite on the shared rig.
 * Entitlements remain enforced separately by builderAvailable/server validation.
 */
export const fittedBuilderItems:Record<string,readonly string[]>={top:builderOptions.top,bottoms:builderOptions.bottoms,socks:builderOptions.socks,boots:['none','starter',...collectibleBoots.map(b=>b.id)],hairstyle:builderOptions.hairstyle};
export function builderItemFitted(slot:string,id:string){return !fittedBuilderItems[slot]||fittedBuilderItems[slot].includes(id);}
export function builderNeedsRefit(look:BuilderLook){return Object.keys(fittedBuilderItems).some(slot=>!builderItemFitted(slot,String(look[slot as keyof BuilderLook])));}
