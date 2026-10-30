import type {NextConfig} from 'next';
const privatePaths=['/parent-portal/:path*','/player-portal/:path*','/staff/:path*','/onboarding/:path*','/api/:path*','/share/:path*'];
const config:NextConfig={
  images:{
    formats:['image/avif','image/webp'],
    imageSizes:[16,32,48,64,96,128,160,192,256,320,384,480,576],
  },
  async redirects(){return [{source:'/:path*',has:[{type:'host',value:'www.starfootball.uk'}],destination:'https://starfootball.uk/:path*',permanent:true}]},
  async headers(){
    const sources=process.env.VERCEL_ENV&&process.env.VERCEL_ENV!=='production'?['/:path*']:privatePaths;
    return [
      {source:'/fonts/:path*',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]},
      ...sources.map(source=>({source,headers:[{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'}]})),
    ];
  },
};
export default config;
