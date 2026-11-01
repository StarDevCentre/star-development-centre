/** Approved 1 November 2026. Each garment has its own front and rear sprite. */
export const builderWardrobe = [
 {id:'ellesse-pink-sweatshirt',label:'Ellesse crew-neck sweatshirt · pink',slot:'top',style:'casual'},
 {id:'ellesse-pink-joggers',label:'Ellesse joggers · pink',slot:'bottoms',style:'casual',fullLength:true},
 {id:'nike-club-hoodie',label:'Nike Club Fleece hoodie · grey marl',slot:'top',style:'sport'},
 {id:'nike-club-joggers',label:'Nike Club Fleece joggers · grey marl',slot:'bottoms',style:'sport',fullLength:true},
 {id:'adidas-firebird-top',label:'adidas Firebird track top · black/white',slot:'top',style:'sport'},
 {id:'adidas-firebird-trousers',label:'adidas Firebird trousers · black/white',slot:'bottoms',style:'sport',fullLength:true},
 {id:'adidas-originals-tee',label:'adidas Originals T-shirt · white/black',slot:'top',style:'sport'},
 {id:'ua-tech-halfzip',label:'Under Armour Tech half-zip · black',slot:'top',style:'sport'},
 {id:'puma-essentials-hoodie',label:'PUMA Essentials hoodie · black',slot:'top',style:'sport'},
 {id:'puma-cargo-shorts',label:'PUMA cargo shorts · black',slot:'bottoms',style:'sport'},
 {id:'hollister-baby-tee',label:'Hollister baby T-shirt · white',slot:'top',style:'casual'},
 {id:'hollister-andi-jeans',label:'Hollister Andi baggy jeans · light blue',slot:'bottoms',style:'casual',fullLength:true},
 {id:'hollister-ivy-jumper',label:'Hollister Ivy cable-knit jumper · cream',slot:'top',style:'casual'},
 {id:'bershka-raglan-tee',label:'Bershka raglan T-shirt · white/burgundy',slot:'top',style:'casual'},
 {id:'bershka-denim-skirt',label:'Bershka denim skirt · mid-blue',slot:'bottoms',style:'casual'},
 {id:'hm-rib-cardigan',label:'H&M rib-knit cardigan · cream',slot:'top',style:'casual'},
 {id:'whitefox-offstage-tee',label:'White Fox Offstage T-shirt · Shadow',slot:'top',style:'casual'},
 {id:'juicy-velour-hoodie',label:'Juicy Couture velour hoodie · dark pink',slot:'top',style:'casual'},
 {id:'juicy-velour-trousers',label:'Juicy Couture velour trousers · dark pink',slot:'bottoms',style:'casual',fullLength:true},
 {id:'whitefox-shadow-hoodie',label:'White Fox Offstage hoodie · Shadow',slot:'top',style:'casual'},
 {id:'whitefox-glacier-hoodie',label:'White Fox Offstage hoodie · Glacier Grey',slot:'top',style:'casual'},
 {id:'nike-pro-crop',label:'Nike Pro crop top · black/white',slot:'top',style:'sport'},
 {id:'nike-pro-shorts',label:'Nike Pro shorts · black/white',slot:'bottoms',style:'sport'},
 {id:'adidas-leggings',label:'adidas leggings · black/white',slot:'bottoms',style:'sport',fullLength:true}
] as const;
export function wardrobeGarment(id:string){return builderWardrobe.find(item=>item.id===id);}
export function wardrobeAsset(id:string,view:'front'|'back'){return `/player-space/builder/wardrobe/${id}-${view}.webp`;}
export function wardrobeFullLength(id:string){const item=wardrobeGarment(id);return !!item&&'fullLength' in item&&item.fullLength;}
