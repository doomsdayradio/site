const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
const hardwareThreads = navigator.hardwareConcurrency || 8;
const deviceMemory = navigator.deviceMemory || 8;
const lowPerformanceMode = prefersReducedMotion
  || coarsePointer
  || hardwareThreads <= 4
  || deviceMemory <= 4
  || window.innerWidth < 900;

document.documentElement.classList.toggle('fx-lite', lowPerformanceMode);
document.documentElement.classList.toggle('reduced-motion', prefersReducedMotion);
window.doomsdayAudioSignal={bass:0.55,mid:0.6,treble:0.45,level:0.74,playing:false};
document.documentElement.style.setProperty('--audio-level','0.74');
document.documentElement.style.setProperty('--audio-bass','0.55');
document.documentElement.style.setProperty('--audio-mid','0.60');
document.documentElement.style.setProperty('--audio-treble','0.45');
document.documentElement.style.setProperty('--audio-glow-color','rgba(243,108,4,0.55)');
document.documentElement.style.setProperty('--audio-glow-outer','rgba(243,108,4,0.28)');
document.documentElement.style.setProperty('--audio-glow-inner-r','3px');
document.documentElement.style.setProperty('--audio-glow-outer-r','8px');

/* livestream player and audio-reactive equalizer */
(function(){
  const player=document.querySelector('.radio-player');
  const logo=document.querySelector('.hero-logo');
  const audio=document.getElementById('radio-stream');
  const toggle=document.getElementById('stream-toggle');
  const status=document.getElementById('stream-status');
  const volume=document.getElementById('stream-volume');
  const equalizer=document.getElementById('equalizer');
  const ledMeter=document.querySelector('.led-meter-wrapper');
  const ledRow=document.getElementById('signal-led-row');
  const ledReadout=document.getElementById('signal-led-readout');
  const ledSegments=[];
  const bars=[];
  let audioContext=null;
  let analyser=null;
  let frequencyData=null;
  let visualizerFrame=0;
  let fallbackFrame=0;
  let isPlaying=false;
  let hasStarted=false;
  const baseSignalLevel=0.74;

  for(let index=0;index<20;index++){
    const segment=document.createElement('span');
    segment.className='led-segment';
    ledRow.appendChild(segment);
    ledSegments.push(segment);
  }

  for(let index=0;index<32;index++){
    const bar=document.createElement('span');
    bar.className='equalizer-bar is-fallback';
    bar.style.setProperty('--idle-height',(0.08+Math.sin((index+2)*0.55)*0.08+index%3*0.025).toFixed(2));
    equalizer.appendChild(bar);
    bars.push(bar);
  }

  if(location.origin==='https://doomsday.radio') audio.crossOrigin='anonymous';
  audio.src=audio.dataset.src;
  audio.volume=Number(volume.value);

  function setupAnalyser(){
    if(analyser || location.origin!=='https://doomsday.radio') return;
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext) return;
    audioContext=new AudioContext();
    analyser=audioContext.createAnalyser();
    analyser.fftSize=128;
    analyser.smoothingTimeConstant=0.78;
    frequencyData=new Uint8Array(analyser.frequencyBinCount);
    audioContext.createMediaElementSource(audio).connect(analyser).connect(audioContext.destination);
    bars.forEach(function(bar){bar.classList.remove('is-fallback')});
  }

  function startFallbackSignal(){
    if(!fallbackFrame) fallbackFrame=requestAnimationFrame(drawFallbackSignal);
  }

  function drawEqualizer(){
    if(!analyser || audio.paused){visualizerFrame=0;return}
    analyser.getByteFrequencyData(frequencyData);
    let bass=0;
    let mid=0;
    let treble=0;
    for(let index=0;index<frequencyData.length;index++){
      const value=frequencyData[index]/255;
      if(index<8) bass+=value/8;
      else if(index<28) mid+=value/20;
      else treble+=value/(frequencyData.length-28);
    }
    const signal=window.doomsdayAudioSignal;
    signal.bass+=(bass-signal.bass)*0.16;
    signal.mid+=(mid-signal.mid)*0.16;
    signal.treble+=(treble-signal.treble)*0.16;
    signal.level+=(Math.max(bass,mid,treble)-signal.level)*0.32;
    signal.playing=true;
    document.documentElement.style.setProperty('--audio-level',signal.level.toFixed(3));
    updateSignalVisualization(signal);
    bars.forEach(function(bar,index){
      const bin=Math.min(frequencyData.length-1,Math.floor(index*frequencyData.length/bars.length));
      const level=Math.max(0.08,frequencyData[bin]/255);
      bar.style.transform='scaleY('+level.toFixed(2)+')';
      bar.style.opacity=String(0.5+level*0.5);
    });
    visualizerFrame=requestAnimationFrame(drawEqualizer);
  }

  function drawFallbackSignal(now){
    if(!isPlaying){
      fallbackFrame=0;
      return;
    }
    const signal=window.doomsdayAudioSignal;
    const pulse=0.24+Math.max(0,Math.sin(now*0.008))*0.28+Math.max(0,Math.sin(now*0.013+1.8))*0.16;
    signal.level+=(pulse-signal.level)*0.32;
    signal.playing=true;
    document.documentElement.style.setProperty('--audio-level',signal.level.toFixed(3));
    signal.bass+=(signal.level-signal.bass)*0.18;
    signal.mid+=(pulse*0.86-signal.mid)*0.18;
    signal.treble+=(pulse*0.62-signal.treble)*0.18;
    document.documentElement.style.setProperty('--audio-bass',signal.bass.toFixed(3));
    document.documentElement.style.setProperty('--audio-mid',signal.mid.toFixed(3));
    document.documentElement.style.setProperty('--audio-treble',signal.treble.toFixed(3));
    updateSignalVisualization(signal);
    bars.forEach(function(bar,index){
      const profile=0.24+0.5*Math.abs(Math.sin(index*0.46+0.7));
      const travellingWave=0.18*Math.max(0,Math.sin(now*0.006-index*0.52));
      const level=Math.max(0.1,Math.min(1,signal.level*(profile+travellingWave)));
      bar.style.transform='scaleY('+level.toFixed(2)+')';
      bar.style.opacity=String(0.5+level*0.5);
    });
    fallbackFrame=requestAnimationFrame(drawFallbackSignal);
  }

  function updateSignalVisualization(signal){
    const percent=Math.round(Math.max(0,Math.min(1,signal.level))*100);
    const now=performance.now();

    // Distinct harmonic 3-phase chromatic rotation across canonical palette:
    // Orange (#f36c04), Signal Green (#83ffab), Warm Phosphor White (#f5efe4)
    const phase=now*0.0009;
    const pOrange=Math.pow(Math.max(0,Math.cos(phase)),2.2);
    const pGreen=Math.pow(Math.max(0,Math.cos(phase-2.0944)),2.2); // +120 deg
    const pWhite=Math.pow(Math.max(0,Math.cos(phase-4.1888)),2.2); // +240 deg

    // Audio-reactive spectral influence
    const wOrange=pOrange*0.8 + (signal.bass||0)*1.4;
    const wGreen=pGreen*0.8 + (signal.mid||0)*1.4;
    const wWhite=pWhite*0.8 + (signal.treble||0)*1.2;
    const totalWeight=Math.max(0.001,wOrange+wGreen+wWhite);

    const r=Math.round((243*wOrange + 131*wGreen + 245*wWhite)/totalWeight);
    const g=Math.round((108*wOrange + 255*wGreen + 239*wWhite)/totalWeight);
    const b=Math.round((4*wOrange + 171*wGreen + 228*wWhite)/totalWeight);

    const lvl=Math.max(0,Math.min(1,signal.level));
    const innerAlpha=(0.35 + lvl*0.22).toFixed(2);
    const outerAlpha=(0.14 + lvl*0.14).toFixed(2);
    const innerR=(2.0 + lvl*2.5).toFixed(1)+'px';
    const outerR=(5.0 + lvl*5.0).toFixed(1)+'px';

    const innerColor='rgba('+r+','+g+','+b+','+innerAlpha+')';
    const outerColor='rgba('+r+','+g+','+b+','+outerAlpha+')';

    if(logo){
      logo.style.filter='drop-shadow(0 0 '+innerR+' '+innerColor+') drop-shadow(0 0 '+outerR+' '+outerColor+')';
    }

    document.documentElement.style.setProperty('--audio-glow-color',innerColor);
    document.documentElement.style.setProperty('--audio-glow-outer',outerColor);
    document.documentElement.style.setProperty('--audio-glow-inner-r',innerR);
    document.documentElement.style.setProperty('--audio-glow-outer-r',outerR);
    document.documentElement.style.setProperty('--audio-bass',signal.bass.toFixed(3));
    document.documentElement.style.setProperty('--audio-mid',signal.mid.toFixed(3));
    document.documentElement.style.setProperty('--audio-treble',signal.treble.toFixed(3));
    const litCount=Math.round(Math.max(0,Math.min(1,signal.level))*ledSegments.length);
    const flickerSeed=performance.now()*0.007;
    ledSegments.forEach(function(segment,index){
      const ratio=index/(ledSegments.length-1);
      const wobble=Math.sin(flickerSeed+index*0.91)*0.5
        +Math.sin(flickerSeed*1.73+index*1.87)*0.35
        +(Math.random()-0.5)*0.45;
      const edge=Math.abs(index-(litCount-1));
      const spark=index>=litCount && index<=litCount+1 && wobble>0.48;
      const dropout=index<litCount && edge<=2 && wobble<-0.62;
      const isActive=(index<litCount && !dropout)||spark;
      segment.className='led-segment';
      if(isActive) segment.classList.add('active',ratio>0.75?'high':ratio>0.45?'mid':'low');
    });
    ledReadout.value=String(percent).padStart(2,'0')+'%';
    ledReadout.textContent=String(percent).padStart(2,'0')+'%';
    ledMeter.setAttribute('aria-valuenow',String(percent));
  }

  function updateAmbientMeter(){
    if(isPlaying && (analyser || fallbackFrame)) return;
    const now=performance.now();
    const jitter=Math.sin(now*0.002)*0.12+(Math.random()-0.5)*0.08;
    const level=Math.max(0.15,Math.min(0.98,baseSignalLevel+jitter));
    const bass=Math.max(0.15,Math.min(0.95,0.52+Math.sin(now*0.0023)*0.24));
    const mid=Math.max(0.15,Math.min(0.95,0.58+Math.sin(now*0.0031+1.4)*0.24));
    const treble=Math.max(0.12,Math.min(0.85,0.42+Math.cos(now*0.0041+2.2)*0.22));
    window.doomsdayAudioSignal={
      bass:bass,
      mid:mid,
      treble:treble,
      level:level,
      playing:false
    };
    document.documentElement.style.setProperty('--audio-level',level.toFixed(3));
    updateSignalVisualization(window.doomsdayAudioSignal);
  }

  setInterval(updateAmbientMeter,85);
  updateAmbientMeter();

  function setActive(isActive){
    player.classList.toggle('is-playing',isActive);
    toggle.setAttribute('aria-label',isActive?'Livestream pausieren':'Livestream abspielen');
    toggle.setAttribute('aria-pressed',String(isActive));
  }

  async function playStream(){
    status.textContent='VERBINDE...';
    setActive(true);
    toggle.disabled=true;
    try{
      try{setupAnalyser()}catch(error){analyser=null;frequencyData=null}
      if(audioContext && audioContext.state==='suspended') await audioContext.resume();
      await audio.play();
    }catch(error){
      status.textContent='SIGNAL NICHT ERREICHBAR';
      setActive(false);
    }finally{
      toggle.disabled=false;
    }
  }

  toggle.addEventListener('click',function(){
    if(audio.paused) playStream();
    else audio.pause();
  });

  volume.addEventListener('input',function(){
    audio.volume=Number(volume.value);
  });

  audio.addEventListener('playing',function(){
    hasStarted=true;
    isPlaying=true;
    setActive(true);
    status.textContent='ON AIR';
    if(analyser && !visualizerFrame) visualizerFrame=requestAnimationFrame(drawEqualizer);
    if(!analyser) startFallbackSignal();
  });

  audio.addEventListener('pause',function(){
    isPlaying=false;
    if(fallbackFrame) cancelAnimationFrame(fallbackFrame);
    fallbackFrame=0;
    window.doomsdayAudioSignal.playing=false;
    updateAmbientMeter();
    setActive(false);
    status.textContent=hasStarted?'SIGNAL PAUSIERT':'SIGNAL BEREIT';
  });

  audio.addEventListener('waiting',function(){status.textContent='PUFFERE SIGNAL...'});
  audio.addEventListener('error',function(){
    window.doomsdayAudioSignal.playing=false;
    setActive(false);
    status.textContent='SIGNAL NICHT ERREICHBAR';
  });
})();

/* Map-service weather summary */
(function(){
  const summary=document.getElementById('weather-summary');
  const weatherUrl='./weather.json';
  const fallback={temperature:null,status:'MAP SERVICE OFFLINE'};

  function render(weather){
    summary.textContent=weather.temperature===null?weather.status:weather.temperature.toFixed(1)+' °C · '+weather.status;
  }

  render(fallback);
  fetch(weatherUrl,{cache:'no-store'})
    .then(function(response){if(!response.ok) throw new Error('weather unavailable');return response.json()})
    .then(function(data){
      const current=data.current||{};
      const temperature=Number(current.temperature_c);
      if(current.temperature_c!==null && Number.isFinite(temperature) && data.source_weather?.name) render({temperature:temperature,status:String(current.status_code||fallback.status).replace('_',' ')});
    })
    .catch(function(){summary.dataset.state='offline'});
})();

/* frequency dial ticks */
(function(){
  const el=document.getElementById('freqTicks');
  for(let i=0;i<72;i++){
    const t=document.createElement('div');
    t.className='tick';
    t.style.transform='rotate('+i*5+'deg)';
    if(i%6===0){t.style.height='20px';t.style.background='rgba(180,75,47,0.55)'}
    el.appendChild(t);
  }
})();

/* live clock */
(function tick(){
  const d=new Date();
  const month=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  const h=String(d.getHours()).padStart(2,'0');
  const m=String(d.getMinutes()).padStart(2,'0');
  const s=String(d.getSeconds()).padStart(2,'0');
  document.getElementById('clock').textContent='2222-'+month+'-'+day+' '+h+':'+m+':'+s;
  setTimeout(tick,1000);
})();

/* floating dust particles */
(function(){
  const c=document.getElementById('dust');
  const ctx=c.getContext('2d');
  let W,H;
  let rafId=0;
  let lastFrame=0;
  const frameInterval=lowPerformanceMode ? 1000/18 : 1000/30;
  const particleCount=lowPerformanceMode ? 36 : 72;

  function resize(){W=c.width=innerWidth;H=c.height=innerHeight}
  resize();
  addEventListener('resize',resize);

  const particles=[];
  for(let i=0;i<particleCount;i++){
    particles.push({
      x:Math.random()*innerWidth,
      y:Math.random()*innerHeight,
      r:Math.random()*1.8+0.3,
      dx:(Math.random()-0.5)*(lowPerformanceMode ? 0.18 : 0.25),
      dy:Math.random()*(lowPerformanceMode ? 0.11 : 0.15)+0.05,
      o:Math.random()*0.35+0.05
    });
  }

  function draw(now){
    if(document.hidden){
      rafId=0;
      return;
    }
    if(lastFrame && (now-lastFrame)<frameInterval){
      rafId=requestAnimationFrame(draw);
      return;
    }
    lastFrame=now;
    ctx.clearRect(0,0,W,H);
    for(const p of particles){
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle='rgba(200,170,130,'+p.o+')';
      ctx.fill();
      p.x+=p.dx;p.y+=p.dy;
      if(p.y>H+10){p.y=-10;p.x=Math.random()*W}
      if(p.x<-10)p.x=W+10;
      if(p.x>W+10)p.x=-10;
    }
    rafId=requestAnimationFrame(draw);
  }

  function resume(){
    if(!rafId){
      lastFrame=0;
      rafId=requestAnimationFrame(draw);
    }
  }

  document.addEventListener('visibilitychange',function(){
    if(document.hidden){
      if(rafId) cancelAnimationFrame(rafId);
      rafId=0;
      return;
    }
    resume();
  });

  resume();
})();

/* random glitch flicker */
(function(){
  const title=document.querySelector('.title');
  let glitchTimeout=0;
  let resetTimeout=0;

  function resetTitle(){
    if(!title) return;
    title.style.transform='';
    title.style.textShadow='';
  }

  function scheduleNext(delay){
    clearTimeout(glitchTimeout);
    if(document.hidden) return;
    glitchTimeout=setTimeout(glitch, delay);
  }

  function glitch(){
    if(!title || document.hidden){
      scheduleNext(2000);
      return;
    }
    title.style.transform='translate('+(Math.random()-0.5)*3+'px,'+(Math.random()-0.5)*2+'px)';
    title.style.textShadow=
      (Math.random()-0.5)*4+'px 0 rgba(209,255,69,0.4),'+
      (Math.random()-0.5)*4+'px 0 rgba(180,75,47,0.3),'+
      '0 0 10px rgba(209,255,69,0.3),0 0 40px rgba(209,255,69,0.12)';
    clearTimeout(resetTimeout);
    resetTimeout=setTimeout(resetTitle,80+Math.random()*80);
    scheduleNext((lowPerformanceMode ? 5000 : 3000)+Math.random()*(lowPerformanceMode ? 9000 : 8000));
  }

  document.addEventListener('visibilitychange',function(){
    if(document.hidden){
      clearTimeout(glitchTimeout);
      clearTimeout(resetTimeout);
      resetTitle();
      return;
    }
    scheduleNext(1200);
  });

  scheduleNext(2000);
})();
