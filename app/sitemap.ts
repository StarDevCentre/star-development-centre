import type {MetadataRoute} from 'next';
import {shareEntries,siteOrigin} from '../lib/siteMetadata';
export default function sitemap():MetadataRoute.Sitemap{return shareEntries.map(p=>({url:siteOrigin+p.path}))}
