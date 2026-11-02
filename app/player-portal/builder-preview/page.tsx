import type {Metadata} from 'next';
import {BuilderArtworkPreview} from '../../../components/BuilderArtworkPreview';
import {privateRobots} from '../../../lib/siteMetadata';
export const metadata:Metadata={title:'Build My Player · Artwork Preview | STAR',robots:privateRobots};
export default function BuilderPreviewPage(){return <BuilderArtworkPreview/>;}
