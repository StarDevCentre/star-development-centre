import {siteDirectory, type DirectoryEntry} from './siteDirectory';
export type SearchResult = Pick<DirectoryEntry,'href'|'title'|'category'> & {excerpt:string};
export const maxSearchLength=120;
export function cleanQuery(value:unknown){return typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,maxSearchLength):''}
function normalise(s:string){return s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/one[ -]to[ -]one|1\s*[:–-]\s*1|1\s*to\s*1/g,'individual').replace(/[^a-z0-9]+/g,' ').trim()}
const stop=new Set('a an the for to of in on at with and or is are does do can my her she we i how what where when much many about please find looking want need year years old daughter child girl girls'.split(' '));
const aliases:Record<string,string>={fees:'prices',fee:'prices',cost:'prices',costs:'prices',pricing:'prices',price:'prices',autistic:'autism',signup:'register',registration:'register',beginners:'beginner',program:'programme',programs:'programmes',signin:'login',training:'coaching',aged:'age'};
function word(s:string){const v=aliases[s]||s;return v.length>4&&v.endsWith('s')?v.slice(0,-1):v}
function tokens(s:string){return normalise(s).split(' ').filter(t=>t&&!stop.has(t)).map(word)}
function near(a:string,b:string){
  if(a===b||b.startsWith(a))return true;
  if(a.length<5||Math.abs(a.length-b.length)>1)return false;
  let i=0,j=0,errors=0;
  while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}if(++errors>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++}
  return errors+(a.length-i)+(b.length-j)<=1;
}
const indexed=siteDirectory.map(entry=>({entry,title:tokens(entry.title),description:tokens(entry.description),keywords:tokens(entry.keywords||''),body:tokens(entry.body||'')}));
function excerpt(entry:DirectoryEntry,terms:string[]){
  const text=entry.body||entry.description;
  const summaryMatches=terms.some(t=>tokens(entry.description).some(w=>near(t,w)));
  if(summaryMatches||!entry.body)return entry.description;
  const parts=[...text.matchAll(/\S+/g)];
  const at=parts.find(m=>tokens(m[0]).some(w=>terms.some(t=>near(t,w))))?.index||0;
  const start=at>65?text.lastIndexOf(' ',at-65)+1:0;
  const raw=text.slice(start,start+230);const end=raw.length===230?raw.lastIndexOf(' '):raw.length;
  return (start?'…':'')+raw.slice(0,end)+(start+end<text.length?'…':'');
}
export function searchSite(query:unknown,category='',limit=100):{query:string;total:number;results:SearchResult[]}{
  const q=cleanQuery(query),terms=[...new Set(tokens(q))].slice(0,12);
  if(q.length<2||!terms.length)return {query:q,total:0,results:[]};
  const ranked=indexed.flatMap(({entry,title,description,keywords,body})=>{
    if(category&&category!==entry.category)return [];
    let score=0;
    for(const term of terms){
      const weight=title.some(w=>near(term,w))?12:keywords.some(w=>near(term,w))?8:description.some(w=>near(term,w))?5:body.some(w=>near(term,w))?2:0;
      if(!weight)return [];score+=weight;
    }
    if(normalise(entry.title).includes(normalise(q)))score+=25;
    if(normalise(entry.title).startsWith(normalise(q)))score+=6;
    return [{entry,score}];
  }).sort((a,b)=>b.score-a.score||a.entry.title.localeCompare(b.entry.title));
  return {query:q,total:ranked.length,results:ranked.slice(0,Math.max(0,Math.min(limit,100))).map(({entry})=>({href:entry.href,title:entry.title,category:entry.category,excerpt:excerpt(entry,terms)}))};
}
