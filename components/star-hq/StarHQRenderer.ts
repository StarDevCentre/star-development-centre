"use client";
/** Actual WebGL2 3D renderer. Geometric prototype rigs; high-detail rigged GLB assets are a later quality pass. */
import { daylight, type DemoNPC } from "../../lib/starHQ/demoWorld";
export type HQPlayer = { x:number; z:number; heading:number; moving:boolean; steps:number };
export type HQFrame = { player:HQPlayer; yaw:number; npcs:DemoNPC[]; date:Date };
type Vec3=[number,number,number];
type Shape={buffer:WebGLBuffer; count:number};
const PI=Math.PI;
const ident=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function matmul(a:number[],b:number[]):number[]{const out=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
function trans(x:number,y:number,z:number){const m=ident();m[12]=x;m[13]=y;m[14]=z;return m;}
function scale(x:number,y:number,z:number){return [x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1];}
function rotateY(a:number){const c=Math.cos(a),s=Math.sin(a);return [c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1];}
function rotateX(a:number){const c=Math.cos(a),s=Math.sin(a);return [1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1];}
function perspective(fov:number,aspect:number,near:number,far:number){const f=1/Math.tan(fov/2),q=1/(near-far);return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*q,-1,0,0,2*far*near*q,0];}
function norm(v:Vec3):Vec3{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];}
function cross(a:Vec3,b:Vec3):Vec3{return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function lookAt(eye:Vec3,target:Vec3){
 const z=norm([eye[0]-target[0],eye[1]-target[1],eye[2]-target[2]]);
 const x=norm(cross([0,1,0],z)),y=cross(z,x);
 return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,
  -x[0]*eye[0]-x[1]*eye[1]-x[2]*eye[2],-y[0]*eye[0]-y[1]*eye[1]-y[2]*eye[2],
  -z[0]*eye[0]-z[1]*eye[1]-z[2]*eye[2],1];
}
function rgb(hex:string):Vec3{const n=Number.parseInt(hex.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
function boxData(){
 const out:number[]=[];
 const faces:Array<[Vec3,Vec3,Vec3,Vec3,Vec3]>=[
 [[0,0,1],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]],
 [[0,0,-1],[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]],
 [[1,0,0],[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]],
 [[-1,0,0],[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]],
 [[0,1,0],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]],
 [[0,-1,0],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]
 ];
 for(const [n,a,b,c,d] of faces){const verts=[a,b,c,a,c,d],uv=[[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]];verts.forEach((v,i)=>out.push(...v,...n,...uv[i]));}return out;
}
function sphereData(){
 const out:number[]=[];const seg=16,stacks=10;
 function emit(t:number,p:number){const n:Vec3=[Math.sin(t)*Math.cos(p),Math.cos(t),Math.sin(t)*Math.sin(p)];out.push(...n,...n,p/(2*PI),1-t/PI);}
 for(let i=0;i<stacks;i++)for(let j=0;j<seg;j++){const a=i*PI/stacks,b=(i+1)*PI/stacks,c=j*2*PI/seg,d=(j+1)*2*PI/seg;emit(a,c);emit(b,c);emit(b,d);emit(a,c);emit(b,d);emit(a,d);}return out;
}
function cylinderData(){
 const out:number[]=[];const seg=14;
 function add(x:number,y:number,z:number,nx:number,ny:number,nz:number,u:number,v:number){out.push(x,y,z,nx,ny,nz,u,v);}
 for(let i=0;i<seg;i++){const a=i*2*PI/seg,b=(i+1)*2*PI/seg,x=Math.cos(a),z=Math.sin(a),xx=Math.cos(b),zz=Math.sin(b);
 add(x*.5,-.5,z*.5,x,0,z,0,0);add(xx*.5,-.5,zz*.5,xx,0,zz,1,0);add(xx*.5,.5,zz*.5,xx,0,zz,1,1);
 add(x*.5,-.5,z*.5,x,0,z,0,0);add(xx*.5,.5,zz*.5,xx,0,zz,1,1);add(x*.5,.5,z*.5,x,0,z,0,1);
 add(0,.5,0,0,1,0,.5,.5);add(x*.5,.5,z*.5,0,1,0,0,0);add(xx*.5,.5,zz*.5,0,1,0,1,0);
 }return out;
}
const vs=[
 "#version 300 es",
 "in vec3 aPosition;in vec3 aNormal;in vec2 aUV;",
 "uniform mat4 uProjection,uView,uModel;",
 "out vec3 vNormal;out vec3 vWorld;out vec2 vUV;",
 "void main(){vec4 p=uModel*vec4(aPosition,1.0);vWorld=p.xyz;vNormal=mat3(uModel)*aNormal;vUV=aUV;gl_Position=uProjection*uView*p;}"
].join("\n");
const fs=[
 "#version 300 es","precision mediump float;",
 "uniform vec3 uColor,uSky,uCamera;uniform float uLight,uGlow;",
 "uniform sampler2D uImage;uniform bool uTextured;",
 "in vec3 vNormal;in vec3 vWorld;in vec2 vUV;out vec4 color;",
 "void main(){vec4 tex=uTextured?texture(uImage,vUV):vec4(1.0);if(tex.a<.1)discard;",
 "float sun=max(dot(normalize(vNormal),normalize(vec3(-.4,.78,.45))),0.0);",
 "vec3 illum=vec3(.42+.43*uLight,.37+.39*uLight,.32+.35*uLight)+sun*vec3(.32,.30,.26);",
 "vec3 lit=uColor*tex.rgb*(illum+uGlow);float fog=clamp((distance(uCamera,vWorld)-22.0)/55.0,0.,.65);",
 "color=vec4(mix(lit,uSky,fog),tex.a);}"
].join("\n");

export class StarHQRenderer {
 private gl:WebGL2RenderingContext;
 private program:WebGLProgram;
 private shapes:Record<string,Shape>={};
 private images:Record<string,WebGLTexture>={};
 private unis:Record<string,WebGLUniformLocation|null>={};
 private attribs:{p:number;n:number;uv:number};
 private stopped=false;
 constructor(private canvas:HTMLCanvasElement){
  const gl=canvas.getContext("webgl2",{antialias:true,alpha:false,powerPreference:"high-performance"});
  if(!gl)throw new Error("WebGL2 is unavailable on this device. Please use a modern browser with graphics enabled.");
  this.gl=gl;
  const shader=(kind:number,source:string)=>{const sh=gl.createShader(kind);if(!sh)throw Error("Cannot allocate shader");gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error("3D shader: "+gl.getShaderInfoLog(sh));return sh;};
  const program=gl.createProgram();if(!program)throw Error("Cannot initialise 3D renderer");
  gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error("3D program: "+gl.getProgramInfoLog(program));
  this.program=program;gl.useProgram(program);
  for(const name of ["uProjection","uView","uModel","uColor","uSky","uCamera","uLight","uGlow","uTextured","uImage"])this.unis[name]=gl.getUniformLocation(program,name);
  this.attribs={p:gl.getAttribLocation(program,"aPosition"),n:gl.getAttribLocation(program,"aNormal"),uv:gl.getAttribLocation(program,"aUV")};
  for(const [name,verts] of Object.entries({box:boxData(),sphere:sphereData(),cylinder:cylinderData()})){
   const buffer=gl.createBuffer();if(!buffer)throw Error("Cannot allocate geometry");
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
   this.shapes[name]={buffer,count:verts.length/8};
  }
  this.image("/images/star-colour-transparent.webp","star");
  this.sign("welcome","WELCOME TO STAR HQ","BELIEVE. DEVELOP. ACHIEVE.");
  this.sign("women","WOMEN'S FOOTBALL","YOUR FUTURE STARTS HERE");
  this.sign("inspire","BELIEVE IN YOUR GAME","SMALL STEPS. BIG DREAMS.");
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
 }
 private addTexture(name:string,source:TexImageSource){
  const gl=this.gl,texture=gl.createTexture();if(!texture)return;
  gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);this.images[name]=texture;
 }
 private image(path:string,name:string){const img=new Image();img.onload=()=>{if(!this.stopped)this.addTexture(name,img);};img.src=path;}
 private sign(key:string,line:string,sub:string){
  const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=256;
  const c=canvas.getContext("2d");if(!c)return;
  c.fillStyle="#10213c";c.fillRect(0,0,1024,256);c.strokeStyle="#c8a763";c.lineWidth=8;c.strokeRect(8,8,1008,240);
  c.font="bold 55px sans-serif";c.textAlign="center";c.fillStyle="#f8edce";c.fillText(line,512,115);
  c.font="bold 29px sans-serif";c.fillStyle="#ffffff";c.fillText(sub,512,183);
  this.addTexture(key,canvas);
 }
 private mesh(kind:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,yaw=0,tilt=0,texture?:string,glow=0){
  const gl=this.gl,s=this.shapes[kind];if(!s)return;
  gl.bindBuffer(gl.ARRAY_BUFFER,s.buffer);
  for(const [loc,size,offset] of [[this.attribs.p,3,0],[this.attribs.n,3,12],[this.attribs.uv,2,24]]){
   gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,32,offset);
  }
  const model=matmul(matmul(matmul(trans(x,y,z),rotateY(yaw)),rotateX(tilt)),scale(sx,sy,sz));
  gl.uniformMatrix4fv(this.unis.uModel,false,new Float32Array(model));
  gl.uniform3fv(this.unis.uColor,rgb(color));gl.uniform1f(this.unis.uGlow,glow);
  const tex=texture?this.images[texture]:undefined;
  gl.uniform1i(this.unis.uTextured,tex?1:0);
  if(tex){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(this.unis.uImage,0);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}
  gl.drawArrays(gl.TRIANGLES,0,s.count);
  if(tex){gl.depthMask(true);gl.disable(gl.BLEND);}
 }
 private box(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,yaw=0,texture?:string,glow=0){this.mesh("box",x,y,z,sx,sy,sz,color,yaw,0,texture,glow);}
 private sphere(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string){this.mesh("sphere",x,y,z,sx,sy,sz,color);}
 private cyl(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string){this.mesh("cylinder",x,y,z,sx,sy,sz,color);}
 private environment(light:number){
  this.box(0,-.13,0,18.3,.24,12.3,"#bcb8b0");
  for(let z=-5.5;z<6;z+=1.35)this.box(0,.006,z,17.9,.008,.017,"#99968e");
  for(let x=-8.5;x<9;x+=1.6)this.box(x,.008,0,.015,.008,12,"#a8a49b");
  this.box(0,4.2,0,18.3,.20,12.3,"#ddd9d2");
  this.box(0,2.08,-6.04,18.3,4.15,.18,"#93816b");
  for(let x=-8.65;x<=8.65;x+=.38)this.box(x,2.1,-5.90,.06,3.90,.10,"#765b44");
  this.box(-9.02,2.07,0,.20,4.15,12.2,"#d2cec5");
  this.box(9.03,.49,0,.16,.98,12.2,"#c6c4bc");
  this.box(9.03,3.80,0,.16,.80,12.2,"#c6c4bc");
  for(let z=-5.9;z<6;z+=2.35)this.box(9.02,2.1,z,.10,3.13,.09,"#4e6373");
  this.box(9.06,1.06,0,.06,.07,12,"#566c79");this.box(9.06,3.29,0,.06,.07,12,"#566c79");
  this.box(-5.34,2.08,6.06,7.3,4.15,.15,"#c9c7c1");
  this.box(5.34,2.08,6.06,7.3,4.15,.15,"#c9c7c1");
  for(const x of [-1.73,0,1.73])this.box(x,2.08,6.05,.07,4.05,.12,"#576c7b");
  this.box(0,4,6.05,3.5,.28,.1,"#576c7b");
  // Reception and backlit STAR identity wall.
  this.box(0,.69,-4.18,5.20,1.36,1.38,"#604b3d");
  this.box(0,1.38,-4.18,5.4,.13,1.54,"#e0d3c0");
  this.box(0,.72,-3.47,4.35,.15,.07,"#bd9b5f",0,undefined,.42);
  this.box(0,2.72,-5.75,3.80,2.12,.08,"#192d4d");
  this.box(0,2.71,-5.65,2.6,1.58,.02,"#ffffff",0,"star",.9);
  this.box(0,3.90,-5.68,3.92,.06,.15,"#e9ce92",0,undefined,.85);
  this.box(.9,1.55,-4.54,.70,.82,.08,"#1e2e3e");
  this.box(-1.40,1.49,-4.33,.43,.08,.36,"#c5c1b6");
  // Comfortable lounge.
  this.box(-6.55,.36,-1.66,2.96,.64,1.0,"#637a91");
  this.box(-6.55,.67,-2.11,3.02,.72,.32,"#4d657c");
  this.box(-8.05,.66,-1.66,.23,.62,1,"#4d657c");
  this.box(-5.08,.66,-1.66,.23,.62,1,"#4d657c");
  for(const x of [-7.2,-6.52,-5.85])this.box(x,.73,-1.56,.54,.23,.58,"#8499ab");
  this.box(-6.7,.36,-.04,1.68,.14,.8,"#b59665");
  for(const x of [-7.34,-6.05])this.cyl(x,.2,-.04,.10,.37,.10,"#484d51");
  for(const [x,z] of [[-8.18,-4.46],[6.42,4.70],[5.72,-4.52]]){
   this.cyl(x,.33,z,.68,.68,.68,"#c9c3b8");this.cyl(x,.94,z,.09,.75,.09,"#4e5741");
   for(let i=0;i<5;i++){const a=i*2*PI/5;this.sphere(x+Math.sin(a)*.27,1.32,z+Math.cos(a)*.25,.22,.53,.24,"#386f53");}
  }
  // Working digital screens with original non-broadcast inspirational content.
  this.box(-6.1,2.78,-5.73,2.80,1.08,.07,"#ffffff",0,"women",.24);
  this.box(5.6,2.80,-5.73,2.80,1.08,.07,"#ffffff",0,"inspire",.22);
  // Closed future facility doors are solid actual 3D objects.
  for(const d of [{side:-1,z:.55},{side:1,z:-2.65},{side:1,z:2.1}]){
   this.box(d.side*8.91,1.24,d.z,.16,2.45,1.74,"#24364c");
   this.box(d.side*8.82,2.54,d.z,.09,.12,1.8,"#d4b370",0,undefined,.18);
   this.sphere(d.side*8.78,1.12,d.z+.53,.07,.07,.07,"#dfbe7e");
  }
  for(const z of [-4.3,-1.45,1.4,4.4]){
   this.box(0,4.03,z,17.7,.14,.13,"#b7ac9b");
   for(const x of [-6.3,0,6.3])this.box(x,3.95,z,2.35,.06,.14,"#fff1cc",0,undefined,.80);
  }
  this.box(0,.015,2,3.3,.01,2.55,"#344b6b");
  // Football pitches and academy campus through the glass.
  this.box(19,-.25,0,20,.07,30,"#326643");
  for(let z=-10;z<=10;z+=5)this.box(17,-.19,z,9,.04,.07,"#f4f6ef");
  this.box(17,-.19,0,.08,.04,20,"#f4f6ef");
  for(const z of [-9,9]){
   this.box(16,1.0,z,.09,2,.1,"#f3f5f3");this.box(20,1.0,z,.09,2,.1,"#f3f5f3");
   this.box(18,2.02,z,4.05,.1,.1,"#f3f5f3");
  }
  this.box(29,2.0,-5.8,7,4,12,"#526a7d");this.box(29,4.06,-5.8,8,.25,13,"#3b4e62");
  for(const [x,z] of [[12,-11],[22,10]]){
   this.cyl(x,3.9,z,.15,7.8,.15,"#788892");
   this.box(x,7.85,z,1.03,.21,.36,"#fff4d6",0,undefined,light<.3?1.2:.1);
  }
  this.box(0,-.09,10,3.8,.1,8,"#aaa79f");this.box(-6,-.17,11,9,.08,10,"#356b45");
 }
 private human(x:number,z:number,heading:number,kind:string,phase:number,walking:boolean){
  const isPlayer=kind==="player",mia=kind==="receptionist";
  const skin=mia||isPlayer?"#d4a17b":kind==="coach"?"#bd8a6a":kind==="parent"?"#996a55":"#bd876c";
  const hair=isPlayer?"#e7c06d":mia?"#5b392e":kind==="parent"?"#393238":"#4a3026";
  const top=mia?"#143450":isPlayer?"#152f56":kind==="coach"?"#1d3b62":kind==="parent"?"#8e6476":kind==="admin"?"#6b8390":"#315077";
  const pants=mia?"#2a3036":kind==="parent"?"#4a4442":"#141922";
  const animation=walking?Math.sin(phase*7)*.36:0,breath=Math.sin(phase*1.8)*.01;
  const local=(a:number,b:number,c:number):Vec3=>[x+a*Math.cos(heading)+c*Math.sin(heading),b+breath,z-a*Math.sin(heading)+c*Math.cos(heading)];
  const part=(kindMesh:string,a:number,b:number,c:number,sx:number,sy:number,sz:number,color:string,tilt=0,tex?:string)=>{
   const p=local(a,b,c);this.mesh(kindMesh,p[0],p[1],p[2],sx,sy,sz,color,heading,tilt,tex);
  };
  this.mesh("sphere",x,.034,z,.24,.022,.18,"#253341");
  part("sphere",0,1.18,0,.32,.37,.18,top);
  part("sphere",0,.93,0,.27,.17,.18,pants);
  for(const side of [-1,1]){
   part("cylinder",side*.13,.49,0,.18,.78,.18,pants,animation*side);
   part("sphere",side*.13,.11,.105,.16,.10,.27,"#151a21");
   part("cylinder",side*.38,1.07,0,.16,.63,.15,top,animation*side*.55);
   part("sphere",side*.38,.72,.01,.09,.11,.09,skin);
  }
  part("cylinder",0,1.51,0,.13,.15,.13,skin);
  part("sphere",0,1.79,0,.234,.273,.22,skin);
  part("sphere",0,2.00,-.055,.24,.105,.208,hair);
  part("sphere",-.17,1.94,-.04,.087,.17,.16,hair);
  part("sphere",.17,1.94,-.04,.087,.17,.16,hair);
  if(isPlayer||mia){
   part("sphere",0,1.94,-.255,.12,.12,.13,hair);
   part("sphere",0,1.82,-.30,.10,.15,.11,hair);
  }
  part("sphere",-.090,1.82,.205,.028,.028,.018,"#242525");
  part("sphere",.090,1.82,.205,.028,.028,.018,"#242525");
  part("sphere",0,1.70,.232,.067,.016,.015,"#b86d68");
  if(mia||isPlayer)part("box",0,1.28,.185,.20,.115,.008,"#ffffff",0,"star");
 }
 render(frame:HQFrame){
  if(this.stopped)return;
  const gl=this.gl,rect=this.canvas.getBoundingClientRect();
  if(rect.width<1||rect.height<1)return;
  const dpr=Math.min(window.devicePixelRatio||1,1.6);
  const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  gl.viewport(0,0,w,h);gl.useProgram(this.program);
  const light=daylight(frame.date).light;
  const sky:Vec3=[.055+.16*light,.082+.24*light,.14+.33*light];
  gl.clearColor(...sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const {player,yaw}=frame;
  let back=3.2;
  const sin=Math.sin(yaw),cos=Math.cos(yaw),dx=-sin,dz=-cos;
  if(dx>0)back=Math.min(back,(8.7-player.x)/Math.max(.01,dx));
  if(dx<0)back=Math.min(back,(player.x+8.7)/Math.max(.01,-dx));
  if(dz>0)back=Math.min(back,(5.6-player.z)/Math.max(.01,dz));
  if(dz<0)back=Math.min(back,(player.z+5.6)/Math.max(.01,-dz));
  back=Math.max(.75,Math.min(3.2,back));
  const eye:Vec3=[player.x+dx*back,2.75,player.z+dz*back];
  gl.uniformMatrix4fv(this.unis.uProjection,false,new Float32Array(perspective(58*PI/180,w/h,.06,90)));
  gl.uniformMatrix4fv(this.unis.uView,false,new Float32Array(lookAt(eye,[player.x,1.30,player.z])));
  gl.uniform3fv(this.unis.uCamera,eye);gl.uniform3fv(this.unis.uSky,sky);gl.uniform1f(this.unis.uLight,light);
  this.environment(light);
  for(const npc of frame.npcs)this.human(npc.x,npc.z,npc.heading,npc.kind,npc.cycle,npc.walking);
  this.human(player.x,player.z,player.heading,"player",player.steps,player.moving);
 }
 dispose(){
  this.stopped=true;
  for(const v of Object.values(this.shapes))this.gl.deleteBuffer(v.buffer);
  for(const v of Object.values(this.images))this.gl.deleteTexture(v);
  this.gl.deleteProgram(this.program);
 }
}
