/** STAR Journey football logic. Pure functions: simulation state is the single source of truth. */
export type Position={x:number;z:number};
export type Footballer={id:string;team:"star"|"opponent";position:Position};
export type MatchState={players:Footballer[];ball:Position;possessor:string;phase:0|1|2|3;history:DecisionOutcome[]};
export type DecisionOutcome={action:"wide"|"inside"|"early-pass"|"hold"|"through-ball"|"shot";successful:boolean;feedback:string;from:Position;to:Position;ballFrom:Position;ballTo:Position;recipient:string;phase:number};
const dist=(a:Position,b:Position)=>Math.hypot(a.x-b.x,a.z-b.z);
const point=(x:number,z:number):Position=>({x,z});
const player=(s:MatchState,id:string)=>{const p=s.players.find(p=>p.id===id);if(!p)throw Error("Missing player "+id);return p};
export function createMatch():MatchState{return{players:[{id:"7",team:"star",position:point(-18,4)},{id:"10",team:"star",position:point(-2,-8)},{id:"9",team:"star",position:point(20,8)},{id:"6",team:"star",position:point(-7,17)},{id:"d4",team:"opponent",position:point(-4,2)},{id:"d5",team:"opponent",position:point(14,-4)},{id:"d3",team:"opponent",position:point(28,12)},{id:"d2",team:"opponent",position:point(31,-13)}],ball:point(-2,-8),possessor:"10",phase:0,history:[]}}
export function clearOfPlayers(s:MatchState,position:Position,playerId:string,radius=4){return s.players.every(p=>p.id===playerId||dist(p.position,position)>=radius)}
export function passingLaneOpen(s:MatchState,from:Position,to:Position,clearance=2.2){const dx=to.x-from.x,dz=to.z-from.z,l2=dx*dx+dz*dz;if(l2<.1)return false;return s.players.filter(p=>p.team==="opponent").every(p=>{const q=p.position,t=Math.max(0,Math.min(1,((q.x-from.x)*dx+(q.z-from.z)*dz)/l2));return Math.hypot(q.x-from.x-t*dx,q.z-from.z-t*dz)>=clearance})}
function update(s:MatchState,moves:Record<string,Position>,ball:Position,possessor:string,outcome:DecisionOutcome):MatchState{return{players:s.players.map(p=>({...p,position:moves[p.id]??p.position})),ball,possessor,phase:(s.phase+1) as MatchState["phase"],history:[...s.history,outcome]}}
export function applyDecision(s:MatchState,choice:0|1):MatchState{
if(s.phase>=3)throw Error("Scenario finished");
const p=s.phase,actor=p===0?"7":s.possessor,from=player(s,actor).position,ballFrom=s.ball;
let to=from,ballTo=ballFrom,recipient=s.possessor,action:DecisionOutcome["action"],feedback="",successful=false,moves:Record<string,Position>={};
if(p===0){
action=choice===0?"wide":"inside";
to=choice===0?point(-12,27):point(-7,-2);
const free=clearOfPlayers(s,to,"7",4),lane=passingLaneOpen(s,ballFrom,to);
successful=choice===0&&free&&lane;
moves["7"]=to;
if(successful){recipient="7";ballTo=to;feedback="You moved towards the touchline, away from teammates, and opened a clear passing lane. Number 10 found you."}
else{recipient="10";ballTo=ballFrom;feedback=choice===0?"That wide run was blocked by pressure. The passer kept possession rather than forcing the ball.":"You moved into a crowded central lane. Number 10 kept possession because the passing option was blocked."}
}else if(p===1){
action=choice===0?"early-pass":"hold";
const passer=player(s,s.possessor),runner=player(s,"9");from=passer.position;
to=point(Math.min(39,runner.position.x+9),runner.position.z-3);
const lane=passingLaneOpen(s,from,to,2);
successful=choice===0&&lane;
if(successful){moves["9"]=to;ballTo=to;recipient="9";feedback="You released the ball early into number 9's run, ahead of the nearest defender."}
else if(choice===1){moves["d4"]=point(Math.max(-14,from.x-2),from.z+2);recipient=s.possessor;ballTo=from;feedback="You held the ball while the nearest defender closed you down. The passing opportunity disappeared."}
else{recipient=s.possessor;ballTo=from;feedback="The through lane was blocked, so the pass was not played. Scan for another option."}
}else{
action=choice===0?"through-ball":"shot";
const carrier=player(s,s.possessor);from=carrier.position;
const target=point(46,choice===0?Math.max(-9,Math.min(9,from.z)):from.z+18);
const lane=passingLaneOpen(s,from,target,1.5);
successful=choice===0&&s.possessor==="9"&&lane;
ballTo=choice===1?target:successful?target:from;
recipient=successful?"goal":choice===1?"out":s.possessor;
feedback=successful?"Number 9 has space and a clear route to goal. She drives forward and finishes.":choice===0?"There isn't a clear route for a through ball. The team retains possession.":"The speculative effort travels away from the target. A better option was available.";
}
const outcome:DecisionOutcome={action,successful,feedback,from,to,ballFrom,ballTo,recipient,phase:p};
return update(s,moves,ballTo,recipient,outcome)
}
export function validateState(s:MatchState){if(s.players.some(p=>Math.abs(p.position.x)>52||Math.abs(p.position.z)>34))throw Error("Player outside pitch");if(s.phase!==s.history.length)throw Error("Invalid decision history");if(!s.players.some(p=>p.id===s.possessor)&&!["goal","out"].includes(s.possessor))throw Error("Invalid possession");return true}
