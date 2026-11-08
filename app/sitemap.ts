import type {MetadataRoute} from 'next';
import {shareEntries,siteOrigin} from '../lib/siteMetadata';
import {getPublicEvents} from '../lib/starEvents';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const events=await getPublicEvents();
 return [
  ...shareEntries.filter(p=>p.path!=='/search').map(p=>({url:siteOrigin+p.path})),
  ...events.map(e=>({url:siteOrigin+'/events/'+e.slug,lastModified:new Date(e.starts_at)}))
 ];
}
