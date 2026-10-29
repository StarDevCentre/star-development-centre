import Link from 'next/link';
import {pageMetadata} from '../../lib/siteMetadata';
import {directoryCategories,siteDirectory} from '../../lib/siteDirectory';
import '../../components/site-search.css';
export const metadata=pageMetadata('/site-index');
export default function SiteIndex(){return <div className="discovery-page">
  <section className="discovery-hero"><div className="home-width"><p className="discovery-eyebrow">EXPLORE STAR</p><h1>Every page.<br/><span>A clear way forward.</span></h1><p>Find coaching, practical football guidance and the right place to begin. Browse by section or search for what matters to you.</p><form action="/search" role="search" aria-label="Search from Site Index" className="discovery-form"><label htmlFor="index-query">Search STAR</label><div><input id="index-query" name="q" type="search" maxLength={120} placeholder="Try confidence, Flyers or first session"/><button>Search →</button></div></form></div></section>
  <div className="home-width discovery-content"><nav className="discovery-jumps" aria-label="Site Index sections">{directoryCategories.map((c,i)=><a key={c} href={'#directory-'+i}>{c} ↓</a>)}</nav>
    {directoryCategories.map((category,i)=><section className="directory-section" id={'directory-'+i} key={category} aria-labelledby={'directory-title-'+i}><div className="directory-heading"><span aria-hidden="true">0{i+1}</span><h2 id={'directory-title-'+i}>{category}</h2></div><div className="directory-grid">{siteDirectory.filter(p=>p.category===category).map((p,n)=><Link key={p.href+p.title+n} href={p.href} className="directory-card"><h3>{p.title} <span aria-hidden="true">↗</span></h3><p>{p.description}</p></Link>)}</div></section>)}
    <aside className="discovery-note"><strong>Looking for your family’s information?</strong><p>Sign in to the Parent Portal or Player Space for personal records and private learning resources.</p><Link href="/contact">Need help finding something? Contact STAR →</Link></aside>
  </div></div>}
