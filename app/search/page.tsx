import Link from 'next/link';
import {pageMetadata} from '../../lib/siteMetadata';
import {cleanQuery,searchSite} from '../../lib/siteSearch';
import {directoryCategories} from '../../lib/siteDirectory';
import '../../components/site-search.css';
export const metadata={...pageMetadata('/search'),robots:{index:false,follow:true}};
function Highlight({text,query}:{text:string;query:string}){
  const terms=query.match(/[a-z0-9]{2,}/gi)||[];
  if(!terms.length)return <>{text}</>;
  const pattern=new RegExp('('+terms.join('|')+')','ig');
  return <>{text.split(pattern).map((part,i)=>i%2?<mark key={i}>{part}</mark>:part)}</>;
}
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string|string[];category?:string|string[]}>}){
  const params=await searchParams;const q=cleanQuery(params.q);
  const category=typeof params.category==='string'&&directoryCategories.includes(params.category as typeof directoryCategories[number])?params.category:'';
  const all=searchSite(q),results=category?all.results.filter(r=>r.category===category):all.results;
  const usable=q.length>=2;const url=(c:string)=>'/search?'+new URLSearchParams({q,...(c?{category:c}:{})});
  return <div className="discovery-page"><section className="discovery-hero"><div className="home-width"><p className="discovery-eyebrow">SEARCH STAR</p><h1>What are you<br/><span>looking for?</span></h1><p>Search programmes, pages, common questions and the full Football Hub guides.</p><form action="/search" method="get" role="search" aria-label="Search all STAR content" className="discovery-form"><label htmlFor="site-query">Search term or question</label><div><input id="site-query" name="q" type="search" maxLength={120} defaultValue={q} placeholder="Try first touch, programme prices or autism"/>{category&&<input type="hidden" name="category" value={category}/>}<button>Search →</button></div></form></div></section>
    <div className="home-width discovery-content">
      {usable?<><nav className="discovery-filters" aria-label="Filter search results">{['',...directoryCategories].map(c=><Link key={c} href={url(c)} aria-current={category===c?'page':undefined}>{c||'All results'} <span>{c?all.results.filter(r=>r.category===c).length:all.total}</span></Link>)}</nav><div className="search-results-heading"><h2>{results.length} {results.length===1?'result':'results'} for “{q}”</h2><Link href="/site-index">Browse Site Index →</Link></div>
        {results.length?<ol className="search-results">{results.map((r,i)=><li key={r.href+r.title+i}><article><span className="discovery-eyebrow">{r.category}</span><h3><Link href={r.href}><Highlight text={r.title} query={q}/> <span aria-hidden="true">→</span></Link></h3><p><Highlight text={r.excerpt} query={q}/></p><small>{r.href}</small></article></li>)}</ol>:<section className="discovery-empty"><h3>No matches in {category||'the website'}.</h3><p>Try one or two words, a programme name or a football skill. You can also change the category.</p>{category&&<Link href={url('')}>Search all sections →</Link>}<Link href="/contact">Ask STAR for help →</Link></section>}</>:<section className="discovery-empty"><h2>{q?'Use at least two characters.':'A useful place to start.'}</h2><p>Try a programme, football skill or question. For example:</p><div className="discovery-jumps">{['One to One Coaching','Free assessment','First touch','Beginner','Autism','Parent login'].map(term=><Link key={term} href={'/search?'+new URLSearchParams({q:term})}>{term} →</Link>)}</div><Link href="/site-index">Browse every section in the Site Index →</Link></section>}
      <aside className="discovery-note"><strong>Public website search</strong><p>Personal player information and private learning resources are available after signing in to your portal.</p></aside>
    </div></div>;
}
