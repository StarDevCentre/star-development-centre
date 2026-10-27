import type {Metadata,Viewport} from "next";
export const metadata:Metadata={manifest:"/parent-app/manifest.webmanifest",appleWebApp:{capable:true,title:"STAR Parents",statusBarStyle:"default"},icons:{apple:"/player-space/icons/icon-192.png"}};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#f4f6f9"};
export default function ParentLayout({children}:{children:React.ReactNode}){return children;}
