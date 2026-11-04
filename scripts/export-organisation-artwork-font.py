# Copyright 2017 The Barlow Project Authors. Source font: public/fonts/barlow-condensed-OFL.txt
# Requires fonttools and brotli; run from the repository root.
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
import json, sys
f=TTFont(sys.argv[1] if len(sys.argv)>1 else 'public/fonts/barlow-condensed-900-latin.woff2'); gs=f.getGlyphSet(); cmap=f.getBestCmap(); out={}
for c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .&–':
 n=cmap[ord(c)]; p=SVGPathPen(gs); gs[n].draw(p); out[c]={'d':p.getCommands(),'w':f['hmtx'][n][0]}
open('lib/organisationArtworkFont.json','w').write(json.dumps({'units':f['head'].unitsPerEm,'glyphs':out},separators=(',',':'))+'\n')
