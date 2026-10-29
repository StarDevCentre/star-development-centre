import {privateRobots} from '../../lib/siteMetadata';
import type {Metadata,Viewport} from "next";
export const metadata:Metadata={robots:privateRobots,manifest:"/parent-app/manifest.webmanifest",appleWebApp:{capable:true,title:"STAR Parents",statusBarStyle:"default"},icons:{apple:"/parent-app/icons/icon-192.png"}};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#071120"};
export default function ParentLayout({children}:{children:React.ReactNode}){return children;}


