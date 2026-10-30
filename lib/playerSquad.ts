import {extraSquad} from './playerCollectionExpansion';
export type SquadRole='Goalkeeper'|'Defender'|'Midfielder'|'Forward';
export type SquadFootballer={id:string;name:string;club:string;role:SquadRole;number:number;watch:string;source:string;kit:string};
// Club memberships checked against official club/WSL sources on 29 October 2026.
export const squadRoster:SquadFootballer[]=[
 ...extraSquad,
 {id:'hampton',name:'Hannah Hampton',club:'Chelsea',role:'Goalkeeper',number:24,watch:'Watch her starting position and the way she finds a teammate to play out.',source:'https://www.chelseafc.com/en/teams/profile/hannah-hampton',kit:'2026/27 home goalkeeper'},
 {id:'yamashita',name:'Ayaka Yamashita',club:'Manchester City',role:'Goalkeeper',number:31,watch:'Watch how she gets set before a shot and supports the player on the ball.',source:'https://www.mancity.com/players/ayaka-yamashita',kit:'2026/27 home goalkeeper'},
 {id:'tullis-joyce',name:'Phallon Tullis-Joyce',club:'Manchester United',role:'Goalkeeper',number:91,watch:'Watch how she covers the goal and resets her feet as the ball moves.',source:'https://www.manutd.com/en/teams/womens-team',kit:'2026/27 home goalkeeper'},
 {id:'williamson',name:'Leah Williamson',club:'Arsenal',role:'Defender',number:6,watch:'Watch her checks over the shoulder before she steps forward with the ball.',source:'https://www.arsenal.com/fixtures/women/players',kit:'2026/27 home'},
 {id:'fox',name:'Emily Fox',club:'Arsenal',role:'Defender',number:2,watch:'Watch when she joins an attack and how she recovers into a defensive position.',source:'https://www.arsenal.com/fixtures/women/players',kit:'2026/27 home'},
 {id:'bronze',name:'Lucy Bronze',club:'Chelsea',role:'Defender',number:22,watch:'Watch how she offers width, then moves back into shape when possession changes.',source:'https://www.chelseafc.com/en/teams/profile/lucy-bronze',kit:'2026/27 home'},
 {id:'greenwood',name:'Alex Greenwood',club:'Manchester City',role:'Defender',number:5,watch:'Watch the angle of her body as she receives and looks for a forward pass.',source:'https://www.mancity.com/players/alex-greenwood',kit:'2026/27 home'},
 {id:'le-tissier',name:'Maya Le Tissier',club:'Manchester United',role:'Defender',number:4,watch:'Watch how she stays connected to the defender beside her and tracks runners.',source:'https://www.manutd.com/en/teams/womens-team',kit:'2026/27 home'},
 {id:'little',name:'Kim Little',club:'Arsenal',role:'Midfielder',number:10,watch:'Watch how she protects the ball and changes the angle to connect with teammates.',source:'https://www.arsenal.com/fixtures/women/players',kit:'2026/27 home'},
 {id:'cuthbert',name:'Erin Cuthbert',club:'Chelsea',role:'Midfielder',number:8,watch:'Watch how she supports a pass and reacts quickly when her team loses the ball.',source:'https://www.chelseafc.com/en/teams/profile/erin-cuthbert',kit:'2026/27 home'},
 {id:'hasegawa',name:'Yui Hasegawa',club:'Manchester City',role:'Midfielder',number:25,watch:'Watch her quick looks around before she receives and her next supporting move.',source:'https://www.mancity.com/players/yui-hasegawa',kit:'2026/27 home'},
 {id:'toone',name:'Ella Toone',club:'Manchester United',role:'Midfielder',number:7,watch:'Watch how she finds a gap between opponents to receive a forward pass.',source:'https://www.manutd.com/en/teams/womens-team',kit:'2026/27 home'},
 {id:'kirby',name:'Fran Kirby',club:'Brighton & Hove Albion',role:'Midfielder',number:14,watch:'Watch her combinations around the box and her movement after a short pass.',source:'https://www.brightonandhovealbion.com/media-article/wft-news-mens-first-team-squad-numbers-confirmed-for-2026-27-season',kit:'2026/27 home'},
 {id:'kendall',name:'Lucia Kendall',club:'Aston Villa',role:'Midfielder',number:21,watch:'Watch how she offers a midfield passing option and helps her team regain shape.',source:'https://www.wslfootball.com/players/lucia-kendall',kit:'2026/27 home'},
 {id:'russo',name:'Alessia Russo',club:'Arsenal',role:'Forward',number:23,watch:'Watch how she holds off a defender and brings a teammate into the attack.',source:'https://www.arsenal.com/fixtures/women/players',kit:'2026/27 home'},
 {id:'james',name:'Lauren James',club:'Chelsea',role:'Forward',number:10,watch:'Watch her close touches and changes of direction when an opponent comes near.',source:'https://www.chelseafc.com/en/teams/profile/lauren-james-19',kit:'2026/27 home'},
 {id:'shaw',name:'Khadija Shaw',club:'Manchester City',role:'Forward',number:9,watch:'Watch how she makes space for a shot and times her movement towards the goal.',source:'https://www.mancity.com/players/bunny-shaw',kit:'2026/27 home'},
 {id:'terland',name:'Elisabeth Terland',club:'Manchester United',role:'Forward',number:10,watch:'Watch the timing of her movement into the box and her position for a finish.',source:'https://www.manutd.com/en/teams/womens-team',kit:'2026/27 home'},
 {id:'seike',name:'Kiko Seike',club:'Brighton & Hove Albion',role:'Forward',number:11,watch:'Watch when she carries the ball into space and when she releases a teammate.',source:'https://www.brightonandhovealbion.com/media-article/wft-news-mens-first-team-squad-numbers-confirmed-for-2026-27-season',kit:'2026/27 home'},
 {id:'daly',name:'Rachel Daly',club:'Aston Villa',role:'Forward',number:9,watch:'Watch how she changes her run to find room for a shot or meet a cross.',source:'https://www.wslfootball.com/players/rachel-daly',kit:'2026/27 home'}
];
export const squadPlayer=(id:string|null|undefined)=>squadRoster.find(p=>p.id===id);
export const squadAsset=(id:string)=>`/player-space/squad/${id}.webp`;
export const squadFormations={
 diamond:{title:'Diamond · 1–2–1',description:'One deeper player, two wide options and a forward.',slots:[{column:2,row:4,label:'Goalkeeper'},{column:2,row:3,label:'Anchor'},{column:1,row:2,label:'Left'},{column:3,row:2,label:'Right'},{column:2,row:1,label:'Forward'}]},
 box:{title:'Box · 2–2',description:'Two players supporting behind two attacking options.',slots:[{column:2,row:3,label:'Goalkeeper'},{column:1,row:2,label:'Left support'},{column:3,row:2,label:'Right support'},{column:1,row:1,label:'Left attack'},{column:3,row:1,label:'Right attack'}]}
} as const;
export type SquadFormation=keyof typeof squadFormations;
export type SquadInput={name:string;formation:SquadFormation;footballers:string[];captain:string};
export type PlayerSquad=SquadInput&{player_id:string;updated_at:string};
export function validateSquad(value:SquadInput):string|null{
 if(!value.name.trim()||value.name.trim().length>40)return 'Give your squad a name of 1–40 characters.';
 if(!Object.hasOwn(squadFormations,value.formation))return 'Choose a formation.';
 if(value.footballers.length!==5||new Set(value.footballers).size!==5)return 'Choose five different players.';
 if(!value.footballers.every(id=>squadPlayer(id)))return 'Choose players from this collection.';
 if(squadPlayer(value.footballers[0])?.role!=='Goalkeeper'||value.footballers.slice(1).some(id=>squadPlayer(id)?.role==='Goalkeeper'))return 'Choose one goalkeeper and four outfield players.';
 if(!value.footballers.includes(value.captain))return 'Choose a captain from your five players.';
 return null;
}
