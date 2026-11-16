(function(){
  if(document.querySelector('.radio-topbar')) return;
  const stylesheet=document.createElement('link');
  stylesheet.rel='stylesheet';
  stylesheet.href='/radio-topbar.css?v=20260919-player1';
  document.head.appendChild(stylesheet);
  const topbar=document.createElement('header');
  topbar.className='radio-topbar';
  topbar.innerHTML='<a href="/" aria-label="Doomsday Radio Startseite"><img src="/ddd_radio_logo.png" alt="Doomsday Radio"></a><nav aria-label="Doomsday Radio Navigation"><a href="/lore/">Lore</a><a href="/archiv/">Archiv</a><a href="/signaldecoder/">Spiele</a><a href="/map">Karte</a><a class="radio-player-button" href="/radio-player.html" target="doomsday-radio-player">PLAYER</a></nav>';
  document.body.prepend(topbar);
})();
