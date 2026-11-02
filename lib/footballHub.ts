import content from './content/football-hub-articles.json';
export type HubArticle={slug:string;publishedAt?:string;modifiedAt?:string;relatedSlugs?:string[];title:string;category:string;summary:string;intro:string;sections:{title:string;paragraphs:string[]}[];practice:string;takeaways:string[];sources:{label:string;url:string}[]};
export const hubArticles:HubArticle[]=content;
export const hubCategories=[...new Set(hubArticles.map(a=>a.category))];
export function articleWords(a:HubArticle){return [a.intro,...a.sections.flatMap(s=>s.paragraphs),a.practice,...a.takeaways].join(' ').trim().split(/\s+/).length}
export function readingMinutes(a:HubArticle){return Math.max(1,Math.ceil(articleWords(a)/180))}
export function categoryId(value:string){return value.toLowerCase().replace(/[^a-z0-9]+/g,'-')}
