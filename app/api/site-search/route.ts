import {searchSite} from '../../../lib/siteSearch';
export function GET(request:Request){
  const q=new URL(request.url).searchParams.get('q');
  return Response.json(searchSite(q,'',6),{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
}
