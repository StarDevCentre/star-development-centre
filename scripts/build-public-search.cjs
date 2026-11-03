// Only approved public sources. Do not replace this list with a route or directory scan.
const fs=require('node:fs');
const ts=require('typescript');
const pages={
 '/partnerships':['app/partnerships/page.tsx'],
 '/first-session':['app/first-session/page.tsx'],
 '/':['app/page.tsx','components/HomeExperience.tsx'],
 '/our-approach':['app/our-approach/page.tsx','components/ApproachExample.tsx'],
 '/inclusion':['app/inclusion/page.tsx'],
 '/coaches':['app/coaches/page.tsx'],
 '/pathways':['app/pathways/page.tsx','components/PathwayExplorer.tsx'],
 '/contact':['app/contact/page.tsx'],
 '/register':['app/register/page.tsx'],
 '/privacy':['app/privacy/page.tsx'],
 '/find-your-programme':['app/find-your-programme/page.tsx']
};
function extract(file){
 const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),parts=[];
 function visit(node){
  if(ts.isImportDeclaration(node)||ts.isJsxAttribute(node))return;
  if(ts.isJsxText(node)||ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)){
   const text=node.text.replace(/&amp;/g,'&').replace(/&quot;/g,'\"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
   if(text.length>10&&/\s/.test(text)&&!/^(?:[/.#]|https?:)/.test(text))parts.push(text);
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);return [...new Set(parts)].join(' ');
}
const output=Object.fromEntries(Object.entries(pages).map(([url,files])=>[url,files.map(extract).join(' ')]));
if(/[£]|\bGBP\b|service_role|portal_player_id/.test(JSON.stringify(output)))throw new Error('Review public search content: restricted pricing or private implementation text found');
fs.writeFileSync('lib/content/site-page-text.json',JSON.stringify(output,null,2)+'\n');
console.log('Prepared public search text for '+Object.keys(output).length+' approved pages.');
