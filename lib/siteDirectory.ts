import {publicPages} from './siteMetadata';
import {hubArticles} from './footballHub';
import {programmes,programmeForAge} from './siteData';
import {groupSessions, programmeDetails} from './programmeOptions';
import help from './content/site-help.json';
import pageText from './content/site-page-text.json';

export const directoryCategories = ['Pages', 'Programmes', 'Football guides', 'Help & accounts'] as const;
export type DirectoryCategory = typeof directoryCategories[number];
export type DirectoryEntry = {href:string; title:string; description:string; category:DirectoryCategory; keywords?:string; body?:string};

// Deliberate public allowlist: never discover routes, query family records or import portal content.
export const siteDirectory:DirectoryEntry[] = [
  ...publicPages.map(p=>({href:p.path,title:p.title,description:p.description,category:'Pages' as const,body:(pageText as Record<string,string>)[p.path]})),
  ...programmes.map(p=>{
    const d=programmeDetails[p.slug];
    return {href:'/programmes#'+p.slug,title:p.title,description:p.age+' · '+p.summary,category:'Programmes' as const,
      keywords:(p.slug==='one-to-one'?'individual private ad hoc 1 to 1 1-1 1:1':p.slug==='season-support'?'match observation club visit':p.slug)+' age '+Array.from({length:14},(_,i)=>i+5).filter(age=>programmeForAge(p.slug,age)).join(' '),
      body:[p.detail,...(d?[d.intro,d.fit,...d.includes,d.duration,d.format,d.schedule,d.note]:[])].join(' ')};
  }),
  ...groupSessions.map(g=>({href:'/programmes#'+g.id,title:g.title+' · ages '+g.minAge+'–'+g.maxAge,description:g.schedule+' · 45 minutes. '+g.focus,category:'Programmes' as const,keywords:'group timetable schedule after school age '+Array.from({length:g.maxAge-g.minAge+1},(_,i)=>g.minAge+i).join(' ')})),
  {href:'/#parent-support',title:'For parents: support and common questions',description:'Coaching feedback, confidence, balancing football with school and preparing for a first session.',category:'Help & accounts',keywords:'mum dad family FAQ questions school nervous beginner venue kit'},
  {href:'/#home-members-pack',title:'The STAR members’ pack',description:'Training top, bag, bottle and practical extras. Flyers and Prestige on joining; One to One Coaching after five sessions.',category:'Help & accounts',keywords:'kit shirt socks bands stickers notebook gifts uniform'},
  {href:'/inclusion',title:'Autism friendly coaching and individual support',description:'Talk to STAR about autism, ADHD, sensory needs, communication preferences and what helps her learn.',category:'Help & accounts',keywords:'neurodivergent neurodiversity autistic inclusive inclusion additional needs SEN SEND'},
  {href:'/programmes#compare',title:'Programme prices and payment options',description:'Sign in on the Programmes page to view prices and payment options. You can enquire without an account.',category:'Help & accounts',keywords:'coaching cost fees pricing affordable pay payments instalments'},
  {href:'/register',title:'Free assessment and getting started',description:'Create a parent account, complete her player profile and request a free 30-minute assessment and introduction. STAR confirms the arrangements.',category:'Help & accounts',keywords:'join signup sign up register first session introduction assessment'},
  {href:'/parent-portal',title:'Parent Portal login',description:'Sign in to your family account for sessions, development updates and the private Parent Learning Hub.',category:'Help & accounts',keywords:'parent sign in account password learning hub reports gallery consent'},
  {href:'/player-portal',title:'Player Space login',description:'Sign in to your Player Space for coach-assigned practice, personal goals and achievements.',category:'Help & accounts',keywords:'player portal sign in account trophies badges training practice'},
  {href:'/staff',title:'Staff Portal login',description:'Sign in to the staff area. Access is for authorised STAR coaches and staff.',category:'Help & accounts',keywords:'coach staff sign in login'},
  ...help.map(p=>({...p,category:'Help & accounts' as const})),
  ...hubArticles.map(a=>({href:'/articles/'+a.slug,title:a.title,description:a.summary,category:'Football guides' as const,keywords:a.category,
    body:[a.intro,...a.sections.flatMap(s=>[s.title,...s.paragraphs]),a.practice,...a.takeaways].join(' ')}))
];
