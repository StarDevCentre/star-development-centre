import {privateRobots} from '../../lib/siteMetadata';
import type {Metadata,Viewport} from "next";
export const metadata:Metadata={robots:privateRobots};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#f4f6f9"};
export default function StaffLayout({children}:{children:React.ReactNode}){return children;}

