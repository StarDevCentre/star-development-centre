export const playerBalls = [
  {key:'classic',label:'Classic black & white',asset:null,cosmetic:null,sessions:0,colour:'#f5f3ed'},
  {key:'adidas-multicolour',label:'Adidas multicolour',asset:'/player-space/balls/adidas-multicolour.webp',cosmetic:null,sessions:0,colour:'#f5f3ed'},
  {key:'mitre-yellow',label:'Mitre Calcio yellow',asset:'/player-space/balls/mitre-yellow.webp',cosmetic:null,sessions:0,colour:'#e7dd1c'},
  {key:'adidas-womens',label:'Women’s Champions League',asset:'/player-space/balls/adidas-womens.webp',cosmetic:null,sessions:0,colour:'#f5f3ed'},
  {key:'nike-yellow-orange',label:'Nike yellow & orange',asset:'/player-space/balls/nike-yellow-orange.webp',cosmetic:'ball-nike-10',sessions:10,colour:'#f3da1e'},
  {key:'gold-90',label:'Gold 90',asset:'/player-space/balls/gold-90.webp',cosmetic:'ball-gold-50',sessions:50,colour:'#b98532'},
] as const;
export type BallKey=typeof playerBalls[number]['key'];
export function playerBall(key?:string){return playerBalls.find(b=>b.key===key)||playerBalls[0];}
