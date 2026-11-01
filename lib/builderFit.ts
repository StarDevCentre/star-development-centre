import type {BuilderLook} from './buildMyPlayer';

/** Only artwork fitted to the single v2 template is selectable during the refit.
 * Keep the full persisted catalogue so existing saved looks are never discarded.
 */
export const fittedBuilderItems:Record<string,readonly string[]>={
 top:['navy-tee','white-tee','hoodie','gold-hoodie','nike-club-hoodie','whitefox-shadow-hoodie','whitefox-glacier-hoodie','adidas-firebird-top','adidas-originals-tee','ua-tech-halfzip','puma-essentials-hoodie'],bottoms:['shorts','nike-club-joggers','adidas-firebird-trousers'],
 socks:['white','navy','black','red'],boots:['starter'],hairstyle:['ponytail']
};
export function builderItemFitted(slot:string,id:string){return !fittedBuilderItems[slot]||fittedBuilderItems[slot].includes(id);}
export function builderNeedsRefit(look:BuilderLook){return Object.keys(fittedBuilderItems).some(slot=>!builderItemFitted(slot,String(look[slot as keyof BuilderLook])));}
