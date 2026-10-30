import '../portal-base.css';
import {privateRobots} from '../../lib/siteMetadata';
import type {Metadata,Viewport} from "next";
// Entry, sign-in and accounts without a linked player need these before the dashboard loads.
// Keep the base -> dashboard -> mobile override order independent of dynamic workspaces.
import './parent.css';
import '../../components/parent-dashboard.css';
import '../../components/parent-app.css';
export const metadata:Metadata={robots:privateRobots,manifest:"/parent-app/manifest.webmanifest",appleWebApp:{capable:true,title:"STAR Parents",statusBarStyle:"default"},icons:{apple:"/parent-app/icons/icon-192.png"}};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#071120"};
export default function ParentLayout({children}:{children:React.ReactNode}){return children;}


