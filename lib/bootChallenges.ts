import type {LearningProgress} from './playerPortalFeatures';
export type BootChoice={id:string;label:string;feedback:string;useful:boolean};
export type BootDecision={id:string;prompt:string;choices:BootChoice[]};
export type BootChallenge={id:string;title:string;topic:string;lesson:string;tryIt:string;decisions:BootDecision[]};
export type CollectibleBoot={id:string;name:string;colour:string;edition:string;challenge:string;source:string};
const adidas='https://www.arsenal.com/news/adidas-launches-road-to-glory-pack-aIfmK8S6ta41';
const puma='https://mediahub.puma.com/articles/puma-launches-the-foreverfaster-pack';
export const collectibleBoots:CollectibleBoot[]=[
 {id:'tiempo',name:'Nike Tiempo Legend 10 Pro',colour:'Black / Deep Jungle',edition:'Black Pack',challenge:'first-touch',source:'https://www.nike.com/gb/w/all-products-tiempo-football-1gdj0z20w7kz3ci69'},
 {id:'copa',name:'adidas Copa Pure III',colour:'White / Black / Metallic Gold',edition:'Road to Glory · 2025',challenge:'passing',source:adidas},
 {id:'mercurial',name:'Nike Mercurial Vapor 16 Pro',colour:'Limelight / Hyper Crimson / Volt',edition:'Limelight',challenge:'dribbling',source:'https://www.nike.com/gb/t/mercurial-vapor-16-pro-firm-ground-low-top-football-boot-Kwi10YUj/FQ8685-300'},
 {id:'predator',name:'adidas Predator',colour:'White / Black / Metallic Gold',edition:'Road to Glory · 2025',challenge:'finishing',source:adidas},
 {id:'future',name:'PUMA FUTURE 7',colour:'Sunset Glow / Sun Stream',edition:'FOREVER. FASTER. · 2024',challenge:'defending',source:puma},
 {id:'ultra',name:'PUMA ULTRA ULTIMATE',colour:'Sun Stream / Sunset Glow',edition:'FOREVER. FASTER. · 2024',challenge:'goalkeeping',source:puma},
 {id:'phantom',name:'Nike Phantom 6 Low Pro',colour:'Racer Blue / White / Pink Blast',edition:'Turf edition',challenge:'scanning',source:'https://www.nike.com/gb/t/phantom-6-low-pro-turf-football-shoe-GrYLmVwl'},
 {id:'f50',name:'adidas F50',colour:'White / Black / Metallic Gold',edition:'Road to Glory · 2025',challenge:'teamwork',source:adidas}
];
function decision(id:string,prompt:string,answer:'A'|'B'|'C',options:[string,string][]):BootDecision{
 return{id,prompt,choices:options.map(([label,feedback],i)=>({id:['A','B','C'][i],label,feedback,useful:['A','B','C'][i]===answer}))};
}
export const bootChallenges:BootChallenge[]=[
 {id:'first-touch',title:'Make your first touch count',topic:'First touch',lesson:'Look before the ball arrives. Keep your touch within reach and prepare the next action. The space and pressure decide its direction.',tryIt:'With a partner in a safe space, receive a gentle pass through one of two marker gates. Try both feet and take breaks when you want.',decisions:[
 decision('touch-space','A defender is close on your right as you receive a pass. Space is open on your left. What could your first touch do?','A',[
 ['Guide the ball left, away from pressure.','You use the free space and keep your body between the defender and ball.'],['Push the ball towards the defender.','That takes you into the pressure. Look for the space on your left.'],['Always stop it under your foot.','Stopping can help sometimes, but here a touch into space prepares your next move.']]),
 decision('touch-weight','A firm pass arrives in a crowded space. How can you keep your first touch close?','B',[
 ['Keep your foot stiff and kick back at it.','A stiff contact can make the ball bounce further away.'],['Relax your receiving foot and cushion the ball.','A softer contact takes pace off the ball so it stays within reach.'],['Take the biggest touch possible.','A big touch may escape your control in a crowded space.']]),
 decision('touch-shield','A defender is tight behind you and you cannot turn safely. What can you do?','C',[
 ['Turn into the defender without checking.','Check pressure first; turning straight into it may lose the ball.'],['Leave the ball and wait.','You can still protect the ball and find support.'],['Protect the ball with your body and use a supporting teammate.','Keeping it safe gives your team another chance to move it.']])]},
 {id:'passing',title:'Connect the next pass',topic:'Passing',lesson:'Look at the route, set your body and judge the weight of your pass. Move again after you release the ball.',tryIt:'Pass gently through a marker gate with a partner. Change the distance and notice how the weight of your pass changes.',decisions:[
 decision('pass-route','A teammate is free but an opponent blocks the direct passing lane. What could help?','B',[
 ['Pass straight through the opponent.','The opponent can intercept that route.'],['Change the angle or find another open teammate.','A new angle can open a clear passing lane.'],['Kick harder without looking again.','More force does not remove the opponent.']]),
 decision('pass-weight','A teammate is just a few steps away. What pass usually helps them?','A',[
 ['A controlled pass with enough pace to reach them.','Judge the distance so the pass arrives where your teammate can use it.'],['The hardest pass you can make.','That can be difficult to control at a short distance.'],['A tiny touch that stops halfway.','The ball needs enough pace to reach your teammate.']]),
 decision('pass-support','Your pass reaches a teammate. What can you do next?','C',[
 ['Stand behind an opponent.','That hides you from a return pass.'],['Stay in exactly the same spot every time.','The picture changes; look for a useful place to help.'],['Move to a new supporting angle.','Your movement gives your teammate another option.']])]},
 {id:'dribbling',title:'Carry with control',topic:'Dribbling',lesson:'Match your touches to the space. Keep the ball close near opponents. Look up when you can and change direction or pace for a reason.',tryIt:'Dribble between three markers in a safe space. Use small touches near a marker and a longer controlled touch in a bigger gap.',decisions:[
 decision('dribble-close','You are dribbling through a crowded area. What helps you keep control?','A',[
 ['Small touches, keeping the ball within reach.','Close touches make it easier to change direction.'],['One huge touch into the crowd.','Another player may reach it first.'],['Watch only the ball for the whole run.','Quick looks around help you notice changing space.']]),
 decision('dribble-space','You beat a defender and have clear space ahead. What could you do?','B',[
 ['Stop and wait for the defender to catch up.','You can use the space while it is open.'],['Take a longer controlled touch and accelerate into space.','You adapt to the room available while keeping the ball reachable.'],['Kick as far as possible with no next action.','A useful longer touch still stays under your control.']]),
 decision('dribble-exit','A second defender closes your route. A teammate is free beside you. What is a useful option?','C',[
 ['Dribble through both defenders every time.','There is another way to keep the attack going.'],['Close your eyes and run.','You need to see the changing picture.'],['Release the pass and move to support.','Your dribble drew pressure and created a passing opportunity.']])]},
 {id:'finishing',title:'Find your finish',topic:'Finishing',lesson:'A finish starts before the strike. Notice the goal, goalkeeper and teammates. Balance and a clear target matter as well as power.',tryIt:'Practise a gentle placed finish towards a suitable target in a safe area. Look up before striking and vary where the ball arrives.',decisions:[
 decision('finish-look','You receive near goal with a moment to look up. What information helps?','B',[
 ['Only the colour of your boots.','Boot colour does not tell you where the space is.'],['The goalkeeper’s position and the space in the goal.','A quick look helps you choose a target.'],['Nothing; the hardest shot is always best.','Placement and the picture in front of you matter too.']]),
 decision('finish-balance','You are off balance after a heavy touch, but have time to settle. What can help?','A',[
 ['Adjust your feet and settle the ball for the strike.','Getting balanced helps you control the direction of your finish.'],['Swing hard while falling away.','That makes contact and direction harder to control.'],['Look away from the ball before contact.','Keep the ball in view as you make the strike.']]),
 decision('finish-choice','Your shooting angle is very narrow. A teammate has a clear view of goal in the middle. What can be a good decision?','C',[
 ['Shoot every time because you have the ball.','The best option is not always your own shot.'],['Wait until the teammate is marked.','Use the opening while it is available.'],['Play a controlled pass to set up your teammate.','A well-chosen pass can create a better team chance.']])]}
];
bootChallenges.push(
 {id:'defending',title:'Delay, guide, protect',topic:'Defending',lesson:'Protect dangerous space as well as the ball. Approach under control, get balanced and notice your support before committing.',tryIt:'Walk through a one-against-one with a partner. Practise staying balanced and guiding them away from a marker goal. Keep contact gentle.',decisions:[
 decision('defend-delay','An attacker runs at you while your teammate recovers behind. What helps most?','B',[
 ['Rush in and stretch from far away.','An uncontrolled challenge can let the attacker get past.'],['Slow down, stay balanced and delay.','This protects the goal route and gives your teammate time to recover.'],['Turn your back and stop watching.','Keep the attacker and ball in view.']]),
 decision('defend-guide','The direct route towards your goal is open. What should you protect first?','A',[
 ['The route to goal, guiding the attacker towards less dangerous space.','Your position makes the direct route harder to use.'],['Only the touchline, leaving the goal route open.','Protect the most dangerous space first.'],['The space behind the attacker.','That does not stop the route towards your goal.']]),
 decision('defend-cover','Your teammate pressures the ball. Where can you help?','C',[
 ['Stand beside them and leave the runner free.','Two on the ball can leave another route open.'],['Stay far away and stop checking.','Stay connected so you can help as the ball moves.'],['Cover behind at a useful angle and check the next runner.','Cover protects your teammate and helps deal with the next action.']])]},
 {id:'goalkeeping',title:'Set, see, support',topic:'Goalkeeping',lesson:'Move with the ball to protect your goal. Get balanced before a shot. When your team has possession, offer a safe passing option.',tryIt:'Without diving, have a partner point to different shooting positions. Shuffle into line with the ball and goal, then pause in a balanced ready position.',decisions:[
 decision('keeper-set','An attacker is about to shoot. What is a useful starting position?','A',[
 ['Balanced feet, soft knees, eyes on the ball.','A balanced set position helps you react in either direction.'],['Crossed legs and eyes turned away.','It is harder to move and see the strike.'],['Keep jumping as the shot is struck.','While airborne you cannot immediately push off the ground.']]),
 decision('keeper-angle','The ball moves from the centre to a wide shooting position. What should you consider?','B',[
 ['Stay fixed in the same spot.','The shooting angle has changed.'],['Adjust into line with the new ball position and goal, then get set.','Your movement helps cover the new shooting angle.'],['Look only at the far corner.','Watch the ball and the developing action.']]),
 decision('keeper-out','You have the ball. The central pass is blocked, but a wide teammate is free. What can you do?','C',[
 ['Pass through the central opponent.','That route is blocked.'],['Always kick long without looking.','Check the available options before deciding.'],['Check the wide route and pass with control if it stays open.','A clear wide option can start your team’s next move.']])]},
 {id:'scanning',title:'See your next move',topic:'Looking around',lesson:'A scan is a quick look to gather information. Look while the ball is travelling, then refocus on the ball. Check again when the picture changes.',tryIt:'A partner holds up a number before passing. Look, say the number, then turn your eyes back to receive the gentle pass.',decisions:[
 decision('scan-before','Your teammate is about to pass to you. When can a quick look help?','A',[
 ['Before it arrives, checking space and pressure.','You gather information while you can still prepare.'],['Only after losing the ball.','Looking earlier helps you decide what to do.'],['Look away throughout the whole pass.','Refocus on the ball so you can receive it.']]),
 decision('scan-change','You checked a moment ago, but an opponent has moved. What helps?','B',[
 ['Assume the picture cannot change.','Players keep moving; old information can stop being useful.'],['Take another quick check, then refocus on the ball.','Updating the picture helps you adapt.'],['Ask everyone to stand still.','Adjust to a game that keeps moving.']]),
 decision('scan-use','You see pressure behind and a free teammate to your left. What can you prepare?','C',[
 ['Turn straight into pressure.','Your scan warned you that the route is crowded.'],['Ignore the teammate and hold the ball forever.','The free teammate gives you a way to connect.'],['A body position and first touch that help you connect left.','You turn the information into a useful next action.']])]},
 {id:'teamwork',title:'Make room for each other',topic:'Teamwork',lesson:'Help without the ball: offer width, find a supporting angle and react together when possession changes. Clear, kind communication supports decisions.',tryIt:'Form a passing triangle with two partners. After passing, adjust to keep a clear supporting angle. Notice how the triangle changes.',decisions:[
 decision('team-width','All four outfield players have crowded around the ball. How can you help?','B',[
 ['Join the crowd.','That can make passing routes tighter.'],['Move wider into a clear passing position.','Width spreads the picture and offers another route.'],['Hide behind the nearest opponent.','Be visible along an open passing lane.']]),
 decision('team-support','A teammate is under pressure and cannot pass forward. What helps?','A',[
 ['Offer a clear supporting angle behind or beside the ball.','A safe option helps keep possession and reset.'],['Tell them every pass must go forward.','A supporting pass can create the next forward opportunity.'],['Stop moving and blame them.','Helpful movement and calm communication support them.']]),
 decision('team-transition','Your team loses the ball. What is a useful first response?','C',[
 ['Argue about the last pass.','That delays your team’s reaction.'],['Everyone chase into the same space.','You may leave dangerous routes unprotected.'],['React together: the nearest delays, others recover and cover.','Connected jobs help your team protect the goal.']])]}
);
export const bootKey=(id:string)=>'boot-'+id;
export const bootAsset=(id:string)=>`/player-space/boots/${id}.webp`;
export const bootMarker=(stepId:string)=>'mastery:boot:'+stepId;
export function bootProgress(challengeId:string,progress:LearningProgress[],playerId:string){const challenge=bootChallenges.find(c=>c.id===challengeId);return challenge?.decisions.filter(d=>progress.some(p=>p.player_id===playerId&&p.lesson_id===bootMarker(d.id))).length||0;}
export function bootAnswerMarker(item:string,answer:string){const step=bootChallenges.flatMap(c=>c.decisions).find(s=>s.id===item),selected=step?.choices.find(c=>c.id===answer);if(!step||!selected)throw new Error('Choose an available boot challenge answer.');return selected.useful?bootMarker(step.id):null;}
