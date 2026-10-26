(function () {
  'use strict';
  const engine=new SmartCityEngine.CityEngine();
  const canvas=document.getElementById('city');
  const gl=canvas.getContext('webgl',{antialias:true,alpha:false});
  if(!gl){canvas.insertAdjacentHTML('afterend','<p class="error" role="alert">Grafica 3D non disponibile. Apri la demo con un browser con WebGL attivo.</p>');return;}
  const vertex=[
    'attribute vec3 aPosition; attribute vec3 aNormal;',
    'uniform mat4 uVP; uniform mat4 uModel; uniform vec3 uScale;',
    'varying vec3 vNormal; varying vec3 vWorld;',
    'void main(){vec4 world=uModel*vec4(aPosition*uScale,1.0);vWorld=world.xyz;vNormal=normalize(mat3(uModel)*(aNormal/uScale));gl_Position=uVP*world;}'
  ].join('\n');
  const fragment=[
    'precision mediump float;',
    'uniform vec3 uColor; uniform float uGlow; uniform float uDay; uniform float uAlpha;',
    'uniform vec3 uCamera; uniform vec3 uFog;',
    'varying vec3 vNormal; varying vec3 vWorld;',
    'void main(){vec3 n=normalize(vNormal);float sun=max(dot(n,normalize(vec3(-0.55,0.85,0.3))),0.0);vec3 col=uColor*(0.37+uDay*0.39+sun*(0.15+uDay*0.38));col=mix(col,uColor*1.65,uGlow);float fog=clamp((distance(uCamera,vWorld)-35.0)/110.0,0.0,0.23);gl_FragColor=vec4(mix(col,uFog,fog),uAlpha);}'
  ].join('\n');
  function compile(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  const program=gl.createProgram();
  try{
    gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  }catch(error){canvas.insertAdjacentHTML('afterend','<p class="error" role="alert">Il browser non riesce ad avviare la scena 3D.</p>');console.error(error);return;}
  gl.useProgram(program);gl.enable(gl.DEPTH_TEST);
  const U={};['VP','Model','Scale','Color','Glow','Day','Alpha','Camera','Fog'].forEach(n=>U[n]=gl.getUniformLocation(program,'u'+n));
  const A={position:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal')};
  function mesh(positions,normals){
    const p=gl.createBuffer(),n=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);
    return{p,n,count:positions.length/3};
  }
  function cube(){
    const p=[],n=[];
    const faces=[[[0,0,1],[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]],[[0,0,-1],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]],[[1,0,0],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]]],[[-1,0,0],[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]]],[[0,1,0],[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]],[[0,-1,0],[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]]];
    for(const[f,q]of faces)for(const i of[0,1,2,0,2,3]){p.push(...q[i].map(x=>x*.5));n.push(...f);}return mesh(p,n);
  }
  function sphere(){
    const p=[],n=[],steps=10,rings=8;
    function point(t,f){const normal=[Math.sin(t)*Math.cos(f),Math.cos(t),Math.sin(t)*Math.sin(f)];return{p:normal.map(x=>x*.5),n:normal};}
    for(let y=0;y<rings;y++)for(let x=0;x<steps;x++){
      const q=[point(y/rings*Math.PI,x/steps*Math.PI*2),point((y+1)/rings*Math.PI,(x+1)/steps*Math.PI*2),point((y+1)/rings*Math.PI,x/steps*Math.PI*2),point(y/rings*Math.PI,(x+1)/steps*Math.PI*2)];
      for(const i of[0,1,2,0,3,1]){p.push(...q[i].p);n.push(...q[i].n);}
    }return mesh(p,n);
  }
  function cylinder(){
    const p=[],n=[],sides=16;
    function append(pt,norm){p.push(...pt);n.push(...norm);}
    for(let i=0;i<sides;i++){
      const a=i/sides*Math.PI*2,b=(i+1)/sides*Math.PI*2;
      const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
      const q=[[ca*.5,-.5,sa*.5],[cb*.5,-.5,sb*.5],[cb*.5,.5,sb*.5],[ca*.5,.5,sa*.5]];
      for(const k of[0,1,2,0,2,3])append(q[k],k===0||k===3?[ca,0,sa]:[cb,0,sb]);
      append([0,.5,0],[0,1,0]);append(q[3],[0,1,0]);append(q[2],[0,1,0]);
      append([0,-.5,0],[0,-1,0]);append(q[1],[0,-1,0]);append(q[0],[0,-1,0]);
    }return mesh(p,n);
  }
  const meshes={box:cube(),sphere:sphere(),cylinder:cylinder()};
  const C={base:[.075,.17,.23],ground:[.20,.31,.33],road:[.10,.15,.19],walk:[.40,.52,.54],white:[.82,.90,.90],glass:[.18,.48,.58],glass2:[.13,.31,.44],trim:[.10,.25,.32],cyan:[.20,.94,.84],violet:[.61,.55,.94],green:[.15,.60,.39],leaf:[.16,.48,.32],leafLight:[.26,.69,.45],water:[.16,.70,.92],soil:[.54,.42,.24],dark:[.035,.065,.08],warm:[1,.78,.40],silver:[.55,.72,.73],solar:[.10,.30,.58]};
  let bound=null;
  const model=new Float32Array(16);
  function draw(type,x,y,z,w,h,d,color,glow=0,yaw=0,alpha=1){
    const m=meshes[type];
    if(bound!==m){gl.bindBuffer(gl.ARRAY_BUFFER,m.p);gl.enableVertexAttribArray(A.position);gl.vertexAttribPointer(A.position,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,m.n);gl.enableVertexAttribArray(A.normal);gl.vertexAttribPointer(A.normal,3,gl.FLOAT,false,0,0);bound=m;}
    const c=Math.cos(yaw),s=Math.sin(yaw);
    model.set([c,0,-s,0,0,1,0,0,s,0,c,0,x,y,z,1]);
    gl.uniformMatrix4fv(U.Model,false,model);gl.uniform3f(U.Scale,w,h,d);gl.uniform3f(U.Color,...color);gl.uniform1f(U.Glow,glow);gl.uniform1f(U.Alpha,alpha);gl.drawArrays(gl.TRIANGLES,0,m.count);
  }
  const staticObjects=[],lamps=[],windows=[],turbines=[],sprinklers=[[-9.2,-8],[-5.2,-8],[-9.2,-4.3],[-5.2,-4.3]];
  function add(type,x,y,z,w,h,d,color,glow=0,yaw=0){staticObjects.push({type,x,y,z,w,h,d,color:C[color]||color,glow,yaw});}
  const box=(...args)=>add('box',...args);
  box(0,-.58,0,33,.75,27,'base');box(0,-.15,0,32,.18,26,'ground');
  box(0,-.09,0,3.5,.18,26,'road');box(0,-.085,0,32,.18,3.5,'road');
  for(const x of[-1.9,1.9])box(x,.03,0,.055,.05,25.2,'cyan',.55);
  for(const z of[-1.9,1.9])box(0,.03,z,31.2,.05,.055,'cyan',.55);
  for(let i=-14;i<=14;i+=1.6)if(Math.abs(i)>3.2)box(i,.018,0,.72,.026,.07,'white');
  for(let i=-11;i<=11;i+=1.6)if(Math.abs(i)>3.2)box(0,.019,i,.07,.026,.72,'white');
  for(const lane of engine.lanes){
    const q=SmartCityEngine.STOP_LINE;
    if(lane.axis==='x')box(q*lane.dir,.025,lane.dir*.78,.12,.035,1.35,'white');
    else box(-lane.dir*.78,.025,q*lane.dir,1.35,.035,.12,'white');
  }
  // Distinct parcels keep pavements and buildings clear of the two roads.
  for(const x of[-8.5,8.5])for(const z of[-7,7])box(x,.015,z,11.5,.12,8.8,'walk');
  box(-8.2,.105,-6.8,10.5,.11,7.5,'green');
  box(-8.2,.19,-6.8,.7,.08,7.1,'walk');box(-8.2,.19,-6.8,10.1,.08,.62,'walk');
  add('cylinder',-11,.18,-5.0,2.1,.12,1.8,'water',.15);
  box(-4.8,.2,-9.2,2.7,.17,1.0,'soil');
  for(let i=0;i<7;i++)box(-5.9+i*.34,.38,-9.2,.15,.23,.64,'leafLight');
  function building(x,z,w,d,h,color,solar=false){
    box(x,.18+h/2,z,w,h,d,color);box(x,.23+h,z,w+.12,.15,d+.12,'trim');
    box(x,.34+h,z,w*.84,.05,d*.84,'cyan',.65);
    box(x-w/2+.06,.3+h/2,z,.075,h,.08,'cyan',.45);
    for(let row=0;row<Math.floor(h/.65);row++)for(let col=0;col<Math.max(2,Math.floor(w/.55));col++){
      windows.push({x:x-w*.36+col*.54,y:.7+row*.65,z:z+d/2+.025,w:.29,h:.28,d:.035,seed:row+col});
    }
    if(solar){
      const y=.48+h;
      box(x,y,z,w*.72,.08,d*.72,'solar');
      for(let k=-1;k<=1;k++)box(x+k*w*.20,y+.045,z,.026,.015,d*.70,'silver');
    }
  }
  building(-11,6,2.7,2.7,4.3,'white',true);building(-7.1,8.5,3.2,2.7,5.7,'glass',true);building(-4.1,4.8,2.1,2.5,2.8,'white');
  building(5.0,-9.1,2.7,2.3,4.5,'glass',true);building(9.0,-9.1,3.0,2.6,6.1,'white',true);building(12.8,-9.1,2.2,2.2,3.1,'glass2');
  building(9.2,7.7,4.0,3.7,3.4,'glass2',true);building(13.2,5.5,1.9,2.0,5.2,'white');
  add('sphere',9.2,4.0,7.7,2.4,1.25,2.4,'glass',.15);
  add('cylinder',9.2,4.5,7.7,2.2,.06,2.2,'cyan',.8);
  box(9.2,5.0,7.7,.075,1.0,.075,'silver');add('sphere',9.2,5.55,7.7,.21,.21,.21,'cyan',1);
  // Solar canopy and two vertical-axis wind turbines.
  for(const x of[4.3,7.0])box(x,1.0,-4.8,.12,2,.12,'silver');
  box(5.65,2.05,-4.8,4.1,.14,2.3,'solar');for(let j=0;j<7;j++)box(4.0+j*.55,2.13,-4.8,.025,.025,2.2,'cyan',.3);
  for(const[x,z]of[[11,-4.8],[13.9,-4.8]]){add('cylinder',x,1.3,z,.15,2.6,.15,'silver');turbines.push([x,z]);}
  // Charging bays.
  for(const x of[5.0,6.8,8.6]){box(x,.15,4.3,1.5,.05,2.6,'trim');box(x,.2,4.3,1.2,.02,2.2,'cyan',.35);box(x,1.0,5.9,.32,1.6,.32,'white');box(x,1.2,5.70,.19,.4,.035,'cyan',.8);}
  function tree(x,z,s=1){
    add('cylinder',x,.8*s,z,.18*s,1.35*s,.18*s,'soil');
    add('sphere',x,1.6*s,z,1.3*s,1.6*s,1.3*s,'leaf');
    add('sphere',x+.24*s,2.1*s,z,1.0*s,1.1*s,1.0*s,'leafLight');
  }
  for(const p of[[-12,-9.4],[-12,-7.5],[-12,-3.6],[-8,-10],[-4,-4],[-4,-7],[-11,10],[-4,10],[4,-12],[13,10]])tree(...p,.85);
  for(const x of[-13,-8,-3,3,8,13])lamps.push([x,2.15]);
  for(const z of[-10,-5,5,10])lamps.push([2.15,z]);
  for(const[x,z]of lamps){add('cylinder',x,1.3,z,.11,2.6,.11,'silver');box(x,2.6,z,.65,.13,.28,'trim');}
  for(const[x,z]of sprinklers){add('cylinder',x,.30,z,.22,.28,.22,'dark');add('sphere',x,.48,z,.19,.13,.19,'silver');}
  // Visible reservoir: a water column surrounded by a structural frame.
  const tankPos=[-13.7,-10.8];
  add('cylinder',tankPos[0],.12,tankPos[1],1.65,.24,1.65,'trim');
  add('cylinder',tankPos[0],2.3,tankPos[1],1.65,.16,1.65,'silver');
  for(const a of[0,Math.PI/2,Math.PI,Math.PI*1.5])box(tankPos[0]+Math.cos(a)*.72,1.25,tankPos[1]+Math.sin(a)*.72,.08,2.15,.08,'silver');
  // Small data traces visually connect the utility areas.
  box(-6,.21,-11.5,15,.035,.055,'cyan',.6);box(11.5,.21,-.7,.055,.035,13,'cyan',.6);
  const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
  function lookAt(eye,target){const z=norm(eye.map((x,i)=>x-target[i])),x=norm([z[2],0,-z[0]]),y=[z[1]*x[2],z[2]*x[0]-z[0]*x[2],-z[1]*x[0]];return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x.reduce((a,v,i)=>a+v*eye[i],0),-y.reduce((a,v,i)=>a+v*eye[i],0),-z.reduce((a,v,i)=>a+v*eye[i],0),1]);}
  function perspective(fov,aspect){const f=1/Math.tan(fov/2),near=.1,far=180,nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
  function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)out[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return out;}
  const camera={theta:.76,phi:.83,distance:44,target:[0,-1.7,0]};
  const desired={...camera,target:[0,-1.7,0]};
  let drag=null,currentView='city';
  canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY,desired.theta,desired.phi];canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;desired.theta=drag[2]-(e.clientX-drag[0])*.007;desired.phi=Math.min(1.4,Math.max(.25,drag[3]+(e.clientY-drag[1])*.006));});
  canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
  canvas.addEventListener('wheel',e=>{e.preventDefault();desired.distance=Math.min(65,Math.max(10,desired.distance+e.deltaY*.025));},{passive:false});
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
    const view=button.dataset.view;
    currentView=view;
    desired.target=view==='park'?[-8,.1,-6.6]:view==='city'?[0,-1.7,0]:[0,.4,0];
    desired.distance=view==='city'?44:16;
    desired.phi=view==='city'?.83:.76;desired.theta=view==='park'?.65:.76;
  }));
  const ids=['light','lightValue','traffic','trafficValue','moisture','moistureValue','mode','vehicleCount','queueCount','passedCount','phaseInfo','waterStatus','tankValue','tankFill','events','signalX','signalZ','rain','refill','pause'];
  const ui=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  ui.light.addEventListener('input',()=>{engine.light=+ui.light.value;sync();});
  ui.traffic.addEventListener('input',()=>{engine.setDemand(+ui.traffic.value/100);sync();});
  ui.moisture.addEventListener('input',()=>{engine.setMoisture(+ui.moisture.value);sync();});
  ui.rain.addEventListener('click',()=>{engine.setRain(!engine.rain);sync();});
  ui.refill.addEventListener('click',()=>{engine.refill();sync();});
  ui.pause.addEventListener('click',()=>{engine.paused=!engine.paused;sync();});
  let previousEvents='';
  function sync(){
    ui.lightValue.textContent=Math.round(engine.light);ui.trafficValue.textContent=Math.round(engine.demand*100);
    ui.moistureValue.textContent=Math.round(engine.moisture);ui.moisture.value=engine.moisture;
    ui.mode.textContent=engine.rain?'Pioggia':engine.light<30?'Notte connessa':'Giorno';
    ui.vehicleCount.textContent=engine.vehicles.length;ui.queueCount.textContent=engine.waiting;ui.passedCount.textContent=engine.passed;
    const names={green:'Verde',yellow:'Giallo',red:'Rosso'};
    for(const axis of['x','z']){const node=axis==='x'?ui.signalX:ui.signalZ;node.dataset.state=engine.signals[axis];node.querySelector('span').textContent=names[engine.signals[axis]];}
    ui.phaseInfo.textContent=engine.phase.endsWith('Clear')?'Incrocio in svuotamento: tutti rossi':(engine.phase[0]==='x'?'Est–Ovest':'Nord–Sud')+' · '+names[engine.signals[engine.phase[0]]]+' · '+engine.remaining+' s';
    ui.waterStatus.textContent=engine.irrigationMessage;ui.tankValue.textContent=engine.tank.toFixed(1)+' L';ui.tankFill.style.width=engine.tank/80*100+'%';
    ui.rain.setAttribute('aria-pressed',String(engine.rain));ui.pause.setAttribute('aria-pressed',String(engine.paused));ui.pause.textContent=engine.paused?'Riprendi':'Pausa';
    const key=engine.events.map(e=>e.message+e.time).join('|');
    if(key!==previousEvents){previousEvents=key;ui.events.replaceChildren(...engine.events.slice(0,2).map(e=>{const div=document.createElement('div');div.textContent=e.message;return div;}));}
  }
  function renderCar(car){
    const pos=car.axis==='x'?[car.q*car.dir,car.dir*.78]:[-car.dir*.78,car.q*car.dir];
    const yaw=car.axis==='x'?(car.dir===1?0:Math.PI):(car.dir===1?-Math.PI/2:Math.PI/2);
    const palette=[[.93,.35,.31],[.24,.83,.76],[.88,.91,.94],[.84,.66,.98],[.96,.75,.31]],color=palette[car.color];
    function local(x,y,z,w,h,d,c,g=0){const cosine=Math.cos(yaw),sine=Math.sin(yaw);draw('box',pos[0]+x*cosine+z*sine,y,pos[1]-x*sine+z*cosine,w,h,d,c,g,yaw);}
    local(0,.42,0,1.48,.33,.71,color);
    local(-.05,.67,0,.78,.30,.62,C.glass2);
    local(-.05,.84,0,.70,.055,.62,color);
    for(const x of[-.48,.48])for(const z of[-.38,.38])local(x,.23,z,.28,.28,.15,C.dark);
    for(const z of[-.22,.22]){local(.748,.45,z,.03,.10,.15,C.warm,engine.light<30?.9:.25);local(-.748,.44,z,.03,.09,.16,[1,.12,.18],car.speed<.2?1:.3);}
  }
  function renderSignals(){
    for(const lane of engine.lanes){
      const q=SmartCityEngine.STOP_LINE*lane.dir;
      const x=lane.axis==='x'?q:-lane.dir*1.94,z=lane.axis==='x'?lane.dir*1.94:q;
      const yaw=lane.axis==='x'?Math.PI/2:0;
      draw('cylinder',x,1.45,z,.13,2.9,.13,C.silver);
      draw('box',x,2.87,z,.59,1.29,.40,C.dark,0,yaw);
      for(let i=0;i<3;i++){
        const on=engine.signals[lane.axis]===['red','yellow','green'][i];
        const color=on?[[1,.09,.16],[1,.69,.14],[.10,1,.48]][i]:[.07,.12,.14];
        const dx=lane.axis==='x'?.25:0,dz=lane.axis==='z'?.25:0;
        for(const side of[-1,1])draw('sphere',x+dx*side,3.25-i*.37,z+dz*side,.29,.29,.20,color,on?1:0,yaw);
      }
    }
  }
  let lastTime=null,lastSync=0;
  function frame(ms){
    const dt=lastTime===null?0:Math.min((ms-lastTime)/1000,.06);lastTime=ms;if(!document.hidden)engine.update(dt);
    if(ms-lastSync>180){lastSync=ms;sync();}
    const factor=1-Math.exp(-dt*8);
    for(const key of['theta','phi','distance'])camera[key]+=(desired[key]-camera[key])*factor;
    camera.target=camera.target.map((v,i)=>v+(desired.target[i]-v)*factor);
    const ratio=Math.min(devicePixelRatio||1,1.5),w=Math.round(canvas.clientWidth*ratio),h=Math.round(canvas.clientHeight*ratio);
    if(w!==canvas.width||h!==canvas.height){canvas.width=w;canvas.height=h;}
    if(w<1||h<1){requestAnimationFrame(frame);return;}
    gl.viewport(0,0,w,h);
    const day=engine.light/100,sky=[.045+day*.27,.09+day*.37,.15+day*.40],night=engine.light<30;
    gl.clearColor(...sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const fittedDistance=camera.distance*(currentView==='city'?Math.max(1,1.15/(w/h)):1);
    const eye=[camera.target[0]+Math.sin(camera.theta)*Math.cos(camera.phi)*fittedDistance,camera.target[1]+Math.sin(camera.phi)*fittedDistance,camera.target[2]+Math.cos(camera.theta)*Math.cos(camera.phi)*fittedDistance];
    gl.uniformMatrix4fv(U.VP,false,multiply(perspective(.77,w/h),lookAt(eye,camera.target)));
    gl.uniform3f(U.Camera,...eye);gl.uniform3f(U.Fog,...sky);gl.uniform1f(U.Day,day);
    gl.disable(gl.BLEND);gl.depthMask(true);
    for(const o of staticObjects){let color=o.color;
      if(o.color===C.green){const dry=Math.max(0,(40-engine.moisture)/40);color=[.15+dry*.23,.60-dry*.16,.39-dry*.19];}
      draw(o.type,o.x,o.y,o.z,o.w,o.h,o.d,color,o.glow,o.yaw);
    }
    for(const win of windows)draw('box',win.x,win.y,win.z,win.w,win.h,win.d,win.seed%3===0?C.warm:C.cyan,night?.8:.08);
    for(const[x,z]of lamps){draw('box',x,2.62,z,.47,.10,.20,night?C.warm:C.silver,night?1:0);if(night)draw('cylinder',x,.012,z,.95,.018,.95,[.36,.31,.18],.35);}
    for(const[x,z]of turbines)for(let b=0;b<3;b++){const angle=engine.time*.7+b*Math.PI*2/3;draw('box',x+Math.cos(angle)*.46,2.65,z+Math.sin(angle)*.46,.25,1.4,.30,C.white,0,-angle);}
    const waterHeight=Math.max(.02,engine.tank/80*1.9);
    draw('cylinder',tankPos[0],.25+waterHeight/2,tankPos[1],1.35,waterHeight,1.35,C.water,.2);
    renderSignals();
    for(const car of engine.vehicles)renderCar(car);
    // Water particles follow continuous arcs from each active sprinkler.
    if(engine.irrigating){
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
      for(const[x,z]of sprinklers)for(let arm=0;arm<4;arm++)for(let k=0;k<8;k++){
        const p=(engine.time*1.15+k/8)%1,a=engine.time*.6+arm*Math.PI/2;
        draw('sphere',x+Math.cos(a)*p*2.0,.48+4*1.15*p*(1-p),z+Math.sin(a)*p*2.0,.075,.13,.075,C.water,.65,0,.80);
      }
      gl.depthMask(true);gl.disable(gl.BLEND);
    }
    if(engine.rain){
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
      for(let i=0;i<90;i++){const x=((i*7.31)%29)-14.5,z=((i*4.19)%23)-11.5,y=1+((10-i*.3-engine.time*7)%10+10)%10;draw('box',x,y,z,.022,.48,.022,[.56,.84,.97],.2,0,.5);}
      gl.depthMask(true);gl.disable(gl.BLEND);
    }
    requestAnimationFrame(frame);
  }
  sync();requestAnimationFrame(frame);
})();
