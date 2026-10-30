import type {NextConfig} from 'next';
const privatePaths=['/parent-portal/:path*','/player-portal/:path*','/staff/:path*','/onboarding/:path*','/api/:path*','/share/:path*'];
const config:NextConfig={async redirects(){return [{source:'/:path*',has:[{type:'host',value:'www.starfootball.uk'}],destination:'https://starfootball.uk/:path*',permanent:true}]},async headers(){const sources=process.env.VERCEL_ENV&&process.env.VERCEL_ENV!=='production'?['/:path*']:privatePaths;return sources.map(source=>({source,headers:[{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'}]}))}};
export default config;
