import {extraSquad} from './playerCollectionExpansion';
import {wslSquadAdditions} from './wslSquadExpansion';
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
 {id:'daly',name:'Rachel Daly',club:'Aston Villa',role:'Forward',number:9,watch:'Watch how she changes her run to find room for a shot or meet a cross.',source:'https://www.wslfootball.com/players/rachel-daly',kit:'2026/27 home'},
 ...wslSquadAdditions
];
export const squadPlayer=(id:string|null|undefined):SquadFootballer|undefined=>id==='my-player'?{id:'my-player',name:'My player',club:'My STAR player',role:'Midfielder',number:0,watch:'Your own custom player.',source:'',kit:'Your chosen'}:squadRoster.find(p=>p.id===id);
export const squadAsset=(id:string)=>`/player-space/squad/${id}.webp`;
type SquadSlot={column:number;row:number;span:number;label:string};
function elevenSlots(lines:string[][]):SquadSlot[]{
 return [{column:5,row:lines.length+1,span:4,label:'Goalkeeper'},...lines.flatMap((line,index)=>line.map((label,i)=>({column:1+i*(12/line.length),row:lines.length-index,span:12/line.length,label})))];
}
export const squadFormations={
 diamond:{size:5,columns:3,title:'Diamond · 1–2–1',description:'One deeper player, two wide options and a forward.',slots:[{column:2,row:4,span:1,label:'Goalkeeper'},{column:2,row:3,span:1,label:'Anchor'},{column:1,row:2,span:1,label:'Left'},{column:3,row:2,span:1,label:'Right'},{column:2,row:1,span:1,label:'Forward'}]},
 box:{size:5,columns:3,title:'Box · 2–2',description:'Two players supporting behind two attacking options.',slots:[{column:2,row:3,span:1,label:'Goalkeeper'},{column:1,row:2,span:1,label:'Left support'},{column:3,row:2,span:1,label:'Right support'},{column:1,row:1,span:1,label:'Left attack'},{column:3,row:1,span:1,label:'Right attack'}]},
 '4-3-3':{size:11,columns:12,title:'4–3–3',description:'A back four, three midfielders and three forwards.',slots:elevenSlots([['Left back','Left centre back','Right centre back','Right back'],['Left midfield','Central midfield','Right midfield'],['Left wing','Striker','Right wing']])},
 '4-4-2':{size:11,columns:12,title:'4–4–2',description:'A back four, four midfielders and two strikers.',slots:elevenSlots([['Left back','Left centre back','Right centre back','Right back'],['Left midfield','Left central midfield','Right central midfield','Right midfield'],['Left striker','Right striker']])},
 '4-2-3-1':{size:11,columns:12,title:'4–2–3–1',description:'A back four, two holding midfielders, three attacking midfielders and a striker.',slots:elevenSlots([['Left back','Left centre back','Right centre back','Right back'],['Left holding midfield','Right holding midfield'],['Left wing','Attacking midfield','Right wing'],['Striker']])}
} as const;
export type SquadFormation=keyof typeof squadFormations;
export type SquadInput={name:string;formation:SquadFormation;footballers:string[];captain:string};
export type PlayerSquad=SquadInput&{player_id:string;updated_at:string};
export function changeSquadFormation(value:SquadInput,formation:SquadFormation):SquadInput{
 const size=squadFormations[formation].size;
 const footballers=Array.from({length:size},(_,i)=>value.footballers[i]||'');
 return {...value,formation,footballers,captain:footballers.includes(value.captain)?value.captain:footballers.find(Boolean)||''};
}
export function validateSquad(value:SquadInput):string|null{
 if(!value.name.trim()||value.name.trim().length>40)return 'Give your squad a name of 1–40 characters.';
 if(!Object.hasOwn(squadFormations,value.formation))return 'Choose a formation.';
 const size=squadFormations[value.formation].size;
 if(value.footballers.length!==size||new Set(value.footballers).size!==size)return `Choose ${size} different players.`;
 if(!value.footballers.every(id=>squadPlayer(id)))return 'Choose players from this collection.';
 if(squadPlayer(value.footballers[0])?.role!=='Goalkeeper'||value.footballers.slice(1).some(id=>squadPlayer(id)?.role==='Goalkeeper'))return `Choose one goalkeeper and ${size-1} outfield players.`;
 if(!value.footballers.includes(value.captain))return 'Choose a captain from your squad.';
 return null;
}
