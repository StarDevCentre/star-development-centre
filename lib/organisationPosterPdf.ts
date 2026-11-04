/** A single A4 page containing the rendered artwork. No external service or font dependency. */
export function organisationPosterPdf(jpeg:Uint8Array,width:number,height:number):Blob{
 const encoder=new TextEncoder(),chunks:Uint8Array[]=[],offsets=[0];let length=0;
 const add=(value:string|Uint8Array)=>{const bytes=typeof value==='string'?encoder.encode(value):value;chunks.push(bytes);length+=bytes.length};
 const object=(id:number,body:string)=>{offsets[id]=length;add(`${id} 0 obj\n${body}\nendobj\n`)};
 const pageWidth=210*72/25.4,pageHeight=297*72/25.4;
 add('%PDF-1.4\n');
 object(1,'<< /Type /Catalog /Pages 2 0 R >>');
 object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 object(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Artwork 4 0 R >> >> /Contents 5 0 R >>`);
 offsets[4]=length;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);add(jpeg);add('\nendstream\nendobj\n');
 const draw=`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Artwork Do\nQ\n`;
 object(5,`<< /Length ${encoder.encode(draw).length} >>\nstream\n${draw}endstream`);
 const xref=length;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
 add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
 const bytes=new Uint8Array(length);let cursor=0;for(const chunk of chunks){bytes.set(chunk,cursor);cursor+=chunk.length}
 return new Blob([bytes],{type:'application/pdf'});
}
