import type {MetadataRoute} from 'next';
import {isPreview,siteOrigin} from '../lib/siteMetadata';
export default function robots():MetadataRoute.Robots{return isPreview?{rules:{userAgent:'*',disallow:'/'}}:{rules:{userAgent:'*',allow:'/',disallow:'/api/'},sitemap:siteOrigin+'/sitemap.xml'}}
