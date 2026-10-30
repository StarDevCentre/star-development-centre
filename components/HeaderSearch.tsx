"use client";
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import type {SearchResult} from '../lib/siteSearch';

export function SearchIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>}
export function HeaderSearch({expanded,onExpandedChange}:{expanded:boolean;onExpandedChange:(value:boolean)=>void}){
  const [query,setQuery]=useState(''),[open,setOpen]=useState(false),[results,setResults]=useState<SearchResult[]>([]),[total,setTotal]=useState(0),[status,setStatus]=useState<'idle'|'loading'|'ready'|'error'>('idle');
  const root=useRef<HTMLDivElement>(null),input=useRef<HTMLInputElement>(null),opener=useRef<HTMLElement|null>(null);const path=usePathname();
  useEffect(()=>{setOpen(false)},[path]);
  useEffect(()=>{if(expanded){opener.current=document.activeElement as HTMLElement;input.current?.focus()}else setOpen(false)},[expanded]);
  const closeSearch=()=>{onExpandedChange(false);opener.current?.focus()};
  useEffect(()=>{
    const outside=(e:PointerEvent)=>{if(!(e.target as Element).closest('[data-header-search-toggle]')&&!root.current?.contains(e.target as Node))onExpandedChange(false)};
    const shortcut=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();onExpandedChange(true);input.current?.focus();setOpen(true)}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',shortcut);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',shortcut)};
  },[onExpandedChange]);
  useEffect(()=>{
    setResults([]);setTotal(0);
    if(!expanded||!open||query.trim().length<2){setStatus('idle');return}
    const controller=new AbortController();setStatus('loading');
    const timer=window.setTimeout(async()=>{
      try{
        const response=await fetch('/api/site-search?'+new URLSearchParams({q:query}),{signal:controller.signal});
        if(!response.ok)throw new Error('Search unavailable');
        const data=await response.json();if(controller.signal.aborted)return;
        setResults(data.results);setTotal(data.total);setStatus('ready');
      }catch{if(!controller.signal.aborted)setStatus('error')}
    },200);
    return()=>{window.clearTimeout(timer);controller.abort()};
  },[query,open,expanded]);
  const href='/search?'+new URLSearchParams({q:query.trim()});
  if(!expanded)return null;
  return <div className="header-search-band" id="header-search-expanded"><div className="home-width header-search-row"><span className="header-search-caption">FIND YOUR WAY AT STAR</span><div ref={root} className="header-search" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)}} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();closeSearch()}}}>
    <form action="/search" method="get" role="search" aria-label="Search STAR website" onSubmit={()=>setOpen(false)}>
      <SearchIcon/><label className="discovery-sr" htmlFor="header-site-query">Search STAR</label><input ref={input} id="header-site-query" name="q" type="search" maxLength={120} placeholder="Search programmes, support, football guides…" value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>setOpen(true)} autoComplete="off" aria-controls={open?'header-search-suggestions':undefined}/><button type="submit">Search <span aria-hidden="true">→</span></button><button className="header-search-close" type="button" onClick={closeSearch} aria-label="Close site search">✕</button>
    </form>
    {open&&<div className="header-search-panel" id="header-search-suggestions"><div className="header-search-panel-top"><strong>{query.trim().length<2?'Popular searches':'Search suggestions'}</strong><button type="button" onClick={()=>{input.current?.focus();setOpen(false)}} aria-label="Close search suggestions">✕</button></div>
      {query.trim().length<2?<><p>Search pages, programmes, questions and football guides.</p><div className="header-search-popular">{['One to One Coaching','Free assessment','Autism','Parent login','Confidence'].map(q=><Link key={q} href={'/search?'+new URLSearchParams({q})} onClick={()=>{setOpen(false);onExpandedChange(false)}}>{q} <span aria-hidden="true">↗</span></Link>)}</div></>:<><p role="status">{status==='loading'?'Finding matches…':status==='error'?'Suggestions are unavailable. Press Search to see results.':status==='ready'?(total?`${total} ${total===1?'match':'matches'} found`:'No matches yet. Try a shorter phrase or another word.'):'Enter at least two characters.'}</p>{!!results.length&&<ul>{results.map((r,i)=><li key={r.href+r.title+i}><Link href={r.href} onClick={()=>{setOpen(false);onExpandedChange(false)}}><small>{r.category}</small><strong>{r.title}</strong><span>{r.excerpt}</span></Link></li>)}</ul>}<Link className="header-search-all" href={href} onClick={()=>{setOpen(false);onExpandedChange(false)}}>See all search results <span aria-hidden="true">→</span></Link></>}
      <Link className="header-search-index" href="/site-index" onClick={()=>{setOpen(false);onExpandedChange(false)}}>Browse the Site Index</Link>
    </div>}
  </div></div></div>;
}
