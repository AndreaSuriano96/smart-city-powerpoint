(function (root) {
  'use strict';
  const LENGTH = 1.48;
  const HALF = LENGTH / 2;
  const STOP_LINE = -2.65;
  const STOP_CENTER = STOP_LINE - HALF - 0.12;
  const GAP = 0.64;
  // The two road axes have different lengths: x spans 32 units, z spans 26.
  // Spawn and despawn cars before their body crosses the corresponding road edge.
  const ROAD_HALF = {x:16,z:13};
  const EDGE_MARGIN = 0.05;
  const PHASES = ['xGreen','xYellow','xClear','zGreen','zYellow','zClear'];
  const LANES = [
    {id:'east',axis:'x',dir:1},
    {id:'west',axis:'x',dir:-1},
    {id:'south',axis:'z',dir:1},
    {id:'north',axis:'z',dir:-1}
  ];
  class CityEngine {
    constructor() {
      this.time = 0;
      this.light = 58;
      this.demand = 0.55;
      this.moisture = 53;
      this.tank = 80;
      this.waterUsed = 0;
      this.rain = false;
      this.irrigating = false;
      this.paused = false;
      this.phaseIndex = 0;
      this.phaseTime = 0;
      this.greenDuration = 7;
      this.lanes = LANES.map((lane,i)=>{
        const edge=ROAD_HALF[lane.axis]-HALF-EDGE_MARGIN;
        return {...lane,entry:edge,exit:edge,cars:[],spawnTimer:1.5+i*.8};
      });
      this.nextId = 0;
      this.passed = 0;
      this.accumulator = 0;
      this.events = [];
      this.event('Città connessa: sensori attivi.');
      this.lanes.forEach((lane,i) => {
        [-4.2-i*.3,-8.2-i*.25,-12.1].forEach((q,k)=>this.spawn(lane,q,k===0?0:1));
      });
    }
    event(message) {
      this.events.unshift({time:this.time,message});
      this.events=this.events.slice(0,4);
    }
    spawn(lane,q=-lane.entry,speed=0) {
      lane.cars.push({id:this.nextId++,q,speed,committed:q>STOP_CENTER,color:this.nextId%5,lane:lane.id});
    }
    get phase() { return PHASES[this.phaseIndex]; }
    get signals() {
      return {x:this.phase==='xGreen'?'green':this.phase==='xYellow'?'yellow':'red',
        z:this.phase==='zGreen'?'green':this.phase==='zYellow'?'yellow':'red'};
    }
    get phaseDuration() {
      return this.phase.endsWith('Green')?this.greenDuration:this.phase.endsWith('Yellow')?2.1:1.15;
    }
    get remaining() {return Math.max(0,Math.ceil(this.phaseDuration-this.phaseTime));}
    get vehicles() { return this.lanes.flatMap(l=>l.cars.map(car=>({...car,axis:l.axis,dir:l.dir}))); }
    get waiting() {return this.lanes.reduce((n,l)=>n+l.cars.filter(c=>c.q<STOP_LINE&&c.speed<.15).length,0);}
    get intersectionOccupied() {
      return this.lanes.some(l=>l.cars.some(c=>c.committed&&c.q+HALF>STOP_LINE-.25&&c.q-HALF<-STOP_LINE));
    }
    get irrigationMessage() {
      if(this.rain)return 'Pioggia: irrigazione sospesa';
      if(this.tank<=0)return 'Serbatoio vuoto: ricarica acqua';
      if(this.irrigating)return 'Getti attivi fino al 65%';
      return 'In attesa: il terreno è umido';
    }
    setMoisture(value) {this.moisture=Math.max(0,Math.min(100,value));this.updateWaterSwitch();}
    setDemand(value) {this.demand=Math.max(0,Math.min(1,value));}
    setRain(value) {this.rain=!!value;this.event(value?'Pioggia rilevata: acqua risparmiata.':'La pioggia è terminata.');this.updateWaterSwitch();}
    refill() {this.tank=80;this.event('Serbatoio ricaricato: 80 litri simulati.');this.updateWaterSwitch();}
    updateWaterSwitch() {
      const before=this.irrigating;
      if(this.rain||this.tank<=0||this.moisture>=65)this.irrigating=false;
      else if(this.moisture<=32)this.irrigating=true;
      if(before!==this.irrigating)this.event(this.irrigating?'Terreno asciutto: si apre la valvola del parco.':'Irrigazione arrestata: valvola chiusa.');
    }
    advancePhase() {
      if(this.phaseTime<this.phaseDuration)return;
      if(this.phase.endsWith('Clear')&&this.intersectionOccupied)return;
      this.phaseIndex=(this.phaseIndex+1)%PHASES.length;
      this.phaseTime=0;
      if(this.phase.endsWith('Green')){
        const axis=this.phase[0];
        const queued=this.lanes.filter(l=>l.axis===axis).reduce((n,l)=>n+l.cars.filter(c=>c.q<STOP_LINE).length,0);
        this.greenDuration=Math.min(11,5.5+queued*.6+this.demand*1.8);
      }
    }
    update(dt) {
      if(this.paused)return;
      this.accumulator+=Math.min(Math.max(dt,0),.25);
      while(this.accumulator>=.02){this.step(.02);this.accumulator-=.02;}
    }
    step(dt) {
      this.time+=dt;
      this.phaseTime+=dt;
      this.advancePhase();
      const signals=this.signals;
      for(const lane of this.lanes) {
        lane.cars.sort((a,b)=>b.q-a.q);
        let leader=null;
        for(const car of lane.cars) {
          let limit=leader?leader.q-LENGTH-GAP:Infinity;
          if(!car.committed&&signals[lane.axis]!=='green')limit=Math.min(limit,STOP_CENTER);
          const freeDistance=Math.max(0,limit-car.q);
          const cruise=3.2-this.demand*.65;
          const brakingSpeed=Math.sqrt(2*2.8*freeDistance);
          const desired=Math.min(cruise,brakingSpeed);
          car.speed=desired<car.speed?Math.max(desired,car.speed-3.0*dt):Math.min(desired,car.speed+1.45*dt);
          const newQ=car.q+car.speed*dt;
          car.q=Math.min(newQ,limit);
          if(newQ>=limit)car.speed=0;
          if(car.q>STOP_CENTER+.00001)car.committed=true;
          leader=car;
        }
        const prior=lane.cars.length;
        lane.cars=lane.cars.filter(car=>car.q<lane.exit);
        this.passed+=prior-lane.cars.length;
        lane.spawnTimer-=dt;
        if(this.demand>.02&&lane.spawnTimer<=0) {
          const tail=lane.cars[lane.cars.length-1];
          if(!tail||tail.q>-lane.entry+LENGTH+GAP+.4) {
            this.spawn(lane);
            lane.spawnTimer=1.65+(1-this.demand)*5.4;
          } else lane.spawnTimer=.35;
        }
      }
      this.updateWaterSwitch();
      if(this.irrigating){
        const available=Math.min(this.tank,.85*dt);
        this.tank-=available;
        this.waterUsed+=available;
        this.moisture=Math.min(100,this.moisture+available*4.5);
      } else if(this.rain)this.moisture=Math.min(100,this.moisture+2.3*dt);
      else this.moisture=Math.max(0,this.moisture-(.012+this.light/100*.035)*dt);
      this.updateWaterSwitch();
    }
  }
  const api={CityEngine,STOP_LINE,STOP_CENTER,LENGTH,HALF,GAP};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.SmartCityEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
