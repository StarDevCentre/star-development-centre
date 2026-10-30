import type {ReactNode} from 'react';
import type {ParentLearningArticle} from '../lib/parentLearning';

// Render the supplied Markdown as React text, never as raw HTML.
function inline(text:string):ReactNode[]{
 return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part,index)=>
  part.startsWith('**')?<strong key={index}>{part.slice(2,-2)}</strong>:
  part.startsWith('*')?<em key={index}>{part.slice(1,-1)}</em>:part);
}

export function ParentLearningContent({article,articles,onRead}:{article:ParentLearningArticle;articles:ParentLearningArticle[];onRead:(id:string)=>void}){
 const blocks=article.contentMarkdown?.replace(/^# [^\n]+\n+/,'').split(/\n## Related reading\s*\n/)[0].trim().split(/\n\s*\n/);
 const related=(article.relatedSlugs||[]).map(slug=>articles.find(item=>item.id===slug)).filter((item):item is ParentLearningArticle=>!!item);
 return <div className="ppx-article-content"><p className="ppx-article-byline">STAR coaching guidance · Editorial contact: Dean Parkinson, Head Coach.</p>
  {blocks?blocks.map((block,index)=>{
   if(block.startsWith('### '))return <h4 key={index}>{inline(block.slice(4))}</h4>;
   if(block.startsWith('## '))return <h3 key={index}>{inline(block.slice(3))}</h3>;
   if(block.startsWith('> '))return <blockquote key={index}>{inline(block.replace(/^> ?/gm,''))}</blockquote>;
   if(block.startsWith('- '))return <ul key={index}>{block.split('\n').map((line,i)=><li key={i}>{inline(line.replace(/^- /,''))}</li>)}</ul>;
   return <p key={index}>{inline(block)}</p>;
  }):article.body.map((paragraph,index)=><p key={index}>{paragraph}</p>)}
  {article.sources?.length&&<section><h3>Further reading from primary sources</h3><p>These resources offer related guidance. STAR’s examples and suggested conversations are our own. For individual health concerns, ask a qualified healthcare professional.</p><ul>{article.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></li>)}</ul><p>Reference links checked {article.sourcesChecked}. Pathway providers confirm their current eligibility and availability directly.</p></section>}
  {article.prompt&&<div className="ppx-reading-prompt"><span className="ppx-eyebrow">SOMETHING TO ASK HER</span><h3>“{article.prompt}”</h3></div>}
  {!!related.length&&<nav aria-label="Related reading"><h3>Related reading</h3><ul>{related.map(item=><li key={item.id}><button className="ppx-text-btn" onClick={()=>onRead(item.id)}>{item.title} →</button></li>)}</ul></nav>}
 </div>;
}
