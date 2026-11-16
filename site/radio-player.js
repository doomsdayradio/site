const audio=document.getElementById('radio-stream');
const playToggle=document.getElementById('play-toggle');
const muteToggle=document.getElementById('mute-toggle');
const volume=document.getElementById('volume');
const status=document.getElementById('player-status');
const trackTitle=document.getElementById('track-title');
const canvas=document.getElementById('beat-visualizer');
const context=canvas.getContext('2d');
let previousVolume=0.8;
let analyser=null;
let frequencyData=null;
let frameId=0;

function setPlaying(isPlaying){
  playToggle.textContent=isPlaying?'■':'▶';
  playToggle.classList.toggle('is-active',isPlaying);
  playToggle.setAttribute('aria-pressed',String(isPlaying));
  playToggle.setAttribute('aria-label',isPlaying?'Livestream pausieren':'Livestream abspielen');
  status.textContent=isPlaying?'ON AIR':'SIGNAL BEREIT';
}

function drawVisualizer(){
  const width=canvas.width;
  const height=canvas.height;
  context.clearRect(0,0,width,height);
  context.strokeStyle='rgba(209,255,69,.22)';
  context.beginPath();
  context.moveTo(0,height-8);
  context.lineTo(width,height-8);
  context.stroke();
  const bars=12;
  const gap=3;
  const barWidth=(width-gap*(bars-1))/bars;
  for(let index=0;index<bars;index+=1){
    const source=frequencyData?frequencyData[Math.floor(index*frequencyData.length/bars)]:0;
    const fallback=audio.paused?0:8+Math.abs(Math.sin(performance.now()/180+index))*12;
    const barHeight=Math.max(2,(source/255)*38,fallback);
    context.fillStyle=index%3===0?'#f36c04':'#d1ff45';
    context.globalAlpha=.45+(barHeight/48)*.55;
    context.fillRect(index*(barWidth+gap),height-9-barHeight,barWidth,barHeight);
  }
  context.globalAlpha=1;
  frameId=requestAnimationFrame(drawVisualizer);
}

function setupAnalyser(){
  try{
    const AudioContextCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextCtor) return;
    const audioContext=new AudioContextCtor();
    const source=audioContext.createMediaElementSource(audio);
    analyser=audioContext.createAnalyser();
    analyser.fftSize=64;
    frequencyData=new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    window.addEventListener('click',()=>audioContext.resume(),{once:true});
  }catch(error){
    analyser=null;
    frequencyData=null;
  }
}

playToggle.addEventListener('click',async()=>{
  if(audio.paused){
    if(!analyser) setupAnalyser();
    try{
      await audio.play();
      if(!frameId) frameId=requestAnimationFrame(drawVisualizer);
    }catch(error){
      status.textContent='SIGNAL NICHT ERREICHBAR';
    }
  }else{
    audio.pause();
  }
});

audio.addEventListener('playing',()=>setPlaying(true));
audio.addEventListener('pause',()=>setPlaying(false));
audio.addEventListener('waiting',()=>{status.textContent='PUFFERE SIGNAL...'});
audio.addEventListener('error',()=>{setPlaying(false);status.textContent='SIGNAL NICHT ERREICHBAR'});

volume.addEventListener('input',()=>{
  audio.volume=Number(volume.value);
  if(audio.volume>0) previousVolume=audio.volume;
  muteToggle.textContent=audio.volume?'🔊':'🔇';
});
muteToggle.addEventListener('click',()=>{
  if(audio.volume>0){previousVolume=audio.volume;audio.volume=0;volume.value='0';muteToggle.textContent='🔇'}
  else{audio.volume=previousVolume;volume.value=String(previousVolume);muteToggle.textContent='🔊'}
});

async function refreshTrackTitle(){
  try{
    const response=await fetch('https://stream.doomsday.radio/status-json.xsl',{cache:'no-store'});
    if(!response.ok) return;
    const payload=await response.json();
    const sources=payload?.icestats?.source;
    const source=Array.isArray(sources)?sources[0]:sources;
    if(!source) return;
    const title=String(source.title||'').trim();
    const artist=String(source.artist||'').trim();
    trackTitle.textContent=artist&&title?`${artist} // ${title}`:title||artist||'TRACK // SIGNAL BEREIT';
  }catch(error){}
}
refreshTrackTitle();
window.setInterval(refreshTrackTitle,15000);
setPlaying(false);
