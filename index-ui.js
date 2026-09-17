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
document.documentElement.classList.toggle('bass-debug', new URLSearchParams(location.search).has('bass-debug'));
window.doomsdayAudioSignal={bass:0,mid:0.6,treble:0.45,sub:0,level:0.74,transient:0,hardBass:0,bassOnset:0,playing:false};
document.documentElement.style.setProperty('--audio-level','0.74');
document.documentElement.style.setProperty('--audio-bass','0.55');
document.documentElement.style.setProperty('--audio-mid','0.60');
document.documentElement.style.setProperty('--audio-treble','0.45');
document.documentElement.style.setProperty('--audio-glow-color','rgba(243,108,4,0)');
document.documentElement.style.setProperty('--audio-glow-outer','rgba(243,108,4,0)');
document.documentElement.style.setProperty('--audio-glow-inner-r','0px');
document.documentElement.style.setProperty('--audio-glow-outer-r','0px');

/* Mobile navigation stays collapsed until the user asks for it. */
(function(){
  const menuToggle=document.getElementById('section-menu-toggle');
  const menu=document.getElementById('section-menu');
  if(!menuToggle || !menu) return;
  function setMenuOpen(isOpen){
    document.documentElement.classList.toggle('section-menu-open',isOpen);
    menuToggle.setAttribute('aria-expanded',String(isOpen));
    menuToggle.setAttribute('aria-label',isOpen?'Menü schließen':'Menü öffnen');
    menuToggle.title=isOpen?'Menü schließen':'Menü öffnen';
  }
  menuToggle.addEventListener('click',function(){
    setMenuOpen(menuToggle.getAttribute('aria-expanded')!=='true');
  });
  menu.addEventListener('click',function(event){
    if(event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('keydown',function(event){
    if(event.key==='Escape') setMenuOpen(false);
  });
})();

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
  const bassDebugReadout=document.getElementById('bass-debug-readout');
  const bassDebugFill=document.getElementById('bass-debug-fill');
  const bassDebugHardReadout=document.getElementById('bass-debug-hard-readout');
  const btnIcon=toggle?toggle.querySelector('.stream-icon'):null;
  const ledSegments=[];
  const bars=[];
  /* hardBass trigger thresholds come from fx-config.js; these defaults mirror
   * the config so the signal pipeline works even without the config file. */
  const fxHeavyBass=((window.doomsdayFxConfig||{}).triggers||{}).heavyBass||{};
  const fxHardBassOn=Number.isFinite(Number(fxHeavyBass.on))?Number(fxHeavyBass.on):0.88;
  const fxNoiseCfg=((window.doomsdayFxConfig||{}).triggers||{}).noise||{};
  const fxSyncCfg=((window.doomsdayFxConfig||{}).triggers||{}).sync||{};
  const fxBassCoupledCfg=((window.doomsdayFxConfig||{}).triggers||{}).bassCoupled||{};
  const cfgNum=function(group,key,fallback){
    const value=Number(group[key]);
    return Number.isFinite(value)?value:fallback;
  };
  let wsDelayMs=Number.isFinite(Number(fxSyncCfg.delayMs))?Math.max(0,Number(fxSyncCfg.delayMs)):4000;
  try{
    const savedDelay=Number(localStorage.getItem('ddSyncDelayMs'));
    if(Number.isFinite(savedDelay)&&savedDelay>=0) wsDelayMs=savedDelay;
  }catch(error){}
  const wsQueue=[];
  const noiseLayer=document.querySelector('.noise');
  const noiseBaseline=document.documentElement.classList.contains('fx-lite')?0.028:0.02;
  const noiseMaxOpacity=Number.isFinite(Number(fxNoiseCfg.maxOpacity))?Number(fxNoiseCfg.maxOpacity):0.16;
  const noiseBoost=Number.isFinite(Number(fxNoiseCfg.boost))?Number(fxNoiseCfg.boost):1.6;
  let audioContext=null;
  let analyser=null;
  let frequencyData=null;
  let floatFrequencyData=null;
  let meydaAnalyzer=null;
  let outputGain=null;
  let meydaFeatures=null;
  let previousMeydaRms=0;
  let visualizerFrame=0;
  let fallbackFrame=0;
  let fallbackTimer=0;
  let isPlaying=false;
  let hasStarted=false;
  let silentFrames=0;
  let analyserBroken=false;
  let vizMode='off';
  let captureStream=null;
  let captureSource=null;
  let vizFrameCount=0;
  let wsSocket=null;
  let wsReconnectTimer=0;
  let wsReconnectDelay=1000;
  let wsRawLevel=0;
  let wsFastLevel=0;
  let wsBassBaseline=0;
  let lastSubLevel=0;
  let lastKickDebug=null;
  const wsSubHistory=[];
  const levelsUrl='wss://stream.doomsday.radio/levels';
  const baseSignalLevel=0.74;
  const canAnalyzeAudio=location.hostname==='doomsday.radio';
  const urlParams=new URLSearchParams(location.search);
  /* ?debug shows the full player debug panel; ?viz-debug stays supported and
     behaves like ?debug (log lines included). */
  const debugMode=urlParams.has('debug')||urlParams.has('viz-debug');
  const vizDebug=debugMode;

  let vizDebugPanel=null; /* log lines render into the ?debug panel below */
  let vizDebugLines=[];
  function vizLog(message){
    if(!vizDebug)return;
    vizDebugLines.push(new Date().toTimeString().slice(0,8)+' '+message);
    if(vizDebugLines.length>6)vizDebugLines.shift();
    console.warn('[viz]',message);
    renderDebugPanel();
  }

  /* Full debug panel (?debug): player state, signal, FX thresholds and live
     FX state (fluid module publishes window.doomsdayFxState). */
  let debugPanel=null;
  function pct(value){return Math.round(Math.max(0,Math.min(1,value||0))*100)+'%'}
  function renderDebugPanel(){
    if(!debugMode) return;
    if(!debugPanel){
      debugPanel=document.createElement('pre');
      debugPanel.style.cssText='position:fixed;right:8px;top:8px;z-index:9999;background:rgba(0,0,0,0.82);color:#f5efe4;font:11px/1.45 monospace;padding:8px 10px;max-width:60vw;white-space:pre-wrap;word-break:break-all;margin:0;pointer-events:none;';
      document.body.appendChild(debugPanel);
    }
    const s=window.doomsdayAudioSignal||{};
    const fx=window.doomsdayFxState||{};
    const cfg=(window.doomsdayFxConfig&&window.doomsdayFxConfig.triggers)||{};
    const hb=cfg.heavyBass||{}, ts=cfg.trebleSpike||{}, hl=cfg.highLevel||{}, nz=cfg.noise||{};
    const lines=[
      '== doomsday debug ==',
      'status    '+status.textContent+(isPlaying?' [playing]':' [idle]')+' viz:'+vizMode,
      'audioctx  '+(audioContext?audioContext.state:'none')+' analyser:'+(analyser?'yes':'no')+' meyda:'+(meydaAnalyzer?'yes':'no'),
      'ws        '+(wsSocket?'connected':'-')+' '+levelsUrl,
      'signal    lvl:'+pct(s.level)+' bass:'+pct(s.bass)+' mid:'+pct(s.mid)+' treble:'+pct(s.treble)+' transient:'+pct(s.transient)+' onset:'+pct(s.bassOnset),
      'hardBass  '+pct(s.hardBass)+(s.hardBassConfirmed?' CONFIRMED':'')+' (on '+pct(hb.on)+')',
      'fx        bassFrames:'+(fx.hardBassFrames||0)+(fx.hardBassTriggered?' T':'')+' spikeFrames:'+(fx.trebleSpikeFrames||0)+(fx.trebleSpikeReady===false?' cool':'')+' glitch:'+(fx.glitchEmissionBursts||0)+' lastSpray:'+((fx.lastAudioSprayAge!=null?fx.lastAudioSprayAge+'ms':'-')),
      lastKickDebug?('kickdet  sub:'+lastKickDebug.sub.toFixed(2)+' past3s:'+lastKickDebug.past.toFixed(2)+' onset:'+lastKickDebug.onset.toFixed(2)+' gate:'+lastKickDebug.gate.toFixed(2)):'kickdet  -',
      'thresh    heavyBass:'+pct(hb.on)+'/'+pct(hb.off)+' highLevel:'+pct(hl.on)+' spike:'+pct(ts.on)+' +transient:'+pct(ts.transientOn)+' noiseMax:'+(nz.maxOpacity!=null?nz.maxOpacity:'-')+' delay:'+(wsDelayMs/1000)+'s',
    ];
    if(vizDebugLines.length) lines.push('-- log --', vizDebugLines.join('\n'));
    if(debugHistory.length>4) lines.push(
      '-- rhythm (last ~12s) --',
      'sub(raw) '+spark('sub'),
      'kick     '+spark('onset'),
      'bass(dom)'+spark('bass'),
      'transient'+spark('transient'),
      'level    '+spark('level')
    );
    debugPanel.textContent=lines.join('\n');
  }
  window.setInterval(renderDebugPanel,200);

  /* Live delay calibration (?debug): ArrowUp/ArrowDown shift the levels
   * delay by 250ms, PageUp/PageDown by 1000ms. The value persists in
   * localStorage and wins over fx-config until cleared. */
  document.addEventListener('keydown',function(event){
    if(!debugMode) return;
    let step=0;
    if(event.key==='ArrowUp') step=250;
    else if(event.key==='ArrowDown') step=-250;
    else if(event.key==='PageUp') step=1000;
    else if(event.key==='PageDown') step=-1000;
    if(!step) return;
    event.preventDefault();
    wsDelayMs=Math.max(0,wsDelayMs+step);
    wsQueue.length=0;
    try{localStorage.setItem('ddSyncDelayMs',String(wsDelayMs))}catch(error){}
    vizLog('sync delay -> '+(wsDelayMs/1000).toFixed(2)+'s');
    renderDebugPanel();
  });

  /* Rhythm display: ring buffer of recent signal samples for the sparklines. */
  const debugHistory=[];
  function pushDebugSample(){
    if(!debugMode) return;
    const s=window.doomsdayAudioSignal;
    debugHistory.push({
      bass:s.bass||0,
      onset:s.bassOnset||0,
      transient:s.transient||0,
      level:s.level||0,
      sub:lastSubLevel
    });
    if(debugHistory.length>72) debugHistory.shift();
  }
  const SPARK_CHARS='▁▂▃▄▅▆▇█';
  function spark(key){
    return debugHistory.map(function(sample){
      return SPARK_CHARS[Math.max(0,Math.min(7,Math.round((sample[key]||0)*7)))];
    }).join('');
  }

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

  if(canAnalyzeAudio) audio.crossOrigin='anonymous';
  audio.src=audio.dataset.src;
  audio.volume=Number(volume.value);

  function setupAnalyser(){
    if(analyser) return;
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext) return;
    audioContext=new AudioContext();
    analyser=audioContext.createAnalyser();
    analyser.fftSize=1024;
    analyser.minDecibels=-100;
    analyser.maxDecibels=0;
    analyser.smoothingTimeConstant=0.55;
    frequencyData=new Uint8Array(analyser.frequencyBinCount);
    floatFrequencyData=new Float32Array(analyser.frequencyBinCount);
    const source=audioContext.createMediaElementSource(audio);
    outputGain=audioContext.createGain();
    outputGain.gain.value=Number(volume.value);
    source.connect(analyser);
    source.connect(outputGain).connect(audioContext.destination);
    audio.volume=1;
    if(window.Meyda){
      meydaAnalyzer=window.Meyda.createMeydaAnalyzer({
        audioContext:audioContext,
        source:source,
        bufferSize:512,
        featureExtractors:['rms','spectralFlux','amplitudeSpectrum'],
        callback:updateMeydaFeatures
      });
    }
    bars.forEach(function(bar){bar.classList.remove('is-fallback')});
    vizMode='element';
    vizLog('element tap active');
  }

  function updateMeydaFeatures(features){
    const spectrum=features.amplitudeSpectrum||[];
    if(!spectrum.length || !audioContext) return;
    const binWidth=audioContext.sampleRate/(2*spectrum.length);
    function bandEnergy(startHz,endHz){
      const start=Math.max(1,Math.floor(startHz/binWidth));
      const end=Math.min(spectrum.length,Math.ceil(endHz/binWidth));
      let total=0;
      for(let index=start;index<end;index++) total+=spectrum[index]*spectrum[index];
      return total;
    }
    let totalEnergy=0;
    for(let index=1;index<spectrum.length;index++) totalEnergy+=spectrum[index]*spectrum[index];
    const bassEnergy=bandEnergy(35,160);
    const midEnergy=bandEnergy(160,2200);
    const trebleEnergy=bandEnergy(2200,10000);
    const bassMidEnergy=Math.max(0.001,bassEnergy+midEnergy);
    const totalBandEnergy=Math.max(0.001,totalEnergy);
    const bassRatio=bassEnergy/bassMidEnergy;
    const midRatio=midEnergy/bassMidEnergy;
    const trebleRatio=trebleEnergy/totalBandEnergy;
    const rms=Math.max(0,Math.min(1,(features.rms||0)*4));
    const rmsRise=Math.max(0,rms-previousMeydaRms);
    previousMeydaRms=rms;
    const flux=Math.max(0,Math.min(1,(features.spectralFlux||0)*3));
    const bassContrast=Math.max(0,Math.min(1,(bassRatio-midRatio*0.75-0.08)/0.32));
    meydaFeatures={
      bass:Math.max(0,Math.min(1,(bassRatio-0.45)/0.25)),
      mid:Math.max(0,Math.min(1,midRatio*0.22)),
      treble:Math.max(0,Math.min(1,trebleRatio*0.12)),
      level:rms,
      transient:Math.max(flux,rmsRise*4),
      hardBass:bassContrast*flux,
      hardBassConfirmed:bassContrast>=0.68&&flux>=0.28
    };
  }

  /* Server-driven visualization: liquidsoap analyzes the on-air signal and
     broadcasts band levels over wss://stream.doomsday.radio/levels. This is
     the top tier because iOS WebKit feeds local analysers only zeros for
     cross-origin media. */
  function scheduleWsReconnect(){
    if(wsReconnectTimer) return;
    wsReconnectTimer=window.setTimeout(function(){
      wsReconnectTimer=0;
      ensureWebSocketViz();
    },wsReconnectDelay);
    wsReconnectDelay=Math.min(wsReconnectDelay*2,30000);
  }

  function stopLocalVisualizer(){
    if(visualizerFrame){cancelAnimationFrame(visualizerFrame);visualizerFrame=0}
    stopFallbackSignal();
  }

  function resumeLocalVisualizer(){
    if(analyser && vizMode!=='fallback'){
      vizMode='element';
      silentFrames=0;
      if(!visualizerFrame) visualizerFrame=requestAnimationFrame(drawEqualizer);
    }else if(!analyser){
      if(vizMode==='ws'||vizMode==='off') vizMode='fallback';
      startFallbackSignal();
    }
  }

  function ensureWebSocketViz(){
    if(wsSocket || wsReconnectTimer || !canAnalyzeAudio) return;
    let socket;
    try{socket=new WebSocket(levelsUrl)}
    catch(error){
      vizLog('[ws] connect failed: '+(error&&error.message?error.message:String(error)));
      scheduleWsReconnect();
      return;
    }
    wsSocket=socket;
    socket.addEventListener('open',function(){
      vizLog('[ws] connected');
      wsReconnectDelay=1000;
      vizMode='ws';
      stopLocalVisualizer();
    });
    socket.addEventListener('message',function(event){handleLevelsMessage(event.data)});
    socket.addEventListener('close',function(){
      vizLog('[ws] close');
      if(wsSocket===socket) wsSocket=null;
      if(vizMode==='ws'){vizLog('[ws] -> local chain');resumeLocalVisualizer()}
      scheduleWsReconnect();
    });
    socket.addEventListener('error',function(){
      vizLog('[ws] error');
      try{socket.close()}catch(error){}
    });
  }

  function handleLevelsMessage(raw){
    if(audio.paused) return;
    let payload;
    try{payload=JSON.parse(raw)}
    catch(error){return}
    if(!Array.isArray(payload.bands) || payload.bands.length<8) return;
    if(wsDelayMs<=0){
      applyLevelsPayload(payload);
      return;
    }
    /* Delayed replay: the browser hears the stream later than the server
     * analyzes it, so queue payloads and apply them once their slot is due. */
    wsQueue.push({due:performance.now()+wsDelayMs,payload});
    if(wsQueue.length>240) wsQueue.splice(0,wsQueue.length-240);
  }

  window.setInterval(function(){
    if(!wsQueue.length || audio.paused) return;
    const now=performance.now();
    let due=null;
    while(wsQueue.length && wsQueue[0].due<=now) due=wsQueue.shift().payload;
    if(due) applyLevelsPayload(due);
  },80);

  function applyLevelsPayload(payload){
    const bands=payload.bands;
    /* Levels arrive as integers 0..1000 (milli-units) because liquidsoap
       cannot reliably format decimal floats into JSON. */
    const milli=function(value){
      const number=Number(value);
      if(!Number.isFinite(number)) return 0;
      return Math.max(0,Math.min(1,number/1000));
    };
    const signal=window.doomsdayAudioSignal;
    const avg=function(from,to){
      let total=0;
      for(let index=from;index<to;index++) total+=milli(bands[index]);
      return total/(to-from);
    };
    const rawLevel=milli(payload.level);
    /* Band RMS values are absolutely normalized and the top bands are almost
       always near-empty on our material, so "vs the band average" still reads
       bass-dominant during loud midrange songs. Measure each range against
       the strongest OTHER range instead — bass is only "dominant" when it
       beats the mids and treble outright. Absolute floors keep quiet
       passages at zero. */
    const clamp01=function(value){return Math.max(0,Math.min(1,value))};
    const rawBass=avg(0,2);
    const rawMid=avg(2,6);
    const rawTreble=avg(6,8);
    const bass=rawBass<0.10?0:clamp01((rawBass/Math.max(rawMid,rawTreble,0.12)-0.8)/1.2);
    const mid=clamp01((rawMid/Math.max(rawBass,rawTreble,0.10)-0.8)/1.2);
    const treble=rawTreble<0.06?0:clamp01((rawTreble/Math.max(rawBass,rawMid,0.10)-0.5)/1.5);
    wsRawLevel=rawLevel;
    /* Transient: rise above a FAST follower of the level, so it fires on
     * attacks and decays smoothly instead of pegging at 100%. */
    const transient=Math.max(0,Math.min(1,(rawLevel-wsFastLevel)/0.08));
    wsFastLevel+=(rawLevel-wsFastLevel)*0.5;
    /* WS bass values are RMS-based and top out around 60% of the 0..1 range,
       so an absolute 0.88 threshold would never fire. Track a slow baseline
       and measure bass as a spike ratio against it: "hardest hit of the
       song". The absolute floor keeps quiet passages from glitching. */
    wsBassBaseline+=(bass-wsBassBaseline)*0.008;
    /* Kick detector on the SUB band (0-120 Hz): kicks live almost entirely
     * below 120 Hz, low piano/guitar notes split across band 1 and the mids.
     * Onset = sub level above its slow envelope, gated by an absolute sub
     * floor so warm midrange instruments can't fake a kick. */
    const sub=milli(bands[0]);
    lastSubLevel=sub;
    /* Kick detector on ABSOLUTE sub peaks: compare the sub level against its
     * own value ~3s ago (ring buffer). A kick is a sharp spike over the
     * recent past; sustained bass sits at the same level 3s later and gives
     * no onset. The absolute gate keeps midrange-only content out. */
    wsSubHistory.push(sub);
    if(wsSubHistory.length>15) wsSubHistory.shift();
    const pastSub=wsSubHistory.length>3?wsSubHistory[0]:sub;
    const subOnset=Math.max(0,sub-pastSub);
    const subGate=clamp01((sub-cfgNum(fxBassCoupledCfg,'subGateOn',0.18))/cfgNum(fxBassCoupledCfg,'subGateScale',0.12));
    lastKickDebug={sub:sub,past:pastSub,onset:subOnset,gate:subGate};
    const bassSpikeRatio=bass/Math.max(0.15,wsBassBaseline*1.7);
    signal.bass+=(bass-signal.bass)*0.15;
    signal.mid+=(mid-signal.mid)*0.10;
    signal.treble+=(treble-signal.treble)*0.10;
    signal.level+=(rawLevel-signal.level)*0.20;
    signal.sub+=(sub-signal.sub)*0.25;
    signal.transient+=(transient-signal.transient)*0.4;
    signal.hardBass=Math.max(0,Math.min(1,(bassSpikeRatio-1.2)/0.8));
    signal.hardBassConfirmed=signal.hardBass>=fxHardBassOn&&bass>=0.3;
    signal.bassOnset+=(clamp01(subOnset/cfgNum(fxBassCoupledCfg,'onsetScale',0.15))*subGate-signal.bassOnset)*0.45;
    signal.playing=true;
    document.documentElement.style.setProperty('--audio-level',signal.level.toFixed(3));
    updateSignalVisualization(signal);
    pushDebugSample();
    bars.forEach(function(bar,index){
      const position=index*(bands.length-1)/bars.length;
      const lower=Math.min(bands.length-1,Math.floor(position));
      const upper=Math.min(bands.length-1,lower+1);
      const fraction=position-lower;
      const value=milli(bands[lower])*(1-fraction)+milli(bands[upper])*fraction;
      const level=Math.max(0.08,Math.min(1,value));
      bar.style.transform='scaleY('+level.toFixed(2)+')';
      bar.style.opacity=String(0.5+level*0.5);
    });
  }

  function startFallbackSignal(){
    if(fallbackTimer || vizMode==='ws') return;
    vizLog('fallback START');
    fallbackFrame=1;
    fallbackTimer=window.setInterval(function(){drawFallbackSignal(performance.now())},50);
  }

  function stopFallbackSignal(){
    if(fallbackTimer) window.clearInterval(fallbackTimer);
    fallbackTimer=0;
    fallbackFrame=0;
  }

  function teardownElementTap(){
    if(meydaAnalyzer){try{meydaAnalyzer.stop()}catch(error){}}
    meydaAnalyzer=null;
    meydaFeatures=null;
    /* Keep outputGain connected: once createMediaElementSource() routed the
       element through the WebAudio graph, disconnecting would mute the stream. */
    try{if(analyser)analyser.disconnect()}catch(error){}
    analyser=null;
    frequencyData=null;
    floatFrequencyData=null;
    visualizerFrame=0;
  }

  function teardownCaptureTap(){
    try{if(captureSource)captureSource.disconnect()}catch(error){}
    captureSource=null;
    captureStream=null;
    try{if(analyser)analyser.disconnect()}catch(error){}
    analyser=null;
    frequencyData=null;
    floatFrequencyData=null;
    visualizerFrame=0;
  }

  function enterFallbackMode(){
    vizMode='fallback';
    analyserBroken=true;
    bars.forEach(function(bar){bar.classList.add('is-fallback')});
  }

  function setupCaptureAnalyser(){
    const AudioContextCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextCtor) return false;
    if(!audio.captureStream && !audio.mozCaptureStream) return false;
    try{
      if(!audioContext) audioContext=new AudioContextCtor();
      analyser=audioContext.createAnalyser();
      analyser.fftSize=1024;
      analyser.minDecibels=-100;
      analyser.maxDecibels=0;
      analyser.smoothingTimeConstant=0.55;
      frequencyData=new Uint8Array(analyser.frequencyBinCount);
      floatFrequencyData=new Float32Array(analyser.frequencyBinCount);
      captureStream=audio.captureStream?audio.captureStream():audio.mozCaptureStream();
      captureSource=audioContext.createMediaStreamSource(captureStream);
      captureSource.connect(analyser);
      vizMode='capture';
      silentFrames=0;
      vizLog('captureStream tap active');
      return true;
    }catch(error){
      vizLog('captureStream failed: '+(error&&error.message?error.message:String(error)));
      captureStream=null;
      captureSource=null;
      analyser=null;
      return false;
    }
  }

  function drawEqualizer(){
    if(vizMode==='ws'){visualizerFrame=0;return}
    if(!analyser || audio.paused){visualizerFrame=0;return}
    analyser.getByteFrequencyData(frequencyData);
    analyser.getFloatFrequencyData(floatFrequencyData);
    let bass=0;
    let lowBass=0;
    let mid=0;
    let treble=0;
    let bassEnergy=0;
    let midEnergy=0;
    let spectrumSum=0;
    const binWidth=audioContext.sampleRate/analyser.fftSize;
    for(let index=0;index<frequencyData.length;index++){
      const value=frequencyData[index]/255;
      spectrumSum+=frequencyData[index];
      const amplitude=Math.pow(10,floatFrequencyData[index]/20);
      const frequency=index*binWidth;
      if(frequency>=35&&frequency<180){
        bass+=value;
        bassEnergy+=amplitude*amplitude;
        if(frequency<120) lowBass+=value;
      }else if(frequency>=180&&frequency<2200){
        mid+=value;
        midEnergy+=value*value;
      }else if(frequency>=2200){
        treble+=value;
      }
    }
    const bassBandRms=Math.sqrt(bassEnergy/Math.max(1,Math.ceil(145/binWidth)));
    const bassDb=20*Math.log10(Math.max(0.00001,bassBandRms));
    const bassPosition=Math.max(0,Math.min(1,(bassDb+90)/90));
    const directBass=Math.max(0,Math.min(1,0.5+(bassPosition-0.5)*2.2));
    const signal=window.doomsdayAudioSignal;
    bass/=Math.max(1,Math.ceil(145/binWidth));
    lowBass/=Math.max(1,Math.ceil(85/binWidth));
    mid/=Math.max(1,Math.ceil(2020/binWidth));
    treble/=Math.max(1,frequencyData.length-Math.ceil(2200/binWidth));
    const rawLevel=Math.max(bass,mid,treble);
    const levelRise=Math.max(0,rawLevel-signal.level);
    signal.bass+=(directBass-signal.bass)*0.35;
    signal.lowBass=lowBass;
    signal.hardBass=signal.bass;
    signal.hardBassConfirmed=signal.hardBass >= fxHardBassOn;
    signal.mid+=(mid-signal.mid)*0.16;
    signal.treble+=(treble-signal.treble)*0.16;
    signal.level+=(rawLevel-signal.level)*0.32;
    signal.transient=Math.max(0,Math.min(1,levelRise/0.08));
    if(meydaFeatures){
      mid=meydaFeatures.mid;
      treble=meydaFeatures.treble;
      signal.mid=mid;
      signal.treble=treble;
      signal.level=meydaFeatures.level;
      signal.transient=meydaFeatures.transient;
    }
    signal.playing=true;
    /* Silence watchdog: some mobile browsers feed the analyser only zeros
       (or sub-audible dither) while the time-domain level still moves.
       Treat the spectrum as silent when its average bin value stays near
       zero, then fall back to the simulated visualizer. */
    const spectrumAvg=spectrumSum/frequencyData.length;
    if(spectrumAvg<2){
      silentFrames++;
      if(silentFrames===1||silentFrames%50===0)vizLog('['+vizMode+'] silent '+silentFrames+' avg:'+spectrumAvg.toFixed(2)+' ctx:'+audioContext.state);
      if(silentFrames>=150){
        if(vizMode==='element'){
          /* iOS WebKit routes cross-origin media elements silently through
             createMediaElementSource. The MediaStream-level tap (captureStream)
             is unaffected on many builds, so try it before simulating. */
          vizLog('element tap silent -> trying captureStream');
          teardownElementTap();
          if(setupCaptureAnalyser()){
            visualizerFrame=requestAnimationFrame(drawEqualizer);
            return;
          }
          enterFallbackMode();
          startFallbackSignal();
          return;
        }
        vizLog('['+vizMode+'] tap silent -> fallback');
        teardownCaptureTap();
        enterFallbackMode();
        startFallbackSignal();
        return;
      }
    }else{
      if(silentFrames>0)vizLog('['+vizMode+'] alive again after '+silentFrames+' frames, avg:'+spectrumAvg.toFixed(2));
      silentFrames=0;
    }
    vizFrameCount++;
    if(vizDebug && vizFrameCount%300===0)vizLog('['+vizMode+'] avg:'+spectrumAvg.toFixed(1)+' lvl:'+signal.level.toFixed(2)+' bass:'+signal.bass.toFixed(2)+' ctx:'+audioContext.state);
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
    if(vizMode==='ws') return;
    if(!isPlaying && audio.paused){
      stopFallbackSignal();
      return;
    }
    isPlaying=true;
    const signal=window.doomsdayAudioSignal;
    const pulse=0.24+Math.max(0,Math.sin(now*0.008))*0.28+Math.max(0,Math.sin(now*0.013+1.8))*0.16;
    signal.level+=(pulse-signal.level)*0.32;
    signal.playing=true;
    document.documentElement.style.setProperty('--audio-level',signal.level.toFixed(3));
    signal.bass+=(signal.level-signal.bass)*0.18;
    signal.mid+=(pulse*0.86-signal.mid)*0.18;
    signal.treble+=(pulse*0.62-signal.treble)*0.18;
    signal.lowBass=signal.bass;
    signal.hardBass=0;
    signal.hardBassConfirmed=false;
    signal.transient=Math.max(0,Math.min(1,(pulse-0.24)/0.44));
    document.documentElement.style.setProperty('--audio-bass',signal.bass.toFixed(3));
    document.documentElement.style.setProperty('--audio-mid',signal.mid.toFixed(3));
    document.documentElement.style.setProperty('--audio-treble',signal.treble.toFixed(3));
    /* Static noise follows treble x transient: sharp attacks read as signal
     * interference, sustained brightness stays calm. */
    if(noiseLayer){
      const noiseActivity=Math.max(0,Math.min(1,(signal.treble||0)*(signal.transient||0)*noiseBoost));
      noiseLayer.style.opacity=(noiseBaseline+noiseActivity*noiseMaxOpacity).toFixed(3);
    }
    updateSignalVisualization(signal);
    bars.forEach(function(bar,index){
      const profile=0.24+0.5*Math.abs(Math.sin(index*0.46+0.7));
      const travellingWave=0.18*Math.max(0,Math.sin(now*0.006-index*0.52));
      const level=Math.max(0.1,Math.min(1,signal.level*(profile+travellingWave)));
      bar.style.transform='scaleY('+level.toFixed(2)+')';
      bar.style.opacity=String(0.5+level*0.5);
    });
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
    /* Logo glow follows the transient (attacks), not the bass level. */
    const glowActivity=Math.max(0,Math.min(1,((signal.transient||0)-0.15)/0.85));
    const innerAlpha=(glowActivity*0.50).toFixed(2);
    const outerAlpha=(glowActivity*0.22).toFixed(2);
    const innerR=(glowActivity*15.0).toFixed(1)+'px';
    const outerR=(glowActivity*36.0).toFixed(1)+'px';

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
    /* Static noise follows treble x transient: sharp attacks read as signal
     * interference, sustained brightness stays calm. */
    if(noiseLayer){
      const noiseActivity=Math.max(0,Math.min(1,(signal.treble||0)*(signal.transient||0)*noiseBoost));
      noiseLayer.style.opacity=(noiseBaseline+noiseActivity*noiseMaxOpacity).toFixed(3);
    }
    const bassPercent=Math.round(Math.max(0,Math.min(1,signal.bass))*100);
    bassDebugReadout.textContent=String(bassPercent).padStart(2,'0')+'%';
    bassDebugFill.style.width=bassPercent+'%';
    const hardBassPercent=Math.round(Math.max(0,Math.min(1,signal.hardBass||0))*100);
    bassDebugHardReadout.textContent=String(hardBassPercent).padStart(2,'0')+'% / '+Math.round(fxHardBassOn*100)+'%';
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
    if(!analyser && audio && !audio.paused){
      isPlaying=true;
      startFallbackSignal();
      return;
    }
    if(isPlaying && (analyser || fallbackFrame)) return;
    const level=baseSignalLevel;
    const bass=0;
    const mid=0.6;
    const treble=0.45;
    window.doomsdayAudioSignal={
      bass:bass,
      mid:mid,
      treble:treble,
      level:level,
      transient:0,
      hardBass:0,
      hardBassConfirmed:false,
      playing:false
    };
    document.documentElement.style.setProperty('--audio-level',level.toFixed(3));
    updateSignalVisualization(window.doomsdayAudioSignal);
  }

  setInterval(updateAmbientMeter,85);
  updateAmbientMeter();

  function setActive(isActive){
    player.classList.toggle('is-playing',isActive);
    if(toggle){
      toggle.classList.toggle('is-active',isActive);
      toggle.setAttribute('aria-label',isActive?'Livestream pausieren':'Livestream abspielen');
      toggle.setAttribute('aria-pressed',String(isActive));
      toggle.title=isActive?'Livestream pausieren':'Livestream abspielen';
    }
    if(btnIcon) btnIcon.textContent=isActive?'❚❚':'▶';
  }

  async function playStream(){
    hasStarted=true;
    status.textContent='VERBINDE...';
    setActive(true);
    toggle.disabled=true;
    try{
      if(canAnalyzeAudio && !analyserBroken){
        ensureWebSocketViz();
        try{setupAnalyser()}catch(error){
          analyser=null;frequencyData=null;floatFrequencyData=null;
          vizLog('setup FAILED: '+(error&&error.message?error.message:String(error)));
        }
      }
      if(audioContext && audioContext.state==='suspended') await audioContext.resume();
      vizLog('play ctx:'+(audioContext?audioContext.state:'none')+' analyser:'+!!analyser+' meyda:'+!!meydaAnalyzer);
      if(meydaAnalyzer){try{meydaAnalyzer.start()}catch(error){meydaAnalyzer=null}}
      silentFrames=0;
      isPlaying=true;
      if(!analyser) startFallbackSignal();
      await audio.play();
      if(analyser && !visualizerFrame) visualizerFrame=requestAnimationFrame(drawEqualizer);
    }catch(error){
      isPlaying=false;
      stopFallbackSignal();
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
    if(outputGain) outputGain.gain.value=Number(volume.value);
    else audio.volume=Number(volume.value);
  });

  audio.addEventListener('playing',function(){
    hasStarted=true;
    isPlaying=true;
    setActive(true);
    status.textContent='ON AIR';
    /* iOS Safari keeps the AudioContext suspended even after a user gesture;
       resume it whenever playback actually starts. */
    if(audioContext && audioContext.state==='suspended'){audioContext.resume().catch(function(){})}
    if(analyser && !visualizerFrame){silentFrames=0;visualizerFrame=requestAnimationFrame(drawEqualizer)}
    if(!analyser) startFallbackSignal();
  });

  audio.addEventListener('pause',function(){
    isPlaying=false;
    if(meydaAnalyzer) meydaAnalyzer.stop();
    meydaFeatures=null;
    previousMeydaRms=0;
    stopFallbackSignal();
    if(noiseLayer) noiseLayer.style.opacity=String(noiseBaseline);
    window.doomsdayAudioSignal.playing=false;
    updateAmbientMeter();
    setActive(false);
    status.textContent=hasStarted?'SIGNAL PAUSIERT':'SIGNAL BEREIT';
  });

  audio.addEventListener('waiting',function(){status.textContent='PUFFERE SIGNAL...'});
  audio.addEventListener('error',function(){
    if(meydaAnalyzer) meydaAnalyzer.stop();
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

/* dynamic station slogans */
(function(){
  const sloganEl=document.getElementById('station-slogan');
  if(!sloganEl) return;

  const slogans=[
    'Eine Welt, die sich über Radio vermittelt, ordnet und erinnert.',
    'Wir berichten, selbst wenn keiner mehr zuhört.',
    'Das ewige Signal, das nicht verstummt.',
    'Wer zuhört, lebt noch.',
    'Aus der Asche der alten Welt – live auf 107.END.',
    'Der letzte Kontaktpunkt der Menschheit.',
    'Sendet auch, wenn alles andere schweigt.',
    'Die Wasteland hat viele Stimmen. Wir haben die Frequenz.',
    'Zwischen Rauschen und Ruinen: Dein Update aus dem Nichts.'
  ];

  let currentIndex=0;

  function cycle(){
    currentIndex=(currentIndex+1)%slogans.length;
    sloganEl.classList.add('is-transitioning');
    setTimeout(function(){
      sloganEl.textContent=slogans[currentIndex];
      sloganEl.classList.remove('is-transitioning');
    },360);
  }

  window.cycleStationSlogan=cycle;
  setInterval(cycle,7500);
})();
