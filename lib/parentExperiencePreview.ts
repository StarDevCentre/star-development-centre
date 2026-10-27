export const previewSections=["Home","Development","Sessions","Messages","Moments","Learning","My space"] as const;
export type PreviewSection=typeof previewSections[number];
export const homeWidgets=["progress","coach","milestones","moments","learning","pitch"] as const;
export type Widget=typeof homeWidgets[number];
export const spaceAccents=[
 {id:"gold",label:"STAR gold",colour:"#f5cf78"},
 {id:"ice",label:"Ice blue",colour:"#a4d8f5"},
 {id:"rose",label:"Hot pink",colour:"#ff9fcb"},
 {id:"electric",label:"Electric blue",colour:"#75bfff"},
 {id:"teal",label:"Neon teal",colour:"#7cebd3"},
 {id:"ember",label:"Sunset orange",colour:"#ffbd89"},
 {id:"violet",label:"Ultra violet",colour:"#c7b0ff"},
 {id:"white",label:"Pure white",colour:"#f0f5ff"}
] as const;
export type Accent=typeof spaceAccents[number]["id"];
export const spaceScenes=[
 {id:"stadium",label:"Matchnight",description:"Floodlights & deep navy"},
 {id:"starburst",label:"Electric arena",description:"Racing lines & blue light"},
 {id:"aurora",label:"Northern lights",description:"Teal & violet colour waves"},
 {id:"sunset",label:"Sunset sessions",description:"Orange glow & purple skies"},
 {id:"pitch",label:"Pitchside",description:"A floodlit pitch in perspective"},
 {id:"midnight",label:"Blackout",description:"Black, white & sharp edges"}
] as const;
export type Atmosphere=typeof spaceScenes[number]["id"];
export type SpaceSettings={accent:Accent;atmosphere:Atmosphere;typeface:"sport"|"clean"|"scoreboard";cards:"solid"|"glass"|"outline";layout:"balanced"|"mosaic"|"feed";stage:"floating"|"card"|"spotlight";glow:"low"|"high";motion:boolean;compact:boolean;order:Widget[];hidden:Widget[];wide:Widget[];name:string;number:string;hero:"shirt"|"photo"};
export type SpaceLook={id:string;name:string;description:string;settings:Pick<SpaceSettings,"accent"|"atmosphere"|"typeface"|"cards"|"layout"|"stage"|"glow">};
export const spaceLooks:SpaceLook[]=[
 {id:"star",name:"STAR Matchnight",description:"Bold type. Gold lights. All STAR.",settings:{accent:"gold",atmosphere:"stadium",typeface:"sport",cards:"glass",layout:"balanced",stage:"floating",glow:"high"}},
 {id:"electric",name:"Electric Arena",description:"Blue beams. Sharp frames. Full energy.",settings:{accent:"electric",atmosphere:"starburst",typeface:"scoreboard",cards:"outline",layout:"mosaic",stage:"card",glow:"high"}},
 {id:"aurora",name:"Northern Lights",description:"Colour waves. Glass panels. A new mood.",settings:{accent:"teal",atmosphere:"aurora",typeface:"clean",cards:"glass",layout:"balanced",stage:"spotlight",glow:"high"}},
 {id:"sunset",name:"Sunset Sessions",description:"Warm skies. Violet shadows. Big presence.",settings:{accent:"ember",atmosphere:"sunset",typeface:"sport",cards:"solid",layout:"mosaic",stage:"spotlight",glow:"high"}},
 {id:"pitch",name:"Pitchside",description:"Pitch markings. Cool teal. Football first.",settings:{accent:"teal",atmosphere:"pitch",typeface:"sport",cards:"solid",layout:"balanced",stage:"floating",glow:"low"}},
 {id:"blackout",name:"Blackout",description:"Monochrome. Hard edges. One clear feed.",settings:{accent:"white",atmosphere:"midnight",typeface:"sport",cards:"outline",layout:"feed",stage:"card",glow:"low"}}
];
export function applySpaceLook(settings:SpaceSettings,id:string):SpaceSettings{const look=spaceLooks.find(l=>l.id===id);return look?{...settings,...look.settings}:settings;}
export function activeSpaceLook(settings:SpaceSettings){return spaceLooks.find(l=>(Object.keys(l.settings) as (keyof SpaceLook["settings"])[]).every(k=>settings[k]===l.settings[k]))?.id||"custom";}
export const samplePlayers=[{id:"alex",name:"Alex",number:"7",programme:"Flyers",position:"Finding her confidence",coach:"Dean",focus:"Look up before receiving the ball",session:"Individual development",time:"17:30–18:30",venue:"STAR training ground · Sample venue"},{id:"sam",name:"Sam",number:"11",programme:"Prestige",position:"Making the game her own",coach:"Becky",focus:"Turn into space with her first touch",session:"Technical development",time:"18:30–19:30",venue:"STAR training ground · Sample venue"}];
export function defaultSpace(player=samplePlayers[0]):SpaceSettings{return {...spaceLooks[0].settings,motion:true,compact:false,order:[...homeWidgets],hidden:[],wide:["progress"],name:player.name.toUpperCase(),number:player.number,hero:"shirt"};}
export function safeSpace(value:unknown,player=samplePlayers[0]):SpaceSettings{
 const d=defaultSpace(player);if(!value||typeof value!=="object")return d;const v=value as Partial<SpaceSettings>;
 const widgets=(a:unknown)=>Array.isArray(a)?a.filter((x):x is Widget=>homeWidgets.includes(x)).filter((x,i,a)=>a.indexOf(x)===i):[];
 const order=widgets(v.order);
 return {...d,
  accent:spaceAccents.some(a=>a.id===v.accent)?v.accent!:d.accent,
  atmosphere:spaceScenes.some(a=>a.id===v.atmosphere)?v.atmosphere!:d.atmosphere,
  typeface:["sport","clean","scoreboard"].includes(v.typeface||"")?v.typeface!:d.typeface,
  cards:["solid","glass","outline"].includes(v.cards||"")?v.cards!:d.cards,
  layout:["balanced","mosaic","feed"].includes(v.layout||"")?v.layout!:d.layout,
  stage:["floating","card","spotlight"].includes(v.stage||"")?v.stage!:d.stage,
  glow:v.glow==="low"?"low":"high",
  motion:v.motion!==false,compact:v.compact===true,
  order:[...order,...homeWidgets.filter(x=>!order.includes(x))],hidden:widgets(v.hidden),wide:Array.isArray(v.wide)?widgets(v.wide):d.wide,
  name:typeof v.name==="string"?v.name.slice(0,14):d.name,
  number:typeof v.number==="string"&&/^\d{1,2}$/.test(v.number)?v.number:d.number,
  hero:v.hero==="photo"?"photo":"shirt"};
}
export function moveWidget(order:Widget[],key:Widget,delta:number){const next=[...order],i=next.indexOf(key),j=i+delta;if(i>=0&&j>=0&&j<next.length)[next[i],next[j]]=[next[j],next[i]];return next;}
export const assessmentDates=["July","August","September","October"];
export const assessmentSeries=[{name:"Ball control",values:[2,2.5,3,3.5],note:"Alex is taking her first touch into space more often. Next: notice the defender before the ball arrives."},{name:"Game awareness",values:[1.5,2,2.5,3],note:"She is beginning to look over her shoulder. Next: one early look before receiving."},{name:"Confidence",values:[2,3,2.5,3.5],note:"Confidence can vary between sessions. She is asking questions and trying again after a mistake."}];
export const learningArticles=[{id:"feedback",category:"Supporting her",title:"The conversation after training",description:"A little curiosity can go a long way.",time:"3 min read",image:"/images/star-parent-feedback.webp",body:["Start with her experience. ‘What did you enjoy today?’ gives her room to tell you what mattered to her.","If she mentions coach feedback, ask what she understood and what she wants to try next. If an instruction is unclear, she can ask the coach for an example at her next session.","Some days she may want to talk. Other days she may want a quiet journey home. Let her choose, and avoid turning every journey into a review of mistakes."],prompt:"What was one moment you enjoyed today?"},{id:"ambition",category:"Confidence & belonging",title:"Let her choose the next step",description:"Her goals. Her pace. Your support.",time:"4 min read",image:"/images/star-player-grass.webp",body:["Ask what she wants from football right now. It could be improving a skill, enjoying time with her team or exploring a different level.","Agree a small next step together. Goals can change as school, friendships and interests change. A break or a different pace can be part of her journey.","Talk to her coach if she is worried about sessions. Listen to her own view before suggesting solutions."],prompt:"What would make football feel good for you this season?"},{id:"practice",category:"At home",title:"Make room for a little play",description:"An optional five minutes with a ball.",time:"2 min read",image:"/images/star-player-individual.webp",body:["If she wants to practise, find a safe space and let her choose a simple activity. A few gentle touches or passes against a suitable wall can be enough.","Connect it to one idea from coaching. For example, look up before a pass or try a first touch into space. Let her experiment without scoring every attempt.","Home practice is optional. Rest, school and friendships have a place too. If the week feels full, tell STAR and discuss a lighter session."],prompt:"Would you like to show me something you tried?"}];

// Shared fictional development-plan content for the focus card, report and pitch profile.
export const previewDevelopmentPlans: Record<string, { strengths: string[]; targets: string[] }> = {
 alex: { strengths: ["Taking her first touch into space more often.", "Willing to try a new idea, even when it feels unfamiliar."], targets: [samplePlayers[0].focus, "Notice the defender before the ball arrives."] },
 sam: { strengths: ["Finding space to receive a pass.", "Exploring a turn she feels comfortable using."], targets: [samplePlayers[1].focus, "Look for a teammate after turning."] }
};
