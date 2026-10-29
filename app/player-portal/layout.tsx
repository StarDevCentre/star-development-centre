import {privateRobots} from '../../lib/siteMetadata';
import type {Metadata,Viewport} from 'next';
export const metadata:Metadata={robots:privateRobots,manifest:'/player-space/manifest.webmanifest',appleWebApp:{capable:true,title:'STAR Player Space',statusBarStyle:'black-translucent'},icons:{apple:'/player-space/icons/icon-192.png'}};
export const viewport:Viewport={themeColor:'#06142e'};
export default function PlayerLayout({children}:{children:React.ReactNode}){return children;}

