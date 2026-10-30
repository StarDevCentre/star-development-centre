export type PlayerExperience='children'|'teenagers';
export const playerExperiences=[
 {value:'children',label:'Children',ages:'7–11',description:'Simple words, playful cards and room to explore.'},
 {value:'teenagers',label:'Teenagers',ages:'12–18',description:'The original illustrated Player Space, with its full personality.'}
] as const;

// Both retired teen preferences keep the former younger-teen presentation.
export function playerExperience(value:unknown):PlayerExperience{return value==='children'?'children':'teenagers';}
export function requestedExperience(value:unknown):value is PlayerExperience{return value==='children'||value==='teenagers';}

// Short STAR adaptations of the existing guides; full guidance/sources stay available.
export const childrenLearning:Record<string,{title:string;summary:string;tryIt:string}>={
 'goalkeeper-part-of-the-team':{title:'Goalkeepers can pass too!',summary:'A goalkeeper stops shots and helps the team keep the ball.',tryIt:'If your team has the ball, find a space where a teammate can pass to you.'},
 'defenders-connected':{title:'Defend with your friends',summary:'Defenders help each other. Talk, look around and stay ready.',tryIt:'Try saying “I’m here!” when a teammate needs your help.'},
 'midfield-number-six':{title:'Help in the middle',summary:'Midfielders help their team attack and defend.',tryIt:'Ask your coach where to stand so a teammate can pass to you.'},
 'forwards-move-to-receive':{title:'Find a space near the goal',summary:'You can help an attack before you touch the ball.',tryIt:'Look for a space where a teammate can pass to you. Stay where they can see you.'},
 'scanning-picture-first':{title:'Have a little look',summary:'Look around before the ball comes. Where are your teammates?',tryIt:'Before a pass reaches you, have a quick look for a teammate or some space.'},
 'support-make-an-angle':{title:'Pass and help again',summary:'After you pass, you can move to help your teammate.',tryIt:'Pass the ball, then find a new space where your teammate can see you.'},
 'mary-earps-your-role-matters':{title:'Every player helps',summary:'Mary Earps is a goalkeeper. Every position can help the team.',tryIt:'Think of one thing you did to help your team. A pass or a kind word counts too.'},
 'leah-williamson-lead-your-way':{title:'Be a helpful teammate',summary:'You can help others in your own way, just like a captain.',tryIt:'At your next game, cheer on a teammate who is trying something tricky.'},
 'bunny-shaw-create-and-finish':{title:'Help make a goal',summary:'Bunny Shaw is a forward. Passing and moving can help someone score.',tryIt:'Notice a good pass as well as a good goal. Both help the team.'}
};
