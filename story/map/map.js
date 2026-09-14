const layoutUrl = "./layout.json";
const asciiMapUrl = "./map.txt";

const svg = document.getElementById("vector-map");
const mapFrame = document.querySelector(".map-frame");
const crtCanvas = document.getElementById("map-crt");
const map3dRoot = document.getElementById("map-3d");
const mapClipRect = document.getElementById("map-clip-rect");
const coordCursor = document.getElementById("coord-cursor");
const baseRasterLayer = document.getElementById("base-raster-layer");
const baseViewport = document.getElementById("base-viewport");
const viewport = document.getElementById("viewport");
const terrainLayer = document.getElementById("base-terrain-layer");
const terrainShadowLayer = document.getElementById("base-terrain-shadow-layer");
const elevationLayer = document.getElementById("elevation-layer");
const populationLayer = document.getElementById("population-layer");
const influenceLayer = document.getElementById("influence-layer");
const routeLayer = document.getElementById("route-layer");
const coordLayer = document.getElementById("base-coord-layer");
const weatherLayer = document.getElementById("weather-layer");
const cloudShadowLayer = document.getElementById("cloud-shadow-layer");
const cloudLayer = document.getElementById("cloud-layer");
const poiLayer = document.getElementById("poi-layer");
const labelLayer = document.getElementById("label-layer");
const gridLayer = document.getElementById("grid-layer");
const legendRoot = document.getElementById("terrain-legend");
const influenceLegendRoot = document.getElementById("influence-legend");
const elevationLegendRoot = document.getElementById("elevation-legend");
const populationLegendRoot = document.getElementById("population-legend");
const selectionCard = document.getElementById("selection-card");
const svgDefs = svg.querySelector("defs");
const poiPopup = document.getElementById("poi-popup");
const poiPopupTitle = document.getElementById("poi-popup-title");
const poiPopupImage = document.getElementById("poi-popup-image");
const poiPopupNote = document.getElementById("poi-popup-note");
const poiPopupLink = document.getElementById("poi-popup-link");
const poiPopupClose = document.getElementById("poi-popup-close");
const appShell = document.querySelector(".app-shell");
const openPanelButton = document.getElementById("mobile-open-panel");
const closePanelButton = document.getElementById("mobile-close-panel");

const TERRAIN_STYLES = {
  ":": {name: "Staubebene / offenes Ödland", fill: "#d7c7a4", pattern: "hatch-dust"},
  ".": {name: "Übergangsland / Schuttrand", fill: "#e4d9c0", pattern: "hatch-transition"},
  I: {name: "Industrie- und Schrottkern", fill: "#8f7a66", pattern: "hatch-industrial"},
  H: {name: "Hafen-/Schlickzone", fill: "#7b9389", pattern: "hatch-harbor"},
  R: {name: "ritualisierte Stack-/Ordensräume", fill: "#b59681", pattern: "hatch-ritual"},
  V: {name: "Glas-, Spiegel- und Konsumruinen", fill: "#bfd9cf", pattern: "hatch-glass"},
  E: {name: "Strom-, Kabel- und Leitbiotope", fill: "#92c3a6", pattern: "hatch-electric"},
  G: {name: "toxische Feucht- und Pilzbecken", fill: "#90a66d", pattern: "hatch-fungal"},
  W: {name: "Wald- und Revierzonen", fill: "#6f8260", pattern: "hatch-forest"},
  O: {name: "Arena-/Schrottpisten", fill: "#d0a166", pattern: "hatch-arena"},
  A: {name: "Asche- und Schlackenfelder", fill: "#b8aa93", pattern: "hatch-ash"},
  C: {name: "Kälte-/Nebelzone", fill: "#d4dde2", pattern: "hatch-cold"},
  S: {name: "Sturmbecken", fill: "#97a8b7", pattern: "hatch-storm"},
  T: {name: "Transit-/Korridorräume", fill: "#b7afa4", pattern: "hatch-transit"},
  "=": {name: "Hauptrouten / Handelsachsen", fill: "#d7c7a4", pattern: "hatch-dust"}
};

const INFLUENCE_STYLES = {
  "@": {name: "Der Stack", description: "Stack-nahe Kontrolle", fill: "#6c1e25", stroke: "#6c1e25", shield: "#5d151b", banner: "/lore/Gruppen/DerStack/der-stack-banner.png"},
  "$": {name: "Zeros", description: "Zero-Einfluss / Logistik", fill: "#3f6f68", stroke: "#3f6f68", shield: "#2e5b56", banner: "/lore/Gruppen/Zeros/zeros-banner.png"},
  d: {name: "Doomsday Dispatcher", description: "Maker-Sendernetz / Dispatcher-Kult", fill: "#476fa7", stroke: "#476fa7", shield: "#335681", banner: "/lore/Gruppen/Maker/doomsday-dispatcher-banner.png"},
  s: {name: "Steampunks", description: "Maker-Handwerk / Dampf- und Messingkern", fill: "#6080b3", stroke: "#6080b3", shield: "#436291", banner: "/lore/Gruppen/Maker/steampunks-banner.png"},
  m: {name: "Magier", description: "Maker-Ritualtechnik / Chaos-Kapelle", fill: "#7b61a8", stroke: "#7b61a8", shield: "#5d4787", banner: "/lore/Gruppen/Maker/magier-banner.png"},
  l: {name: "Letzte Migration", description: "Ordens-Kern / Pilger- und Deutungsraum", fill: "#98795a", stroke: "#98795a", shield: "#7a5f45", banner: "/lore/Gruppen/Orden/letzte-migration-banner.png"},
  o: {name: "Looper", description: "Ordens-Knoten / Nullpunkt-Linien", fill: "#ac8b61", stroke: "#ac8b61", shield: "#8d704d", banner: "/lore/Gruppen/Orden/looper-banner.png"},
  r: {name: "Retros", description: "Ordens-Archivraum / alte Signale", fill: "#c3a07a", stroke: "#c3a07a", shield: "#9f7f5e", banner: "/lore/Gruppen/Orden/retros-banner.png"},
  h: {name: "Hillbillys", description: "Roamer-Rand / sumpfige Reviere", fill: "#5b754c", stroke: "#5b754c", shield: "#49603d", banner: "/lore/Gruppen/Roamer/hillbillys-banner.png"},
  k: {name: "Hardliner", description: "Roamer-Härtezone / Ödlandkanten", fill: "#6b854f", stroke: "#6b854f", shield: "#55693f", banner: "/lore/Gruppen/Roamer/hardliner-banner.png"},
  g: {name: "Geocacher", description: "Roamer-Knoten / Koordinatenkreuz", fill: "#7e9863", stroke: "#7e9863", shield: "#657b4f", banner: "/lore/Gruppen/Roamer/geocacher-banner.png"}
};

const INFLUENCE_FACTIONS = Object.entries(INFLUENCE_STYLES).map(([char, style]) => ({id: char, char, ...style}));

const ELEVATION_STYLES = {
  "0": {name: "Sohle / tiefe Senke", fill: "#efe4cf", stroke: "#d9c8a4"},
  "1": {name: "Flachland", fill: "#e2d4b8", stroke: "#cab691"},
  "2": {name: "Staubplateau", fill: "#cfbb95", stroke: "#b59d74"},
  "3": {name: "Huegelzone", fill: "#ba9e72", stroke: "#9b7f58"},
  "4": {name: "Kamm", fill: "#a28057", stroke: "#7f6241"},
  "5": {name: "Ruecken", fill: "#896746", stroke: "#674b32"},
  "6": {name: "Grat", fill: "#724f35", stroke: "#553924"},
  "7": {name: "Hochbruch", fill: "#5a3b28", stroke: "#3f281c"},
  "8": {name: "Zahn / Hochpunkt", fill: "#432a1d", stroke: "#28170f"},
  "9": {name: "Kuppe / Spitze", fill: "#2c1a13", stroke: "#140a07"}
};

const POPULATION_STYLES = {
  "0": {name: "unbesiedelt / Durchgangsraum", fill: "#f1eadb", stroke: "#d4c3a7"},
  "1": {name: "Lokale Herrschaft / 500-2.000", fill: "#e5c98e", stroke: "#b48848"},
  "2": {name: "Kleine Region / Stamm / 2.000-10.000", fill: "#d99859", stroke: "#9a5825"},
  "3": {name: "Kleines Territorium / 10.000-50.000+", fill: "#9f4a39", stroke: "#6b2a20"}
};

const POI_COLORS = {
  trade: "#be5e28",
  zone: "#5b4633",
  faction: "#7f2f35"
};

const POI_TYPE_ICONS = {
  trade: "\uf54f",
  zone: "\uf3c5",
  faction: "\uf024"
};

const POI_NAME_ICONS = {
  "Retros / Archivraum": "\uf187",
  "Doomsday Fanshop": "\uf07a",
  "Pilgerrast": "\uf647",
  Archivkuppe: "\uf1c0",
  "Messingmarkt 9": "\uf51e",
  "Frostwerk 9": "\uf7ad",
  "Die Orgel": "\uf275",
  "Chaos-Kapelle": "\uf6a1",
  "Der Hafen": "\uf21a",
  Gerichtskirche: "\uf51d",
  "Nullbahn-Korridor": "\uf238",
  "Leithive-Kern": "\uf0e7",
  Nullpunkt: "\uf3c5",
  Bleigarten: "\uf4d8",
  "Koordinaten-Kreuz": "\uf14e",
  "Low-Tech-Basar": "\uf290",
  Aschering: "\uf2dc",
  "Schacht 47": "\uf1b3",
  "Konsumschlund-Arkaden": "\uf07a",
  "Glasfeld-Delta": "\uf3a5",
  "The Shop": "\uf54f",
  Glaspforte: "\uf52a",
  Aschepuls: "\uf06d",
  Kabelwald: "\uf1e6",
  Waldgebiete: "\uf1bb",
  Dornacker: "\uf4d8",
  "Grünbrand-Senke": "\uf043",
  "Ödlandarena": "\uf434",
  "Kaliber 50": "\uf135",
  "Sumpf-Festung": "\uf3ed",
  Spiegelschlucht: "\uf2dc",
  Sturmtrog: "\uf0e7"
};

const POI_LORE_LINKS = {
  "Retros / Archivraum": "/lore/Gruppen/Orden/retros.html",
  "Doomsday Fanshop": "/lore/Orte/Handelsposten/Doomsday-Fanshop.html",
  Pilgerrast: "/lore/Orte/Handelsposten/Pilgerrast.html",
  Archivkuppe: "/lore/Orte/Zonen/Archivkuppe.html",
  "Messingmarkt 9": "/lore/Orte/Handelsposten/Messingmarkt-9.html",
  "Frostwerk 9": "/lore/Orte/Zonen/Frostwerk-9.html",
  "Die Orgel": "/lore/Orte/Zonen/Die-Orgel.html",
  "Chaos-Kapelle": "/lore/Orte/Handelsposten/Chaos-Kapelle.html",
  "Der Hafen": "/lore/Orte/Zonen/Der-Hafen.html",
  Gerichtskirche: "/lore/Orte/Zonen/Gerichtskirche.html",
  "Nullbahn-Korridor": "/lore/Orte/Zonen/Nullbahn-Korridor.html",
  "Leithive-Kern": "/lore/Orte/Zonen/Leithive-Kern.html",
  Nullpunkt: "/lore/Orte/Handelsposten/Nullpunkt.html",
  Bleigarten: "/lore/Orte/Zonen/Bleigarten.html",
  "Koordinaten-Kreuz": "/lore/Orte/Handelsposten/Koordinaten-Kreuz.html",
  "Low-Tech-Basar": "/lore/Orte/Handelsposten/Low-Tech-Basar.html",
  Aschering: "/lore/Orte/Zonen/Aschering.html",
  "Schacht 47": "/lore/Orte/Zonen/Schacht-47.html",
  "Konsumschlund-Arkaden": "/lore/Orte/Zonen/Konsumschlund-Arkaden.html",
  "Glasfeld-Delta": "/lore/Orte/Zonen/Glasfeld-Delta.html",
  "The Shop": "/lore/Orte/Handelsposten/The-Shop.html",
  Glaspforte: "/lore/Orte/Handelsposten/Glaspforte.html",
  Aschepuls: "/lore/Orte/Zonen/Aschepuls.html",
  Kabelwald: "/lore/Orte/Zonen/Kabelwald.html",
  Waldgebiete: "/lore/Orte/Zonen/Waldgebiete.html",
  Dornacker: "/lore/Orte/Zonen/Dornacker.html",
  "Grünbrand-Senke": "/lore/Orte/Zonen/Gruenbrand-Senke.html",
  "Ödlandarena": "/lore/Orte/Zonen/Oedlandarena.html",
  "Kaliber 50": "/lore/Orte/Handelsposten/Kaliber-50.html",
  "Sumpf-Festung": "/lore/Orte/Handelsposten/Sumpf-Festung.html",
  Spiegelschlucht: "/lore/Orte/Zonen/Spiegelschlucht.html",
  Sturmtrog: "/lore/Orte/Zonen/Sturmtrog.html"
};

const TERRAIN_WEATHER = {
  ":": {pattern: "weather-dust", className: "weather-dust", opacity: 0.42},
  ".": {pattern: "weather-dust", className: "weather-dust", opacity: 0.28},
  H: {pattern: "weather-fog", className: "weather-harbor", opacity: 0.36},
  G: {pattern: "weather-toxic", className: "weather-toxic", opacity: 0.34},
  C: {pattern: "weather-fog", className: "weather-fog", opacity: 0.42},
  S: {pattern: "weather-storm", className: "weather-storm", opacity: 0.34},
  A: {pattern: "weather-ash", className: "weather-ash", opacity: 0.34},
  I: {pattern: "weather-ash", className: "weather-industrial", opacity: 0.22},
  E: {pattern: "weather-electric", className: "weather-electric", opacity: 0.28},
  V: {pattern: "weather-glass", className: "weather-glass", opacity: 0.22},
  O: {pattern: "weather-ash", className: "weather-ash", opacity: 0.18}
};

const state = {
  layout: null,
  terrainTransitions: new Map(),
  cellSize: 14,
  margin: 54,
  viewBox: null,
  panStart: null,
  originViewBox: null,
  activePointers: new Map(),
  pinchStartDistance: null,
  pinchOriginViewBox: null,
  pinchFocusClient: null,
  movedDuringPan: false,
  suppressClickUntil: 0,
  hoveredLegendChar: null,
  hoveredInfluenceKey: null,
  pinnedInfluenceKey: null,
  hoveredElevationChar: null,
  hoveredPopulationChar: null,
  viewMode: "map"
};

const CRT_VERT = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos,0.0,1.0);} `;

const CRT_FRAG = `#ifdef GL_ES
precision mediump float;
#endif
uniform vec2  u_res;
uniform float u_time;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  float a=hash(i), b=hash(i+vec2(1.0,0.0)), c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
}
float onOff(float a, float b, float c){ return step(c, sin(u_time + a*cos(u_time*b))); }
float ramp(float y, float start, float end){
  float inside = step(start,y) - step(end,y);
  float fact = (y-start)/(end-start)*inside;
  return (1.0 - fact) * inside;
}
vec2 iso(vec2 frag){
  vec2 uv = frag / u_res;
  uv = uv*2.0 - 1.0;
  uv.x *= u_res.x / u_res.y;
  return uv;
}
float stripes(vec2 uv){
  float noi = noise(uv*vec2(0.5,1.0) + vec2(1.0,3.0));
  float s = ramp(mod(uv.y*4.0 + u_time/2.0 + sin(u_time + sin(u_time*0.63)), 1.0), 0.5, 0.6) * noi;
  return s;
}
vec2 screenDistort(vec2 uv){
  uv -= vec2(0.5);
  uv = uv*1.2*(1.0/1.2 + 2.0*uv.x*uv.x*uv.y*uv.y);
  uv += vec2(0.5);
  return uv;
}
vec3 getVideo(vec2 uv){
  vec2 look = uv;
  float window = 1.0 / (1.0 + 20.0 * pow(look.y - mod(u_time/4.0, 1.0), 2.0));
  look.x += sin(look.y*10.0 + u_time)/50.0 * onOff(4.0,4.0,0.3) * (1.0 + cos(u_time*80.0)) * window;
  float vShift = 0.4 * onOff(2.0,3.0,0.9) *
                 (sin(u_time)*sin(u_time*20.0) + (0.5 + 0.1*sin(u_time*200.0)*cos(u_time)));
  look.y = fract(look.y + vShift);
  float bands = 0.5 + 0.5*sin(look.y*80.0 + u_time*6.0);
  float xmod  = 0.5 + 0.5*sin(look.x*30.0 + u_time*3.0);
  vec3 video  = vec3(mix(0.25, 0.9, bands * xmod));
  video = mix(video, vec3(0.86,0.73,0.53), 0.65);
  return video;
}
void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / u_res;
  uv = screenDistort(uv);
  vec3 video = getVideo(uv);
  float vigAmt = 3.0 + 0.3*sin(u_time + 5.0*cos(u_time*5.0));
  float dx = uv.x - 0.5, dy = uv.y - 0.5;
  float vignette = (1.0 - vigAmt*dy*dy) * (1.0 - vigAmt*dx*dx);
  vignette = clamp(vignette, 0.0, 1.0);
  video += stripes(uv);
  video += noise(iso(frag)*2.0)/2.0;
  video *= vignette;
  video *= (12.0 + mod(uv.y*30.0 + u_time, 1.0)) / 13.0;
  gl_FragColor = vec4(video, 1.0);
}`;

let crtGl;
let crtProgram;
let crtBuffer;
let crtUTime;
let crtURes;
let crtStartTime = 0;
let crtAnimationId = 0;
let threeRenderer;
let threeScene;
let threeCamera;
let threeControls;
let threeTerrainMesh;
let threeGroundMesh;
let threeSkirtMesh;
let threeBaseMesh;
let threePoiGroup;
let threeForestGroup;
let threePropGroup;
let threeLandmarkGroup;
let threeFrameId = 0;
let threeTextureBuildId = 0;
let poiLabelSizingFrame = 0;
let lastPoiLabelScale = 0;
let initialPreferencesApplied = false;

init().catch(error => {
  console.error(error);
  selectionCard.innerHTML = `<strong>Fehler</strong><p>${error.message}</p>`;
});

async function init() {
  bindControls();
  syncResponsiveUi();
  populateLegend();
  populateInfluenceLegend();
  populateElevationLegend();
  populatePopulationLegend();

  const [layoutResponse, asciiMapResponse] = await Promise.all([
    fetch(layoutUrl, {cache: "no-store"}),
    fetch(asciiMapUrl, {cache: "no-store"})
  ]);
  if (!layoutResponse.ok) throw new Error(`Layout-Datei konnte nicht geladen werden (${layoutResponse.status})`);
  if (!asciiMapResponse.ok) throw new Error(`ASCII-Karte konnte nicht geladen werden (${asciiMapResponse.status})`);
  state.layout = await layoutResponse.json();
  state.terrainTransitions = parseAsciiTerrainTransitions(await asciiMapResponse.text());

  ensureGrid("terrain_grid", ":");
  ensureGrid("influence_grid", ".");
  ensureGrid("elevation_grid", "2");
  ensureGrid("population_grid", "0");
  applyInitialPreferences();
  renderMap();
  fitView();
}

function initCrtShader() {
  if (!crtCanvas) return;
  crtGl = crtCanvas.getContext("webgl", {antialias: false, preserveDrawingBuffer: false});
  if (!crtGl) return;

  crtBuffer = crtGl.createBuffer();
  crtGl.bindBuffer(crtGl.ARRAY_BUFFER, crtBuffer);
  crtGl.bufferData(crtGl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), crtGl.STATIC_DRAW);

  crtProgram = createCrtProgram(CRT_VERT, CRT_FRAG);
  crtGl.useProgram(crtProgram);
  const loc = crtGl.getAttribLocation(crtProgram, "a_pos");
  crtGl.enableVertexAttribArray(loc);
  crtGl.bindBuffer(crtGl.ARRAY_BUFFER, crtBuffer);
  crtGl.vertexAttribPointer(loc, 2, crtGl.FLOAT, false, 0, 0);
  crtUTime = crtGl.getUniformLocation(crtProgram, "u_time");
  crtURes = crtGl.getUniformLocation(crtProgram, "u_res");
  crtStartTime = performance.now();
  resizeCrtShader();
  updateCrtVisibility();
  if (crtAnimationId) cancelAnimationFrame(crtAnimationId);
  tickCrtShader();
  window.addEventListener("resize", resizeCrtShader);
}

function createCrtShader(type, source) {
  const shader = crtGl.createShader(type);
  crtGl.shaderSource(shader, source);
  crtGl.compileShader(shader);
  if (!crtGl.getShaderParameter(shader, crtGl.COMPILE_STATUS)) {
    throw new Error(crtGl.getShaderInfoLog(shader) || "CRT shader compile error");
  }
  return shader;
}

function createCrtProgram(vsSource, fsSource) {
  const vs = createCrtShader(crtGl.VERTEX_SHADER, vsSource);
  const fs = createCrtShader(crtGl.FRAGMENT_SHADER, fsSource);
  const program = crtGl.createProgram();
  crtGl.attachShader(program, vs);
  crtGl.attachShader(program, fs);
  crtGl.linkProgram(program);
  if (!crtGl.getProgramParameter(program, crtGl.LINK_STATUS)) {
    throw new Error(crtGl.getProgramInfoLog(program) || "CRT program link error");
  }
  return program;
}

function resizeCrtShader() {
  if (!crtGl || !crtCanvas || !crtURes) return;
  const rect = crtCanvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (crtCanvas.width !== width || crtCanvas.height !== height) {
    crtCanvas.width = width;
    crtCanvas.height = height;
  }
  crtGl.viewport(0, 0, width, height);
  crtGl.uniform2f(crtURes, width, height);
}

function tickCrtShader() {
  if (!crtGl || !crtProgram) return;
  if (!isCrtEnabled()) {
    crtAnimationId = requestAnimationFrame(tickCrtShader);
    return;
  }
  resizeCrtShader();
  const t = (performance.now() - crtStartTime) / 1000;
  crtGl.uniform1f(crtUTime, t);
  crtGl.drawArrays(crtGl.TRIANGLES, 0, 3);
  crtAnimationId = requestAnimationFrame(tickCrtShader);
}

function bindControls() {
  document.getElementById("toggle-influence").addEventListener("change", renderMap);
  document.getElementById("toggle-elevation").addEventListener("change", renderMap);
  document.getElementById("toggle-routes").addEventListener("change", renderMap);
  document.getElementById("toggle-pois").addEventListener("change", renderMap);
  document.getElementById("toggle-weather").addEventListener("change", renderMap);
  document.getElementById("toggle-clouds").addEventListener("change", renderMap);
  document.getElementById("toggle-grid").addEventListener("change", renderMap);
  document.getElementById("view-map").addEventListener("click", () => setViewMode("map"));
  document.getElementById("view-influence").addEventListener("click", () => setViewMode("influence"));
  document.getElementById("view-elevation").addEventListener("click", () => setViewMode("elevation"));
  document.getElementById("view-population").addEventListener("click", () => setViewMode("population"));
  document.getElementById("fit-view").addEventListener("click", fitView);
  document.getElementById("zoom-in").addEventListener("click", () => zoomAt(0.85));
  document.getElementById("zoom-out").addEventListener("click", () => zoomAt(1.18));
  if (poiPopupClose) poiPopupClose.addEventListener("click", hidePoiPopup);
  if (openPanelButton) openPanelButton.addEventListener("click", () => setPanelOpen(true));
  if (closePanelButton) closePanelButton.addEventListener("click", () => setPanelOpen(false));
  window.addEventListener("resize", syncResponsiveUi);
  if (mapFrame) mapFrame.addEventListener("pointerdown", event => {
    if (!poiPopup || poiPopup.classList.contains("is-hidden")) return;
    if (poiPopup.contains(event.target)) return;
    hidePoiPopup();
  });

  svg.addEventListener("wheel", event => {
    event.preventDefault();
    zoomAt(event.deltaY < 0 ? 0.88 : 1.14, event.offsetX, event.offsetY);
  });

  svg.addEventListener("pointerdown", event => {
    state.activePointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (isMobileViewport()) setPanelOpen(false);
    if (state.activePointers.size === 2) {
      initializePinchState();
      state.panStart = null;
      state.originViewBox = null;
      state.movedDuringPan = false;
      svg.classList.remove("dragging");
      return;
    }
    state.panStart = {x: event.clientX, y: event.clientY};
    state.originViewBox = {...state.viewBox};
    state.movedDuringPan = false;
  });

  svg.addEventListener("pointermove", event => {
    if (state.activePointers.has(event.pointerId)) {
      state.activePointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    }
    updateCursorCoordinates(event);
    if (state.activePointers.size >= 2 && state.pinchOriginViewBox) {
      applyPinchZoom();
      return;
    }
    if (!state.panStart || !state.originViewBox) return;
    const bounds = svg.getBoundingClientRect();
    const dx = (event.clientX - state.panStart.x) * (state.originViewBox.width / bounds.width);
    const dy = (event.clientY - state.panStart.y) * (state.originViewBox.height / bounds.height);
    if (Math.abs(event.clientX - state.panStart.x) > 4 || Math.abs(event.clientY - state.panStart.y) > 4) {
      if (!state.movedDuringPan) {
        state.movedDuringPan = true;
        svg.classList.add("dragging");
        svg.setPointerCapture(event.pointerId);
      }
    }
    if (!state.movedDuringPan) return;
    setViewBox({
      x: state.originViewBox.x - dx,
      y: state.originViewBox.y - dy,
      width: state.originViewBox.width,
      height: state.originViewBox.height
    });
  });

  const endPan = event => {
    state.activePointers.delete(event.pointerId);
    if (state.activePointers.size < 2) {
      state.pinchStartDistance = null;
      state.pinchOriginViewBox = null;
      state.pinchFocusClient = null;
    }
    svg.classList.remove("dragging");
    if (state.movedDuringPan) state.suppressClickUntil = Date.now() + 180;
    state.panStart = null;
    state.originViewBox = null;
    state.movedDuringPan = false;
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
  };

  svg.addEventListener("pointerup", endPan);
  svg.addEventListener("pointercancel", endPan);
  svg.addEventListener("pointerleave", () => {
    if (coordCursor) coordCursor.classList.remove("is-visible");
  });
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 1080px)").matches;
}

function isSafariBrowser() {
  const ua = navigator.userAgent;
  return /Safari\//.test(ua) && !/Chrome\/|Chromium\/|CriOS\/|FxiOS\/|EdgiOS\/|OPiOS\/|Android/.test(ua);
}

function applyInitialPreferences() {
  if (initialPreferencesApplied) return;
  initialPreferencesApplied = true;
  const weatherToggle = document.getElementById("toggle-weather");
  if (weatherToggle && isSafariBrowser()) weatherToggle.checked = false;
}

function setPanelOpen(open) {
  if (appShell) appShell.classList.toggle("panel-open", open);
}

function syncResponsiveUi() {
  setPanelOpen(false);
  if (state.layout) renderMap();
}

function initializePinchState() {
  if (state.activePointers.size < 2 || !state.viewBox) return;
  const [a, b] = [...state.activePointers.values()];
  state.pinchStartDistance = Math.hypot(b.x - a.x, b.y - a.y);
  state.pinchOriginViewBox = {...state.viewBox};
  state.pinchFocusClient = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
}

function applyPinchZoom() {
  if (state.activePointers.size < 2 || !state.pinchOriginViewBox || !state.pinchStartDistance) return;
  const [a, b] = [...state.activePointers.values()];
  const nextDistance = Math.hypot(b.x - a.x, b.y - a.y);
  if (!nextDistance) return;
  const bounds = svg.getBoundingClientRect();
  const factor = clamp(state.pinchStartDistance / nextDistance, 0.5, 2.4);
  const focusClientX = state.pinchFocusClient ? state.pinchFocusClient.x : bounds.left + bounds.width / 2;
  const focusClientY = state.pinchFocusClient ? state.pinchFocusClient.y : bounds.top + bounds.height / 2;
  const rx = (focusClientX - bounds.left) / bounds.width;
  const ry = (focusClientY - bounds.top) / bounds.height;
  const focusX = state.pinchOriginViewBox.x + rx * state.pinchOriginViewBox.width;
  const focusY = state.pinchOriginViewBox.y + ry * state.pinchOriginViewBox.height;
  const nextWidth = state.pinchOriginViewBox.width * factor;
  const nextHeight = state.pinchOriginViewBox.height * factor;
  setViewBox({
    x: focusX - nextWidth * rx,
    y: focusY - nextHeight * ry,
    width: nextWidth,
    height: nextHeight
  });
}

function isCrtEnabled() {
  const toggle = document.getElementById("toggle-crt");
  return Boolean(toggle && toggle.checked);
}

function updateCrtVisibility() {
  if (!crtCanvas) return;
  crtCanvas.style.display = isCrtEnabled() ? "block" : "none";
}

function ensureGrid(key, fill) {
  const width = state.layout[key][0].length;
  state.layout[key] = state.layout[key].map(row => row.slice(0, width).padEnd(width, fill));
}

function populateLegend() {
  legendRoot.innerHTML = "";
  Object.entries(TERRAIN_STYLES).forEach(([char, style]) => {
    if (char === "=") return;
    const item = document.createElement("div");
    item.className = "legend-item";
    item.dataset.char = char;
    item.innerHTML = `
      <span class="legend-chip" style="background:${style.fill}"></span>
      <span class="legend-label"><strong>${char}</strong> ${style.name}</span>
    `;
    item.addEventListener("mouseenter", () => setLegendHover(char));
    item.addEventListener("mouseleave", () => setLegendHover(null));
    legendRoot.appendChild(item);
  });
}

function populateInfluenceLegend() {
  influenceLegendRoot.innerHTML = "";
  INFLUENCE_FACTIONS.forEach(faction => {
    const style = INFLUENCE_STYLES[faction.char];
    const item = document.createElement("button");
    item.className = "legend-item influence-item";
    item.type = "button";
    item.dataset.char = faction.char;
    item.dataset.influenceKey = faction.id;
    item.innerHTML = `
      <span class="legend-chip influence-banner-chip" style="background:${style.shield}">
        <img src="${faction.banner}" alt="${faction.name} Banner" loading="lazy" />
      </span>
      <span class="legend-label"><strong>${faction.name}</strong> ${faction.description}</span>
    `;
    item.addEventListener("mouseenter", () => setInfluenceHover(faction.id));
    item.addEventListener("mouseleave", () => setInfluenceHover(null));
    item.addEventListener("click", () => toggleInfluenceFocus(faction.id));
    influenceLegendRoot.appendChild(item);
  });
}

function populateElevationLegend() {
  elevationLegendRoot.innerHTML = "";
  Object.entries(ELEVATION_STYLES).forEach(([char, style]) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.dataset.char = char;
    item.innerHTML = `
      <span class="legend-chip" style="background:${style.fill}"></span>
      <span class="legend-label"><strong>${char}</strong> ${style.name}</span>
    `;
    item.addEventListener("mouseenter", () => setElevationHover(char));
    item.addEventListener("mouseleave", () => setElevationHover(null));
    elevationLegendRoot.appendChild(item);
  });
}

function populatePopulationLegend() {
  populationLegendRoot.innerHTML = "";
  Object.entries(POPULATION_STYLES).forEach(([char, style]) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.dataset.char = char;
    item.innerHTML = `
      <span class="legend-chip" style="background:${style.fill}"></span>
      <span class="legend-label"><strong>${char}</strong> ${style.name}</span>
    `;
    item.addEventListener("mouseenter", () => setPopulationHover(char));
    item.addEventListener("mouseleave", () => setPopulationHover(null));
    populationLegendRoot.appendChild(item);
  });
}

function renderMap() {
  const {terrain_grid: terrainGrid, influence_features: influenceFeatures = [], elevation_grid: elevationGrid, population_grid: populationGrid, pois = []} = state.layout;
  const width = terrainGrid[0].length;
  const height = terrainGrid.length;
  const tile = state.cellSize;
  const mapWidth = width * tile;
  const mapHeight = height * tile;
  const margin = state.margin;
  const canvasWidth = mapWidth + margin * 2;
  const canvasHeight = mapHeight + margin * 2;
  const isInfluenceView = state.viewMode === "influence";
  const isElevationView = state.viewMode === "elevation";
  const isPopulationView = state.viewMode === "population";
  const isThreeView = false;

  mapFrame.classList.toggle("view-influence", isInfluenceView);
  mapFrame.classList.toggle("view-elevation", isElevationView);
  mapFrame.classList.toggle("view-population", isPopulationView);
  mapFrame.classList.toggle("view-3d", isThreeView);
  legendRoot.classList.toggle("is-hidden", isInfluenceView || isElevationView || isPopulationView);
  influenceLegendRoot.classList.toggle("is-hidden", !isInfluenceView);
  elevationLegendRoot.classList.toggle("is-hidden", !isElevationView);
  populationLegendRoot.classList.toggle("is-hidden", !isPopulationView);
  const viewMapButton = document.getElementById("view-map");
  const viewInfluenceButton = document.getElementById("view-influence");
  const viewElevationButton = document.getElementById("view-elevation");
  const viewPopulationButton = document.getElementById("view-population");
  if (viewMapButton) viewMapButton.classList.toggle("is-active", !isInfluenceView && !isElevationView && !isPopulationView);
  if (viewInfluenceButton) viewInfluenceButton.classList.toggle("is-active", isInfluenceView);
  if (viewElevationButton) viewElevationButton.classList.toggle("is-active", isElevationView);
  if (viewPopulationButton) viewPopulationButton.classList.toggle("is-active", isPopulationView);

  mapFrame.style.setProperty("--map-px-width", `${canvasWidth}px`);
  mapFrame.style.setProperty("--map-px-height", `${canvasHeight}px`);
  mapFrame.style.setProperty("--map-aspect", `${canvasWidth} / ${canvasHeight}`);
  svg.setAttribute("width", String(canvasWidth));
  svg.setAttribute("height", String(canvasHeight));
  if (mapClipRect) {
    mapClipRect.setAttribute("width", String(canvasWidth));
    mapClipRect.setAttribute("height", String(canvasHeight));
  }

  [coordLayer, terrainLayer, terrainShadowLayer, elevationLayer, populationLayer, influenceLayer, routeLayer, weatherLayer, cloudShadowLayer, cloudLayer, poiLayer, labelLayer].forEach(layer => (layer.innerHTML = ""));
  gridLayer.innerHTML = "";
  if (baseRasterLayer) baseRasterLayer.innerHTML = "";
  if (baseViewport) baseViewport.style.display = "";
  renderCoordinateSystem(width, height, tile, margin, canvasWidth, canvasHeight);
  renderGrid(width, height, tile, margin, canvasWidth, canvasHeight);

  const terrainGroups = groupCellsByChar(terrainGrid, Object.keys(TERRAIN_STYLES));
  const influenceData = buildInfluenceData(influenceFeatures, width, height);
  for (const [char, cells] of terrainGroups) {
    if (char === "=" || !cells.length) continue;
    const path = buildCompoundPath(cells, tile, margin);
    const style = TERRAIN_STYLES[char];
    const region = createSvg("path", {
      d: path,
      class: `terrain-region${isInfluenceView || isElevationView || isPopulationView ? " influence-dimmed" : ""}`,
      fill: style.fill,
      "data-char": char
    });
    region.addEventListener("click", () => showSelection(style.name, `${cells.length} Rasterzellen`));
    terrainLayer.appendChild(region);

    if (style.pattern && char !== ".") {
      terrainLayer.appendChild(createSvg("path", {
        d: path,
        class: `terrain-pattern${isInfluenceView || isElevationView || isPopulationView ? " influence-dimmed" : ""}`,
        fill: `url(#${style.pattern})`,
        "data-char": char
      }));
    }
  }

  renderTerrainTransitions(state.terrainTransitions, tile, margin, isInfluenceView || isElevationView || isPopulationView);

  if (
    document.getElementById("toggle-elevation").checked &&
    !isInfluenceView &&
    !isElevationView &&
    !isPopulationView &&
    !isThreeView
  ) {
    renderTerrainShadow(elevationGrid, width, height, tile, margin, mapWidth, mapHeight);
  }

  if (document.getElementById("toggle-elevation").checked && !isPopulationView) {
    const elevationGroups = groupCellsByChar(elevationGrid, Object.keys(ELEVATION_STYLES));
    for (const [char, cells] of elevationGroups) {
      if (!cells.length) continue;
      const path = buildCompoundPath(cells, tile, margin);
      const style = ELEVATION_STYLES[char];
      const region = createSvg("path", {
        d: path,
        class: `elevation-region${isElevationView ? " elevation-region-strong" : ""}`,
        fill: style.fill,
        stroke: style.stroke,
        "data-elevation-char": char
      });
      region.addEventListener("click", () => showSelection(`Elevation ${char}`, style.name));
      elevationLayer.appendChild(region);
    }
  }

  if (isPopulationView) {
    const populationGroups = groupCellsByChar(populationGrid, Object.keys(POPULATION_STYLES));
    for (const [char, cells] of populationGroups) {
      if (!cells.length) continue;
      const path = buildCompoundPath(cells, tile, margin);
      const style = POPULATION_STYLES[char];
      const region = createSvg("path", {
        d: path,
        class: `population-region population-region-${char}`,
        fill: style.fill,
        stroke: style.stroke,
        "data-population-char": char
      });
      region.addEventListener("click", () => showSelection(`Population ${char}`, style.name));
      populationLayer.appendChild(region);
    }
  }

  const enableWeather = document.getElementById("toggle-weather").checked;
  const enableClouds = document.getElementById("toggle-clouds").checked;

  if (enableWeather && !isInfluenceView && !isElevationView && !isPopulationView) {
    renderWeatherLayer(terrainGroups, tile, margin, canvasWidth, canvasHeight, pois);
  }

  if ((document.getElementById("toggle-influence").checked || isInfluenceView) && !isPopulationView) {
    const influenceGroups = influenceData.groups;
    for (const [char, cells] of influenceGroups) {
      if (!cells.length) continue;
      const path = buildCompoundPath(cells, tile, margin);
      const style = INFLUENCE_STYLES[char];
      const region = createSvg("path", {
        d: path,
        class: `influence-region${isInfluenceView ? " influence-region-strong" : ""}`,
        fill: style.fill,
        stroke: style.stroke,
        "data-influence-char": char
      });
      influenceLayer.appendChild(region);
    }
    if (isInfluenceView) renderInfluenceHeraldry(influenceGroups, tile, margin);
  }

  if (document.getElementById("toggle-routes").checked) {
    const routeCells = collectCells(terrainGrid, "=");
    const routeArea = buildCompoundPath(routeCells, tile, margin);
    routeLayer.appendChild(createSvg("path", {d: routeArea, class: `route-surface${isInfluenceView || isElevationView || isPopulationView ? " route-dimmed" : ""}`}));

    const routePaths = buildRoutePaths(routeCells, width, height, tile, margin);
    routePaths.forEach((d, index) => {
      routeLayer.appendChild(createSvg("path", {
        d,
        id: `route-path-${index}`,
        class: `route-centerline${isInfluenceView || isElevationView || isPopulationView ? " route-dimmed" : ""}`
      }));
    });
    if (!isInfluenceView && !isElevationView && !isPopulationView) renderRouteVehicles(routePaths);
  }

  if (enableClouds && !isInfluenceView && !isElevationView && !isPopulationView) {
    renderCloudLayer(canvasWidth, canvasHeight);
  }

  if (document.getElementById("toggle-pois").checked) {
    pois.forEach(poi => {
      const cx = margin + poi.x * tile + tile / 2;
      const cy = margin + poi.y * tile + tile / 2;
      const terrainChar = terrainGrid[poi.y] && terrainGrid[poi.y][poi.x] ? terrainGrid[poi.y][poi.x] : ":";
      const influenceChars = influenceData.cellKeys[poi.y] && influenceData.cellKeys[poi.y][poi.x] ? influenceData.cellKeys[poi.y][poi.x] : "";
      const markerColor = POI_COLORS[poi.type] || "#5b4633";
      const markerIcon = POI_NAME_ICONS[poi.name] || POI_TYPE_ICONS[poi.type] || "\uf3c5";

      const marker = createSvg("g", {
        class: "poi-marker",
        "data-char": terrainChar,
        "data-influence-chars": influenceChars
      });
      const icon = createSvg("text", {
        x: cx,
        y: cy - 12,
        class: "poi-icon-backdrop",
        fill: markerColor
      });
      icon.textContent = markerIcon;
      marker.appendChild(icon);
      marker.appendChild(createSvg("circle", {cx, cy, r: 7, fill: "#f8f0df", stroke: markerColor, "stroke-width": 3}));
      marker.appendChild(createSvg("circle", {cx, cy, r: 3.2, fill: markerColor}));
      marker.addEventListener("click", event => {
        showSelection(poi.name, `${poi.type}: ${poi.note}`);
        showPoiPopup(poi, event);
      });
      poiLayer.appendChild(marker);

      const label = createSvg("text", {
        x: cx + 12,
        y: cy - 10,
        class: "poi-label",
        "data-char": terrainChar,
        "data-influence-chars": influenceChars,
        "data-base-size": 14,
        "data-min-screen-size": 12.5,
        "data-max-screen-size": 15.5,
        "data-hide-scale": 0.42,
        "font-size": 14
      });
      label.textContent = poi.name;
      label.addEventListener("click", event => {
        showSelection(poi.name, `${poi.type}: ${poi.note}`);
        showPoiPopup(poi, event);
      });
      labelLayer.appendChild(label);

      if (poi.note) {
        const sub = createSvg("text", {
          x: cx + 12,
          y: cy + 7,
          class: "poi-subtext",
          "data-char": terrainChar,
          "data-influence-chars": influenceChars,
          "data-base-size": 11,
          "data-min-screen-size": 10.5,
          "data-max-screen-size": 11.75,
          "data-hide-scale": 0.62,
          "font-size": 11
        });
        sub.textContent = poi.note;
        sub.addEventListener("click", event => {
          showSelection(poi.name, `${poi.type}: ${poi.note}`);
          showPoiPopup(poi, event);
        });
        labelLayer.appendChild(sub);
      }
    });
  }

  if (!isMobileViewport()) {
    terrainLayer.appendChild(createSvg("rect", {
      x: -margin,
      y: -margin,
      width: mapWidth + margin * 2,
      height: mapHeight + margin * 2,
      fill: "transparent",
      filter: "url(#paperNoise)",
      "pointer-events": "none"
    }));
  }

  if (!state.viewBox) fitView();
  updatePoiLabelSizing();
  applyLegendHoverState();
  applyInfluenceFocusState();
  applyElevationFocusState();
  applyPopulationFocusState();
  if (isThreeView) {
    void updateThreeView(terrainGrid, elevationGrid, influenceData, pois);
  }
}

function groupCellsByChar(grid, allowedChars) {
  const groups = new Map(allowedChars.map(char => [char, []]));
  grid.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (!groups.has(char)) return;
      groups.get(char).push({x, y});
    });
  });
  return groups;
}

function parseAsciiTerrainTransitions(sourceText) {
  const groups = new Map();
  const lines = sourceText.split(/\r?\n/);

  let inLegend = false;
  for (const line of lines) {
    if (line.startsWith("TRANSITION LEGEND")) {
      inLegend = true;
      continue;
    }
    if (line.startsWith("INFLUENCE LEGEND")) {
      inLegend = false;
    }

    if (!inLegend) continue;
    const match = line.match(/^(\S)\s+(.+)$/);
    if (!match) continue;
    const transitionChar = match[1];
    const chars = [...match[2].matchAll(/([A-Z])=/g)].map(([, char]) => char);
    if (!chars.length) continue;
    groups.set(transitionChar, {chars, cells: []});
  }

  let inTerrain = false;
  for (const line of lines) {
    if (line.startsWith("TERRAIN + POIS")) {
      inTerrain = true;
      continue;
    }
    if (line.startsWith("INFLUENCE")) {
      inTerrain = false;
    }

    if (inTerrain) {
      const match = line.match(/^Y(\d{2,3})\s+(.+)$/);
      if (!match) continue;
      const y = Number(match[1]);
      [...match[2]].forEach((char, x) => {
        if (!groups.has(char)) return;
        groups.get(char).cells.push({x, y});
      });
      continue;
    }
  }

  return groups;
}

function renderTerrainTransitions(transitionGroups, tile, margin, isDimmed) {
  transitionGroups.forEach(({chars, cells}, key) => {
    if (!cells.length) return;
    const path = buildCompoundPath(cells, tile, margin);
    const fill = mixTerrainFill(chars);

    terrainLayer.appendChild(createSvg("path", {
      d: path,
      class: `terrain-region terrain-transition-region${isDimmed ? " influence-dimmed" : ""}`,
      fill,
      "data-char": ".",
      "data-transition-key": key
    }));

    terrainLayer.appendChild(createSvg("path", {
      d: path,
      class: `terrain-pattern terrain-transition-base${isDimmed ? " influence-dimmed" : ""}`,
      fill: `url(#${TERRAIN_STYLES["."].pattern})`,
      "data-char": ".",
      "data-transition-key": key
    }));

    chars.forEach((char, index) => {
      const style = TERRAIN_STYLES[char];
      if (!style || !style.pattern) return;
      terrainLayer.appendChild(createSvg("path", {
        d: path,
        class: `terrain-pattern terrain-transition-pattern terrain-transition-layer-${index + 1}${isDimmed ? " influence-dimmed" : ""}`,
        fill: `url(#${style.pattern})`,
        "data-char": ".",
        "data-transition-char": char,
        "data-transition-key": key
      }));
    });
  });
}

function mixTerrainFill(chars) {
  const palette = chars
    .map(char => TERRAIN_STYLES[char] ? TERRAIN_STYLES[char].fill : null)
    .filter(Boolean)
    .map(parseHexColor);

  if (!palette.length) return TERRAIN_STYLES["."].fill;

  const mixed = palette.reduce(
    (acc, color) => ({
      r: acc.r + color.r,
      g: acc.g + color.g,
      b: acc.b + color.b
    }),
    {r: 0, g: 0, b: 0}
  );

  return toHexColor({
    r: Math.round(mixed.r / palette.length),
    g: Math.round(mixed.g / palette.length),
    b: Math.round(mixed.b / palette.length)
  });
}

function parseHexColor(hex) {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function toHexColor({r, g, b}) {
  return `#${[r, g, b].map(value => value.toString(16).padStart(2, "0")).join("")}`;
}

function buildInfluenceData(features, width, height) {
  const groups = new Map(Object.keys(INFLUENCE_STYLES).map(char => [char, []]));
  const seen = new Map(Object.keys(INFLUENCE_STYLES).map(char => [char, new Set()]));
  const cellSets = Array.from({length: height}, () => Array.from({length: width}, () => new Set()));

  features.forEach(feature => {
    if (feature.kind !== "disc" || !groups.has(feature.char)) return;
    const rx = Math.max(feature.rx || 1, 1);
    const ry = Math.max(feature.ry || 1, 1);
    for (let y = 0; y < height; y += 1) {
      const ny = (y - feature.y) / ry;
      for (let x = 0; x < width; x += 1) {
        const nx = (x - feature.x) / rx;
        if (nx * nx + ny * ny > 1) continue;
        cellSets[y][x].add(feature.char);
        const key = `${x},${y}`;
        if (seen.get(feature.char).has(key)) continue;
        seen.get(feature.char).add(key);
        groups.get(feature.char).push({x, y});
      }
    }
  });

  const cellKeys = cellSets.map(row => row.map(set => [...set].sort().join("")));
  return {groups, cellKeys};
}

function renderCoordinateSystem(width, height, tile, margin, canvasWidth, canvasHeight) {
  if (isMobileViewport()) {
    coordLayer.appendChild(createSvg("rect", {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      class: "coord-frame"
    }));
    return;
  }

  coordLayer.appendChild(createSvg("rect", {
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
    class: "coord-frame"
  }));

  const step = 5;
  for (let x = 0; x < width; x += step) {
    const px = margin + x * tile + tile / 2;
    const label = alphaIndex(x / step);
    coordLayer.appendChild(createSvg("line", {
      x1: px,
      y1: 0,
      x2: px,
      y2: 10,
      class: "coord-tick"
    }));
    coordLayer.appendChild(createSvg("line", {
      x1: px,
      y1: canvasHeight,
      x2: px,
      y2: canvasHeight - 10,
      class: "coord-tick"
    }));
    coordLayer.appendChild(createCoordText(px, 24, label));
    coordLayer.appendChild(createCoordText(px, canvasHeight - 12, label));
  }

  for (let y = 0; y < height; y += step) {
    const py = margin + y * tile + tile / 2;
    const label = String(y / step + 1).padStart(2, "0");
    coordLayer.appendChild(createSvg("line", {
      x1: 0,
      y1: py,
      x2: 10,
      y2: py,
      class: "coord-tick"
    }));
    coordLayer.appendChild(createSvg("line", {
      x1: canvasWidth,
      y1: py,
      x2: canvasWidth - 10,
      y2: py,
      class: "coord-tick"
    }));
    coordLayer.appendChild(createCoordText(20, py + 4, label, "start"));
    coordLayer.appendChild(createCoordText(canvasWidth - 20, py + 4, label, "end"));
  }
}

function renderGrid(width, height, tile, margin, canvasWidth, canvasHeight) {
  const showGrid = document.getElementById("toggle-grid").checked;
  gridLayer.setAttribute("opacity", showGrid ? "1" : "0");
  if (!showGrid) return;

  const step = 5;
  for (let x = 0; x <= width; x += step) {
    const px = margin + x * tile;
    gridLayer.appendChild(createSvg("line", {
      x1: px,
      y1: margin,
      x2: px,
      y2: canvasHeight - margin,
      class: "map-grid-line"
    }));
  }

  for (let y = 0; y <= height; y += step) {
    const py = margin + y * tile;
    gridLayer.appendChild(createSvg("line", {
      x1: margin,
      y1: py,
      x2: canvasWidth - margin,
      y2: py,
      class: "map-grid-line"
    }));
  }
}

function renderTerrainShadow(elevationGrid, width, height, tile, margin, mapWidth, mapHeight) {
  void mapWidth;
  void mapHeight;

  const shadowDefs = ensureShadowDefs();
  shadowDefs.innerHTML = "";
  const elevationGroups = groupCellsByChar(elevationGrid, Object.keys(ELEVATION_STYLES));
  const levels = Object.keys(ELEVATION_STYLES)
    .map(Number)
    .filter(level => level > 0)
    .sort((a, b) => a - b);

  levels.forEach(level => {
    const cells = elevationGroups.get(String(level)) || [];
    if (!cells.length) return;

    const path = buildCompoundPath(cells, tile, margin);
    const lowerCells = collectElevationRange(elevationGrid, 0, level - 1);
    if (!lowerCells.length) return;

    const clipId = `terrain-shadow-clip-${level}`;
    const clipPath = createSvg("clipPath", {id: clipId, "clipPathUnits": "userSpaceOnUse"});
    clipPath.appendChild(createSvg("path", {
      d: buildCompoundPath(lowerCells, tile, margin)
    }));
    shadowDefs.appendChild(clipPath);

    const distance = round(level * tile * (isMobileViewport() ? 0.24 : 0.36), 2);
    const offsetPath = translatePathData(path, -distance, distance);
    const castPath = `${offsetPath} ${path}`;
    terrainShadowLayer.appendChild(createSvg("path", {
      d: castPath,
      class: `terrain-shadow-cast terrain-shadow-level-${level}`,
      "fill-rule": "evenodd",
      "clip-path": `url(#${clipId})`
    }));
  });
}

function ensureShadowDefs() {
  let defsGroup = svgDefs.querySelector("#terrain-shadow-defs");
  if (!defsGroup) {
    defsGroup = createSvg("g", {id: "terrain-shadow-defs"});
    svgDefs.appendChild(defsGroup);
  }
  return defsGroup;
}

function collectElevationRange(grid, minLevel, maxLevel) {
  const cells = [];
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      const level = Number(grid[y][x]);
      if (level < minLevel || level > maxLevel) continue;
      cells.push({x, y});
    }
  }
  return cells;
}

function translatePathData(pathData, dx, dy) {
  let coordinateIndex = 0;
  return pathData.replace(/-?\d*\.?\d+/g, token => {
    const value = Number(token);
    const translated = value + (coordinateIndex % 2 === 0 ? dx : dy);
    coordinateIndex += 1;
    return String(round(translated, 2));
  });
}

function createCoordText(x, y, text, anchor = "middle") {
  const node = createSvg("text", {
    x,
    y,
    class: "coord-label",
    "text-anchor": anchor
  });
  node.textContent = text;
  return node;
}

function alphaIndex(index) {
  let n = index;
  let result = "";
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}

function collectCells(grid, target) {
  const cells = [];
  grid.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === target) cells.push({x, y});
    });
  });
  return cells;
}

function renderInfluenceHeraldry(influenceGroups, tile, margin) {
  Object.entries(INFLUENCE_STYLES).forEach(([char, style]) => {
    const cells = influenceGroups.get(char) || [];
    if (!cells.length) return;
    const center = getCellsCentroid(cells, tile, margin);
    const bannerWidth = 56;
    const bannerHeight = 88;
    const group = createSvg("g", {
      class: "influence-heraldry",
      transform: `translate(${round(center.x, 2)} ${round(center.y, 2)})`,
      "data-influence-char": char,
      "data-influence-key": char
    });
    group.appendChild(createSvg("rect", {
      x: -bannerWidth / 2 - 7,
      y: -bannerHeight / 2 - 7,
      width: bannerWidth + 14,
      height: bannerHeight + 14,
      rx: 14,
      ry: 14,
      class: "influence-banner-frame",
      fill: style.shield,
      stroke: style.fill
    }));
    group.appendChild(createSvg("image", {
      x: -bannerWidth / 2,
      y: -bannerHeight / 2,
      width: bannerWidth,
      height: bannerHeight,
      href: style.banner,
      preserveAspectRatio: "xMidYMid slice",
      class: "influence-banner-image"
    }));
    const label = createSvg("text", {
      x: 0,
      y: bannerHeight / 2 + 24,
      class: "influence-name"
    });
    label.textContent = style.name;
    group.appendChild(label);
    influenceLayer.appendChild(group);
  });
}

function getCellsCentroid(cells, tile, margin) {
  const sum = cells.reduce(
    (acc, cell) => {
      acc.x += margin + cell.x * tile + tile / 2;
      acc.y += margin + cell.y * tile + tile / 2;
      return acc;
    },
    {x: 0, y: 0}
  );
  return {x: sum.x / cells.length, y: sum.y / cells.length};
}

function setViewMode(mode) {
  if (mode === "3d") mode = "map";
  state.viewMode = mode;
  renderMap();
}

function setElevationHover(char) {
  state.hoveredElevationChar = char;
  applyElevationFocusState();
}

function setPopulationHover(char) {
  state.hoveredPopulationChar = char;
  applyPopulationFocusState();
}

function setInfluenceHover(key) {
  if (state.pinnedInfluenceKey) return;
  state.hoveredInfluenceKey = key;
  applyInfluenceFocusState();
}

function toggleInfluenceFocus(key) {
  state.pinnedInfluenceKey = state.pinnedInfluenceKey === key ? null : key;
  state.hoveredInfluenceKey = null;
  const faction = INFLUENCE_FACTIONS.find(entry => entry.id === key);
  if (state.pinnedInfluenceKey && faction) showSelection(faction.name, faction.description);
  applyInfluenceFocusState();
}

function shrinkInfluenceGrid(grid) {
  const keepChars = new Set(["@", "$", "."]);
  const rows = grid.map(row => [...row]);
  const height = rows.length;
  const width = rows[0] ? rows[0].length : 0;

  return rows.map((row, y) =>
    row
      .map((char, x) => {
        if (keepChars.has(char)) return char;

        let sameCardinal = 0;
        let sameAll = 0;
        const neighbors = [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1]
        ];

        neighbors.forEach(([dx, dy], index) => {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
          if (rows[ny][nx] !== char) return;
          sameAll += 1;
          if (index < 4) sameCardinal += 1;
        });

        return sameCardinal >= 2 && sameAll >= 3 ? char : ".";
      })
      .join("")
  );
}

function renderWeatherLayer(terrainGroups, tile, margin, canvasWidth, canvasHeight, pois) {
  Object.entries(TERRAIN_WEATHER).forEach(([char, weather]) => {
    const cells = terrainGroups.get(char) || [];
    if (!cells.length) return;
    const path = buildCompoundPath(cells, tile, margin);
    weatherLayer.appendChild(createSvg("path", {
      d: path,
      class: `weather-region ${weather.className}`,
      fill: `url(#${weather.pattern})`,
      opacity: weather.opacity
    }));
  });

  renderWeatherSystems(canvasWidth, canvasHeight, pois);

  weatherLayer.appendChild(createSvg("rect", {
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
    class: "weather-screen"
  }));
}

function renderWeatherSystems(canvasWidth, canvasHeight, pois) {
  const systems = [
    {className: "weather-system dust", x: canvasWidth * 0.18, y: canvasHeight * 0.26, w: 260, h: 110, driftX: 64, driftY: 18, dur: "18s"},
    {className: "weather-system dust", x: canvasWidth * 0.54, y: canvasHeight * 0.18, w: 320, h: 108, driftX: 78, driftY: 14, dur: "22s"},
    {className: "weather-system ash", x: canvasWidth * 0.46, y: canvasHeight * 0.78, w: 180, h: 74, driftX: 36, driftY: 10, dur: "13s"},
    {className: "weather-system toxic", x: canvasWidth * 0.62, y: canvasHeight * 0.7, w: 170, h: 82, driftX: 20, driftY: 16, dur: "16s"},
    {className: "weather-system fog", x: canvasWidth * 0.7, y: canvasHeight * 0.16, w: 160, h: 76, driftX: 18, driftY: 6, dur: "24s"},
    {className: "weather-system electric", x: canvasWidth * 0.6, y: canvasHeight * 0.58, w: 144, h: 70, driftX: 12, driftY: 8, dur: "7s"}
  ];

  systems.forEach(system => {
    const group = createSvg("g", {
      class: system.className,
      transform: `translate(${round(system.x, 2)} ${round(system.y, 2)})`
    });
    group.appendChild(createSvg("ellipse", {cx: 0, cy: 0, rx: system.w * 0.32, ry: system.h * 0.4}));
    group.appendChild(createSvg("ellipse", {cx: system.w * 0.18, cy: -system.h * 0.08, rx: system.w * 0.28, ry: system.h * 0.32}));
    group.appendChild(createSvg("ellipse", {cx: -system.w * 0.2, cy: system.h * 0.05, rx: system.w * 0.24, ry: system.h * 0.28}));
    group.appendChild(createDriftAnimation(system.driftX, system.driftY, system.dur));
    weatherLayer.appendChild(group);
  });

  renderSandstorms(canvasWidth, canvasHeight, pois);
  renderSturmtrogLightning(canvasWidth, canvasHeight, pois);
  renderToxicClouds(pois);
  renderAschepuls(pois);
}

function renderSandstorms(canvasWidth, canvasHeight, pois) {
  const storms = [
    {
      y: canvasHeight * 0.28,
      width: canvasWidth * 1.18,
      height: 260,
      travel: canvasWidth + 760,
      dur: "28s",
      opacityValues: "0;0;0.82;0.98;0.78;0;0",
      opacityTimes: "0;0.48;0.56;0.62;0.74;0.8;1",
      veilValues: "0;0;0.26;0.86;0.24;0;0"
    },
    {
      y: canvasHeight * 0.61,
      width: canvasWidth * 1.08,
      height: 230,
      travel: canvasWidth + 680,
      dur: "34s",
      opacityValues: "0;0;0.72;0.92;0.7;0;0",
      opacityTimes: "0;0.6;0.66;0.74;0.86;0.92;1",
      veilValues: "0;0;0.18;0.62;0.16;0;0"
    }
  ];

  storms.forEach((storm, stormIndex) => {
    const band = createSvg("g", {
      class: "sandstorm-band",
      transform: `translate(${-320} ${round(storm.y, 2)}) rotate(-18)`
    });
    band.appendChild(createSvg("path", {
      class: "sandstorm-body",
      d: buildSandstormRibbonPath(storm.width, storm.height, 0)
    }));
    band.appendChild(createSvg("path", {
      class: "sandstorm-body sandstorm-body-secondary",
      d: buildSandstormRibbonPath(storm.width * 0.96, storm.height * 0.82, 1, storm.width * 0.04, storm.height * 0.08)
    }));
    band.appendChild(createSvg("path", {
      class: "sandstorm-front",
      d: buildSandstormFrontPath(storm.width, storm.height)
    }));

    for (let i = 0; i < 22; i += 1) {
      const seedA = seededNoise(stormIndex * 31 + i * 7, 14, 5);
      const seedB = seededNoise(stormIndex * 19 + i * 11, 27, 9);
      const seedC = seededNoise(stormIndex * 23 + i * 13, 41, 3);
      const seedD = seededNoise(stormIndex * 17 + i * 5, 63, 7);
      const startX = -storm.width * (0.08 + ((seedA + 1) / 2) * 0.34);
      const startY = -96 + i * 13 + seedB * 28;
      const ctrlX = storm.width * (0.16 + ((seedC + 1) / 2) * 0.28);
      const ctrlY = startY + 24 + seedD * 34;
      const endX = storm.width * (0.42 + ((seedB + 1) / 2) * 0.62);
      const endY = startY + 18 + seedA * 30;
      const streak = createSvg("path", {
        class: "sandstorm-streak",
        d: `M ${round(startX, 2)} ${round(startY, 2)} Q ${round(ctrlX, 2)} ${round(ctrlY, 2)} ${round(endX, 2)} ${round(endY, 2)}`
      });
      streak.appendChild(createSvg("animate", {
        attributeName: "opacity",
        values: "0.01;0.34;0.06;0.48;0.02",
        dur: `${round(1.8 + ((seedC + 1) / 2) * 1.7 + i * 0.04, 2)}s`,
        repeatCount: "indefinite"
      }));
      band.appendChild(streak);
    }

    band.appendChild(createSvg("animateTransform", {
      attributeName: "transform",
      type: "translate",
      values: `${-320} ${round(storm.y, 2)}; ${round(storm.travel, 2)} ${round(storm.y + 110, 2)}`,
      dur: storm.dur,
      repeatCount: "indefinite"
    }));
    band.appendChild(createSvg("animate", {
      attributeName: "opacity",
      values: storm.opacityValues,
      keyTimes: storm.opacityTimes,
      dur: storm.dur,
      repeatCount: "indefinite"
    }));
    weatherLayer.appendChild(band);

    const veil = createSvg("rect", {
      x: -canvasWidth * 0.04,
      y: storm.y - storm.height * 0.62,
      width: canvasWidth * 1.12,
      height: storm.height * 1.28,
      class: "sandstorm-veil"
    });
    veil.appendChild(createSvg("animate", {
      attributeName: "opacity",
      values: storm.veilValues,
      keyTimes: storm.opacityTimes,
      dur: storm.dur,
      repeatCount: "indefinite"
    }));
    weatherLayer.appendChild(veil);
  });
}

function buildSandstormRibbonPath(width, height, variant = 0, offsetX = 0, offsetY = 0) {
  const top = [];
  const bottom = [];
  const steps = 11;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = -width * 0.18 + width * 1.22 * t + offsetX;
    const crest = Math.sin(t * Math.PI * (2.2 + variant * 0.35)) * height * (0.08 + variant * 0.015);
    const chop = Math.sin(t * Math.PI * 7 + variant * 1.7) * height * 0.028;
    top.push([round(x, 2), round(-height * 0.34 + crest + chop + offsetY, 2)]);
    bottom.push([round(x, 2), round(height * 0.32 + crest * 0.35 + chop * 0.5 + offsetY, 2)]);
  }

  const points = [...top, ...bottom.reverse(), top[0]];
  return smoothClosedPath(points, Math.max(18, height * 0.12));
}

function buildSandstormFrontPath(width, height) {
  const points = [];
  const steps = 12;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = width * (0.06 + t * 0.98);
    const y = -height * 0.2 + Math.sin(t * Math.PI * 2.8) * height * 0.08 + Math.sin(t * Math.PI * 8) * height * 0.02;
    points.push([round(x, 2), round(y, 2)]);
  }

  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current[0] + next[0]) / 2;
    const midY = (current[1] + next[1]) / 2;
    d += ` Q ${current[0]} ${current[1]} ${round(midX, 2)} ${round(midY, 2)}`;
  }
  return d;
}

function renderSturmtrogLightning(canvasWidth, canvasHeight, pois) {
  const sturmtrog = findPoi(pois, "Sturmtrog");
  const x = sturmtrog ? sturmtrog.x : canvasWidth * 0.82;
  const y = sturmtrog ? sturmtrog.y : canvasHeight * 0.82;

  const stormCore = createSvg("g", {
    class: "storm-core",
    transform: `translate(${round(x, 2)} ${round(y - 32, 2)})`
  });
  stormCore.appendChild(createSvg("ellipse", {cx: 0, cy: 0, rx: 86, ry: 46}));
  stormCore.appendChild(createSvg("ellipse", {cx: 44, cy: -10, rx: 62, ry: 34}));
  stormCore.appendChild(createSvg("ellipse", {cx: -42, cy: -6, rx: 58, ry: 30}));
  stormCore.appendChild(createDriftAnimation(-14, 10, "9s"));
  weatherLayer.appendChild(stormCore);

  const flash = createSvg("ellipse", {
    cx: x + 6,
    cy: y - 12,
    rx: 118,
    ry: 78,
    class: "storm-flash"
  });
  flash.appendChild(createSvg("animate", {
    attributeName: "opacity",
    values: "0;0;0.24;0.08;0;0",
    keyTimes: "0;0.2;0.24;0.28;0.34;1",
    dur: "4.8s",
    repeatCount: "indefinite"
  }));
  weatherLayer.appendChild(flash);

  const bolts = [
    `M ${x - 24} ${y - 58} L ${x - 4} ${y - 8} L ${x - 20} ${y - 8} L ${x + 4} ${y + 38}`,
    `M ${x + 10} ${y - 54} L ${x + 26} ${y - 10} L ${x + 8} ${y - 10} L ${x + 34} ${y + 42}`,
    `M ${x + 42} ${y - 50} L ${x + 54} ${y - 18} L ${x + 40} ${y - 18} L ${x + 58} ${y + 22}`
  ];

  bolts.forEach((d, index) => {
    const aura = createSvg("path", {
      d,
      class: "storm-bolt storm-bolt-aura"
    });
    const core = createSvg("path", {
      d,
      class: "storm-bolt storm-bolt-core"
    });
    const branch = createSvg("path", {
      d: index === 0
        ? `M ${x - 10} ${y - 18} L ${x - 28} ${y + 12}`
        : index === 1
          ? `M ${x + 18} ${y - 22} L ${x + 2} ${y + 4}`
          : `M ${x + 48} ${y - 24} L ${x + 68} ${y - 2}`,
      class: "storm-bolt storm-bolt-branch"
    });
    const anim = createSvg("animate", {
      attributeName: "opacity",
      values: index === 0 ? "0;0;1;0.18;0;0" : "0;0;0.85;0.12;0;0",
      keyTimes: index === 0 ? "0;0.2;0.24;0.28;0.32;1" : "0;0.45;0.49;0.53;0.57;1",
      dur: `${4.8 + index * 1.2}s`,
      repeatCount: "indefinite"
    });
    aura.appendChild(anim.cloneNode());
    core.appendChild(anim.cloneNode());
    branch.appendChild(anim);
    weatherLayer.appendChild(aura);
    weatherLayer.appendChild(core);
    weatherLayer.appendChild(branch);
  });
}

function findPoi(pois, name) {
  const poi = pois.find(entry => entry.name === name);
  if (!poi) return null;
  return {
    x: state.margin + poi.x * state.cellSize + state.cellSize / 2,
    y: state.margin + poi.y * state.cellSize + state.cellSize / 2
  };
}

function renderToxicClouds(pois) {
  [
    {name: "Schacht 47", scale: 1},
    {name: "Grünbrand-Senke", scale: 1.18}
  ].forEach((entry, index) => {
    const anchor = findPoi(pois, entry.name);
    if (!anchor) return;

    const cloud = createSvg("g", {
      class: "toxic-cloud",
      transform: `translate(${round(anchor.x, 2)} ${round(anchor.y + 8, 2)}) scale(${entry.scale})`
    });
    cloud.appendChild(createSvg("ellipse", {cx: -22, cy: 8, rx: 28, ry: 18}));
    cloud.appendChild(createSvg("ellipse", {cx: 12, cy: -4, rx: 32, ry: 20}));
    cloud.appendChild(createSvg("ellipse", {cx: 34, cy: 10, rx: 22, ry: 15}));
    cloud.appendChild(createSvg("ellipse", {cx: -2, cy: 16, rx: 44, ry: 18}));
    cloud.appendChild(createSvg("animateTransform", {
      attributeName: "transform",
      type: "translate",
      values: `0 0; ${10 + index * 4} ${-8 - index * 2}; 0 0`,
      dur: `${11 + index * 3}s`,
      repeatCount: "indefinite",
      additive: "sum"
    }));
    cloud.appendChild(createSvg("animate", {
      attributeName: "opacity",
      values: "0.28;0.5;0.34;0.28",
      dur: `${6 + index * 1.5}s`,
      repeatCount: "indefinite"
    }));
    weatherLayer.appendChild(cloud);
  });
}

function renderAschepuls(pois) {
  const anchor = findPoi(pois, "Aschepuls");
  if (!anchor) return;

  const rings = [
    {r: 38, glow: 0.32, dur: "5.2s"},
    {r: 62, glow: 0.24, dur: "6.8s"},
    {r: 88, glow: 0.16, dur: "8.6s"}
  ];

  rings.forEach(ring => {
    const node = createSvg("circle", {
      cx: anchor.x,
      cy: anchor.y,
      r: ring.r,
      class: "ash-pulse-ring"
    });
    node.appendChild(createSvg("animate", {
      attributeName: "r",
      values: `${ring.r * 0.88};${ring.r};${ring.r * 1.08};${ring.r * 0.88}`,
      dur: ring.dur,
      repeatCount: "indefinite"
    }));
    node.appendChild(createSvg("animate", {
      attributeName: "opacity",
      values: `${ring.glow * 0.5};${ring.glow};${ring.glow * 0.55};${ring.glow * 0.5}`,
      dur: ring.dur,
      repeatCount: "indefinite"
    }));
    weatherLayer.appendChild(node);
  });

  const ember = createSvg("g", {
    class: "ash-pulse-ember",
    transform: `translate(${round(anchor.x, 2)} ${round(anchor.y, 2)})`
  });
  ember.appendChild(createSvg("circle", {cx: 0, cy: 0, r: 14}));
  ember.appendChild(createSvg("circle", {cx: 18, cy: -6, r: 5}));
  ember.appendChild(createSvg("circle", {cx: -12, cy: 8, r: 4}));
  [
    {cx: -6, cy: -3, r: 1.7, dur: "1.8s"},
    {cx: 8, cy: 6, r: 1.3, dur: "1.3s"},
    {cx: 15, cy: -2, r: 1.4, dur: "2.1s"},
    {cx: -14, cy: 4, r: 1.2, dur: "1.6s"}
  ].forEach((spark, index) => {
    const node = createSvg("circle", {
      cx: spark.cx,
      cy: spark.cy,
      r: spark.r,
      fill: index % 2 === 0 ? "rgba(255, 92, 54, 0.95)" : "rgba(255, 132, 74, 0.88)"
    });
    node.appendChild(createSvg("animate", {
      attributeName: "opacity",
      values: "0.08;0.95;0.18;0.08",
      dur: spark.dur,
      repeatCount: "indefinite"
    }));
    node.appendChild(createSvg("animate", {
      attributeName: "r",
      values: `${spark.r * 0.8};${spark.r * 1.35};${spark.r};${spark.r * 0.8}`,
      dur: spark.dur,
      repeatCount: "indefinite"
    }));
    ember.appendChild(node);
  });
  ember.appendChild(createSvg("animate", {
    attributeName: "opacity",
    values: "0.24;0.62;0.34;0.24",
    dur: "3.8s",
    repeatCount: "indefinite"
  }));
  weatherLayer.appendChild(ember);
}

function createDriftAnimation(dx, dy, dur) {
  return createSvg("animateTransform", {
    attributeName: "transform",
    type: "translate",
    values: `0 0; ${round(dx, 2)} ${round(dy, 2)}; 0 0`,
    dur,
    repeatCount: "indefinite",
    additive: "sum"
  });
}

function renderCloudLayer(canvasWidth, canvasHeight) {
  const clouds = [
    {x: canvasWidth * 0.14, y: canvasHeight * 0.18, scale: 2.3, dur: "92s", dx: canvasWidth * 0.18},
    {x: canvasWidth * 0.7, y: canvasHeight * 0.14, scale: 2.6, dur: "104s", dx: -canvasWidth * 0.2},
    {x: canvasWidth * 0.24, y: canvasHeight * 0.56, scale: 1.95, dur: "98s", dx: canvasWidth * 0.14},
    {x: canvasWidth * 0.82, y: canvasHeight * 0.7, scale: 2.2, dur: "110s", dx: -canvasWidth * 0.16}
  ];

  clouds.forEach((cloud, index) => {
    const shadowGroup = createSvg("g", {
      class: "cloud-shadow-bank",
      transform: `translate(${round(cloud.x + 24, 2)} ${round(cloud.y + 28, 2)}) scale(${cloud.scale * 1.06})`
    });
    shadowGroup.appendChild(createSvg("ellipse", {cx: -26, cy: 0, rx: 34, ry: 18}));
    shadowGroup.appendChild(createSvg("ellipse", {cx: 6, cy: -8, rx: 40, ry: 22}));
    shadowGroup.appendChild(createSvg("ellipse", {cx: 42, cy: 4, rx: 30, ry: 16}));
    shadowGroup.appendChild(createSvg("ellipse", {cx: -2, cy: 10, rx: 56, ry: 20}));
    shadowGroup.appendChild(createDriftAnimation(cloud.dx, index % 2 === 0 ? -8 : 10, cloud.dur));
    cloudShadowLayer.appendChild(shadowGroup);

    const group = createSvg("g", {
      class: "cloud-bank",
      transform: `translate(${round(cloud.x, 2)} ${round(cloud.y, 2)}) scale(${cloud.scale})`
    });
    group.appendChild(createSvg("ellipse", {cx: -26, cy: 0, rx: 34, ry: 18}));
    group.appendChild(createSvg("ellipse", {cx: 6, cy: -8, rx: 40, ry: 22}));
    group.appendChild(createSvg("ellipse", {cx: 42, cy: 4, rx: 30, ry: 16}));
    group.appendChild(createSvg("ellipse", {cx: -2, cy: 10, rx: 56, ry: 20}));
    group.appendChild(createDriftAnimation(cloud.dx, index % 2 === 0 ? -8 : 10, cloud.dur));
    cloudLayer.appendChild(group);
  });
}

function buildCompoundPath(cells, tile, margin) {
  const cellSet = new Set(cells.map(({x, y}) => `${x},${y}`));
  const edges = [];

  for (const {x, y} of cells) {
    const x0 = margin + x * tile;
    const y0 = margin + y * tile;
    const x1 = x0 + tile;
    const y1 = y0 + tile;

    if (!cellSet.has(`${x},${y - 1}`)) edges.push([[x0, y0], [x1, y0]]);
    if (!cellSet.has(`${x + 1},${y}`)) edges.push([[x1, y0], [x1, y1]]);
    if (!cellSet.has(`${x},${y + 1}`)) edges.push([[x1, y1], [x0, y1]]);
    if (!cellSet.has(`${x - 1},${y}`)) edges.push([[x0, y1], [x0, y0]]);
  }

  const loops = chainEdges(edges);
  return loops.map(points => smoothClosedPath(points, tile)).join(" ");
}

function chainEdges(edges) {
  const key = point => `${point[0]},${point[1]}`;
  const outgoing = new Map();
  edges.forEach(edge => {
    const startKey = key(edge[0]);
    if (!outgoing.has(startKey)) outgoing.set(startKey, []);
    outgoing.get(startKey).push(edge);
  });

  const used = new Set();
  const loops = [];

  edges.forEach(edge => {
    const edgeKey = `${key(edge[0])}>${key(edge[1])}`;
    if (used.has(edgeKey)) return;

    const loop = [edge[0], edge[1]];
    used.add(edgeKey);
    let current = edge[1];

    while (key(current) !== key(edge[0])) {
      const candidates = outgoing.get(key(current)) || [];
      const next = candidates.find(candidate => {
        const candidateKey = `${key(candidate[0])}>${key(candidate[1])}`;
        return !used.has(candidateKey);
      });
      if (!next) break;
      loop.push(next[1]);
      used.add(`${key(next[0])}>${key(next[1])}`);
      current = next[1];
    }

    loops.push(simplifyLoop(loop));
  });

  return loops;
}

function simplifyLoop(points) {
  if (points.length < 4) return points;
  const simplified = [points[0]];
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = simplified[simplified.length - 1];
    const current = points[i];
    const next = points[i + 1];
    const dx1 = current[0] - prev[0];
    const dy1 = current[1] - prev[1];
    const dx2 = next[0] - current[0];
    const dy2 = next[1] - current[1];
    if (dx1 === dx2 && dy1 === dy2) continue;
    simplified.push(current);
  }
  simplified.push(points[points.length - 1]);
  return simplified;
}

function smoothClosedPath(points, tile) {
  if (points.length < 3) return "";
  const loop = [...points];
  if (loop[0][0] !== loop[loop.length - 1][0] || loop[0][1] !== loop[loop.length - 1][1]) loop.push(loop[0]);

  const organicLoop = createOrganicLoop(loop, tile);

  let d = `M ${organicLoop[0][0]} ${organicLoop[0][1]}`;
  for (let i = 1; i < organicLoop.length - 1; i += 1) {
    const current = organicLoop[i];
    const next = organicLoop[i + 1];
    const midX = (current[0] + next[0]) / 2;
    const midY = (current[1] + next[1]) / 2;
    d += ` Q ${current[0]} ${current[1]} ${midX} ${midY}`;
  }
  d += " Z";
  return d;
}

function createOrganicLoop(loop, tile) {
  const tension = tile * 0.22;
  const smoothed = chaikinClosed(loop, 2);

  return smoothed.map((point, index) => {
    if (index === 0 || index === smoothed.length - 1) return point;

    const prev = smoothed[(index - 1 + smoothed.length - 1) % (smoothed.length - 1)];
    const next = smoothed[(index + 1) % (smoothed.length - 1)];
    const tangentX = next[0] - prev[0];
    const tangentY = next[1] - prev[1];
    const length = Math.hypot(tangentX, tangentY) || 1;
    const normalX = -tangentY / length;
    const normalY = tangentX / length;
    const noise = seededNoise(point[0], point[1], index);
    const offset = noise * tension;

    return [
      round(point[0] + normalX * offset, 2),
      round(point[1] + normalY * offset, 2)
    ];
  });
}

function chaikinClosed(points, iterations) {
  let current = [...points];

  for (let iter = 0; iter < iterations; iter += 1) {
    const refined = [];
    for (let i = 0; i < current.length - 1; i += 1) {
      const p0 = current[i];
      const p1 = current[i + 1];
      refined.push([
        round(p0[0] * 0.75 + p1[0] * 0.25, 2),
        round(p0[1] * 0.75 + p1[1] * 0.25, 2)
      ]);
      refined.push([
        round(p0[0] * 0.25 + p1[0] * 0.75, 2),
        round(p0[1] * 0.25 + p1[1] * 0.75, 2)
      ]);
    }
    refined.push(refined[0]);
    current = refined;
  }

  return current;
}

function seededNoise(x, y, salt) {
  const raw = Math.sin(x * 12.9898 + y * 78.233 + salt * 37.719) * 43758.5453;
  return (raw - Math.floor(raw)) * 2 - 1;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map(char => char + char).join("") : clean;
  const num = Number.parseInt(value, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildRoutePaths(cells, width, height, tile, margin) {
  const routeSet = new Set(cells.map(({x, y}) => `${x},${y}`));
  const visited = new Set();
  const paths = [];

  cells.forEach(cell => {
    const neighbors = getRouteNeighbors(cell, routeSet);
    const cellKey = `${cell.x},${cell.y}`;
    if (visited.has(cellKey) || neighbors.length > 2) return;

    const chain = [];
    let current = cell;
    let previousKey = null;

    while (current) {
      const currentKey = `${current.x},${current.y}`;
      if (visited.has(currentKey)) break;
      visited.add(currentKey);
      chain.push(current);

      const next = getRouteNeighbors(current, routeSet).find(neighbor => `${neighbor.x},${neighbor.y}` !== previousKey);
      previousKey = currentKey;
      current = next || null;
    }

    if (chain.length > 1) paths.push(smoothRoutePath(chain, tile, margin));
  });

  cells.forEach(cell => {
    const cellKey = `${cell.x},${cell.y}`;
    if (visited.has(cellKey)) return;
    visited.add(cellKey);
    paths.push(smoothRoutePath([cell], tile, margin));
  });

  return paths;
}

function getRouteNeighbors(cell, routeSet) {
  return [
    {x: cell.x + 1, y: cell.y},
    {x: cell.x - 1, y: cell.y},
    {x: cell.x, y: cell.y + 1},
    {x: cell.x, y: cell.y - 1}
  ].filter(candidate => routeSet.has(`${candidate.x},${candidate.y}`));
}

function smoothRoutePath(cells, tile, margin) {
  const points = cells.map(({x, y}) => [margin + x * tile + tile / 2, margin + y * tile + tile / 2]);
  if (points.length === 1) {
    const [x, y] = points[0];
    return `M ${x - 2} ${y} L ${x + 2} ${y}`;
  }

  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current[0] + next[0]) / 2;
    const midY = (current[1] + next[1]) / 2;
    d += ` Q ${current[0]} ${current[1]} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

function renderRouteVehicles(routePaths) {
  routePaths.forEach((pathD, routeIndex) => {
    const points = extractRoutePoints(pathD);
    const length = estimatePolylineLength(points);
    if (length < 220) return;
    const count = Math.max(1, Math.floor(length / 520));

    for (let vehicleIndex = 0; vehicleIndex < count; vehicleIndex += 1) {
      const duration = round(34 + ((routeIndex * 9 + vehicleIndex * 13) % 12), 2);
      const startOffset = round(((routeIndex * 0.13) + (vehicleIndex * 0.41)) % 1, 3);
      const gray = 192 + ((routeIndex * 17 + vehicleIndex * 23) % 42);
      const group = createSvg("g", {
        class: "route-vehicle",
        style: `--vehicle-shade: rgb(${gray}, ${gray}, ${gray}); --vehicle-stroke: rgb(${Math.max(86, gray - 110)}, ${Math.max(86, gray - 110)}, ${Math.max(86, gray - 110)});`
      });

      group.appendChild(createSvg("rect", {
        x: -5.2,
        y: -1.8,
        width: 12,
        height: 5.2,
        rx: 1.6,
        ry: 1.6,
        class: "route-vehicle-shadow"
      }));
      group.appendChild(createSvg("rect", {
        x: -6,
        y: -2.6,
        width: 12,
        height: 5.2,
        rx: 1.4,
        ry: 1.4,
        class: "route-vehicle-body"
      }));
      const motion = createSvg("animateMotion", {
        dur: `${duration}s`,
        repeatCount: "indefinite",
        rotate: "auto",
        keyPoints: `${startOffset};1`,
        keyTimes: "0;1",
        calcMode: "linear"
      });
      motion.appendChild(createSvg("mpath", {href: `#route-path-${routeIndex}`}));
      group.appendChild(motion);
      routeLayer.appendChild(group);
    }
  });
}

function extractRoutePoints(pathD) {
  const tokens = pathD.match(/[MLQ]|-?\d*\.?\d+/g) || [];
  const points = [];
  for (let i = 0; i < tokens.length; ) {
    const token = tokens[i];
    if (token === "M" || token === "L") {
      points.push([Number(tokens[i + 1]), Number(tokens[i + 2])]);
      i += 3;
    } else if (token === "Q") {
      points.push([Number(tokens[i + 3]), Number(tokens[i + 4])]);
      i += 5;
    } else {
      i += 1;
    }
  }
  return points;
}

function estimatePolylineLength(points) {
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    total += Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
  }
  return total;
}

function showSelection(title, description) {
  if (Date.now() < state.suppressClickUntil) return;
  selectionCard.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(description)}</p>`;
}

function setLegendHover(char) {
  state.hoveredLegendChar = char;
  applyLegendHoverState();
}

function applyLegendHoverState() {
  const activeChar = state.viewMode === "map" ? state.hoveredLegendChar : null;
  const hasHover = Boolean(activeChar);
  mapFrame.classList.toggle("legend-focus-active", hasHover);

  legendRoot.querySelectorAll(".legend-item").forEach(item => {
    item.classList.toggle("is-active", hasHover && item.dataset.char === activeChar);
    item.classList.toggle("is-dimmed", hasHover && item.dataset.char !== activeChar);
  });

  terrainLayer.querySelectorAll(".terrain-region, .terrain-pattern").forEach(node => {
    const matches = node.getAttribute("data-char") === activeChar;
    node.classList.toggle("is-highlighted", hasHover && matches);
    node.classList.toggle("is-dimmed", hasHover && !matches);
  });

  terrainShadowLayer.classList.toggle("is-dimmed", hasHover);

  poiLayer.querySelectorAll(".poi-marker").forEach(node => {
    const matches = node.getAttribute("data-char") === activeChar;
    node.classList.toggle("is-highlighted", hasHover && matches);
    node.classList.toggle("is-dimmed", hasHover && !matches);
  });

  labelLayer.querySelectorAll(".poi-label, .poi-subtext").forEach(node => {
    const matches = node.getAttribute("data-char") === activeChar;
    node.classList.toggle("is-highlighted", hasHover && matches);
    node.classList.toggle("is-dimmed", hasHover && !matches);
  });

  [influenceLayer, routeLayer, weatherLayer, cloudShadowLayer, cloudLayer].forEach(layer => {
    layer.classList.toggle("is-dimmed", hasHover);
  });
}

function applyInfluenceFocusState() {
  const activeKey = state.viewMode === "influence" ? (state.pinnedInfluenceKey || state.hoveredInfluenceKey) : null;
  const activeFaction = activeKey ? INFLUENCE_FACTIONS.find(entry => entry.id === activeKey) : null;
  const activeChar = activeFaction ? activeFaction.char : null;
  const hasFocus = Boolean(activeKey);

  mapFrame.classList.toggle("influence-focus-active", hasFocus);

  influenceLegendRoot.querySelectorAll(".influence-item").forEach(item => {
    const matches = item.dataset.influenceKey === activeKey;
    item.classList.toggle("is-active", hasFocus && matches);
    item.classList.toggle("is-selected", state.pinnedInfluenceKey === item.dataset.influenceKey);
    item.classList.toggle("is-dimmed", hasFocus && !matches);
  });

  influenceLayer.querySelectorAll(".influence-region, .influence-heraldry").forEach(node => {
    const matches = node.classList.contains("influence-region")
      ? node.getAttribute("data-influence-char") === activeChar
      : node.getAttribute("data-influence-key") === activeKey;
    node.classList.toggle("is-highlighted", hasFocus && matches);
    node.classList.toggle("is-dimmed", hasFocus && !matches);
  });

  poiLayer.querySelectorAll(".poi-marker").forEach(node => {
    const matches = hasInfluenceChar(node, activeChar);
    node.classList.toggle("is-highlighted", hasFocus && matches);
    node.classList.toggle("is-dimmed", hasFocus && !matches);
  });

  labelLayer.querySelectorAll(".poi-label, .poi-subtext").forEach(node => {
    const matches = hasInfluenceChar(node, activeChar);
    node.classList.toggle("is-highlighted", hasFocus && matches);
    node.classList.toggle("is-dimmed", hasFocus && !matches);
  });

  [terrainLayer, terrainShadowLayer, routeLayer, weatherLayer, cloudShadowLayer, cloudLayer].forEach(layer => {
    layer.classList.toggle("is-dimmed", hasFocus);
  });
}

function hasInfluenceChar(node, activeChar) {
  if (!activeChar) return false;
  const chars = node.getAttribute("data-influence-chars") || "";
  return chars.includes(activeChar);
}

function applyElevationFocusState() {
  const activeChar = state.viewMode === "elevation" ? state.hoveredElevationChar : null;
  const hasFocus = Boolean(activeChar);

  elevationLegendRoot.querySelectorAll(".legend-item").forEach(item => {
    item.classList.toggle("is-active", hasFocus && item.dataset.char === activeChar);
    item.classList.toggle("is-dimmed", hasFocus && item.dataset.char !== activeChar);
  });

  elevationLayer.querySelectorAll(".elevation-region").forEach(node => {
    const matches = node.getAttribute("data-elevation-char") === activeChar;
    node.classList.toggle("is-highlighted", hasFocus && matches);
    node.classList.toggle("is-dimmed", hasFocus && !matches);
  });

  [terrainLayer, terrainShadowLayer, influenceLayer, routeLayer, weatherLayer, cloudShadowLayer, cloudLayer, poiLayer, labelLayer].forEach(layer => {
    layer.classList.toggle("is-dimmed", hasFocus);
  });
}

function applyPopulationFocusState() {
  const activeChar = state.viewMode === "population" ? state.hoveredPopulationChar : null;
  const hasFocus = Boolean(activeChar);

  populationLegendRoot.querySelectorAll(".legend-item").forEach(item => {
    item.classList.toggle("is-active", hasFocus && item.dataset.char === activeChar);
    item.classList.toggle("is-dimmed", hasFocus && item.dataset.char !== activeChar);
  });

  populationLayer.querySelectorAll(".population-region").forEach(node => {
    const matches = node.getAttribute("data-population-char") === activeChar;
    node.classList.toggle("is-highlighted", hasFocus && matches);
    node.classList.toggle("is-dimmed", hasFocus && !matches);
  });

  [terrainLayer, terrainShadowLayer, influenceLayer, elevationLayer, routeLayer, poiLayer, labelLayer].forEach(layer => {
    layer.classList.toggle("is-dimmed", hasFocus);
  });
}

function fitView() {
  if (state.viewMode === "3d") return;
  const {terrain_grid: terrainGrid, pois = []} = state.layout;
  const width = terrainGrid[0].length * state.cellSize + state.margin * 2;
  const height = terrainGrid.length * state.cellSize + state.margin * 2;
  const fanshop = findPoi(pois, "Doomsday Fanshop");
  if (!fanshop) {
    setViewBox({x: 0, y: 0, width, height});
    return;
  }

  const focusX = fanshop.x;
  const focusY = fanshop.y;
  const zoomFactor = isMobileViewport() ? 0.3 : 0.27;
  const viewWidth = width * zoomFactor;
  const viewHeight = height * zoomFactor;
  const targetX = focusX - viewWidth * 0.58;
  const targetY = focusY - viewHeight * 0.58;
  setViewBox({
    x: clamp(targetX, 0, width - viewWidth),
    y: clamp(targetY, 0, height - viewHeight),
    width: viewWidth,
    height: viewHeight
  });
}

function zoomAt(factor, clientX = svg.clientWidth / 2, clientY = svg.clientHeight / 2) {
  if (state.viewMode === "3d") return;
  if (!state.viewBox) return;
  const bounds = svg.getBoundingClientRect();
  const focusX = state.viewBox.x + (clientX / bounds.width) * state.viewBox.width;
  const focusY = state.viewBox.y + (clientY / bounds.height) * state.viewBox.height;
  const nextWidth = state.viewBox.width * factor;
  const nextHeight = state.viewBox.height * factor;

  setViewBox({
    x: focusX - (clientX / bounds.width) * nextWidth,
    y: focusY - (clientY / bounds.height) * nextHeight,
    width: nextWidth,
    height: nextHeight
  });
}

function setViewBox({x, y, width, height}) {
  if (state.viewMode === "3d") return;
  state.viewBox = {x, y, width, height};
  svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
  schedulePoiLabelSizing();
}

async function updateThreeView(terrainGrid, elevationGrid, influenceData, pois) {
  if (!window.THREE || !map3dRoot) return;
  ensureThreeScene();

  const cols = terrainGrid[0].length;
  const rows = terrainGrid.length;
  const heightScale = 3.4;
  const smoothGrid = smoothElevationGrid(elevationGrid, 1);
  const detailScale = 2;
  const widthSegments = Math.max(1, (cols - 1) * detailScale);
  const heightSegments = Math.max(1, (rows - 1) * detailScale);
  const geometry = new THREE.PlaneGeometry(cols, rows, widthSegments, heightSegments);
  const positions = geometry.attributes.position;
  const sampledHeights = [];
  for (let y = 0; y <= heightSegments; y += 1) {
    for (let x = 0; x <= widthSegments; x += 1) {
      const index = y * (widthSegments + 1) + x;
      const sampleX = (x / widthSegments) * (cols - 1);
      const sampleY = (y / heightSegments) * (rows - 1);
      let elevation = sampleElevation(smoothGrid, sampleX, sampleY);
      const routeFactor = getRouteFlattenFactor(terrainGrid, sampleX, sampleY);
      if (routeFactor > 0) {
        const routeLevel = sampleRouteLevel(smoothGrid, terrainGrid, sampleX, sampleY, elevation);
        const hardRouteFactor = routeFactor > 0.38 ? 1 : routeFactor * 0.9;
        elevation = elevation * (1 - hardRouteFactor) + routeLevel * hardRouteFactor;
      }
      const onRoute = routeFactor > 0.28;
      const roughness = onRoute
        ? 0
        : seededNoise(sampleX * 0.9, sampleY * 0.9, 17) * 0.18 +
          seededNoise(sampleX * 2.6, sampleY * 2.6, 43) * 0.08;
      sampledHeights[index] = elevation * heightScale + roughness;
    }
  }
  const minHeight = sampledHeights.reduce((min, value) => Math.min(min, value), Number.POSITIVE_INFINITY);
  const terrainLift = 0.08;
  for (let index = 0; index < sampledHeights.length; index += 1) {
    positions.setZ(index, sampledHeights[index] - minHeight + terrainLift);
  }
  geometry.computeVertexNormals();

  const buildId = ++threeTextureBuildId;
  const texture = await buildThreeTexture(terrainGrid, influenceData);
  if (buildId !== threeTextureBuildId || state.viewMode !== "3d") {
    if (texture && typeof texture.dispose === "function") texture.dispose();
    geometry.dispose();
    return;
  }
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  if (threeTerrainMesh) {
    threeTerrainMesh.geometry.dispose();
    threeTerrainMesh.material.map.dispose();
    threeTerrainMesh.geometry = geometry;
    threeTerrainMesh.material.map = texture;
    threeTerrainMesh.material.needsUpdate = true;
  } else {
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: new THREE.Color("#f4ead6"),
      roughness: 0.98,
      metalness: 0.0
    });
    threeTerrainMesh = new THREE.Mesh(geometry, material);
    threeTerrainMesh.rotation.x = -Math.PI / 2;
    threeTerrainMesh.position.set(0, 0, 0);
    threeTerrainMesh.castShadow = false;
    threeTerrainMesh.receiveShadow = false;
    threeScene.add(threeTerrainMesh);
  }

  updateThreeSkirtMesh(cols, rows, widthSegments, heightSegments, sampledHeights, minHeight, terrainLift);
  updateThreeBaseMesh(cols, rows);
  updateThreeForestLayer(terrainGrid, smoothGrid, minHeight, terrainLift, heightScale, cols, rows);
  updateThreePropLayer(terrainGrid, smoothGrid, minHeight, terrainLift, heightScale, cols, rows);
  updateThreeLandmarkLayer(pois, terrainGrid, smoothGrid, minHeight, terrainLift, heightScale, cols, rows);
  updateThreePoiLayer(pois, terrainGrid, smoothGrid, minHeight, terrainLift, heightScale, cols, rows);

  const maxDim = Math.max(cols, rows);
  updateThreeGroundPlane(maxDim);

  threeCamera.position.set(maxDim * 0.32, maxDim * 0.78, maxDim * 0.56);
  threeControls.target.set(0, 0, 0);
  threeControls.update();
  resizeThreeScene();
}

function ensureThreeScene() {
  if (threeRenderer || !window.THREE || !map3dRoot) return;

  threeRenderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  threeRenderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  if ("outputColorSpace" in threeRenderer && window.THREE.SRGBColorSpace) {
    threeRenderer.outputColorSpace = window.THREE.SRGBColorSpace;
  } else if ("outputEncoding" in threeRenderer && window.THREE.sRGBEncoding) {
    threeRenderer.outputEncoding = window.THREE.sRGBEncoding;
  }
  if ("toneMapping" in threeRenderer && window.THREE.ACESFilmicToneMapping) {
    threeRenderer.toneMapping = window.THREE.ACESFilmicToneMapping;
    threeRenderer.toneMappingExposure = 0.72;
  }
  map3dRoot.appendChild(threeRenderer.domElement);

  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color("#161311");

  threeCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 2000);
  threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
  threeControls.enableDamping = true;
  threeControls.dampingFactor = 0.06;
  threeControls.minPolarAngle = Math.PI * 0.08;
  threeControls.maxPolarAngle = Math.PI * 0.36;
  threeControls.minDistance = 40;
  threeControls.maxDistance = 260;

  const ambient = new THREE.AmbientLight("#bca27b", 0.52);
  const key = new THREE.DirectionalLight("#f4d5a5", 0.78);
  key.position.set(60, 120, 40);
  const fill = new THREE.DirectionalLight("#7d8f9b", 0.22);
  fill.position.set(-70, 50, -30);
  const rim = new THREE.DirectionalLight("#4f3d2d", 0.12);
  rim.position.set(15, 30, -90);
  threeScene.add(ambient, key, fill, rim);

  if (threeFrameId) cancelAnimationFrame(threeFrameId);
  animateThreeScene();
  window.addEventListener("resize", resizeThreeScene);
}

function updateThreeGroundPlane(maxDim) {
  if (!window.THREE || !threeScene) return;
  const groundSize = Math.max(900, maxDim * 18);
  const groundY = -3.45;

  if (threeGroundMesh) {
    threeGroundMesh.scale.setScalar(groundSize / 1000);
    threeGroundMesh.position.y = groundY;
    return;
  }

  const texture = buildThreeGroundTexture();
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(groundSize / 120, groundSize / 120);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipMapLinearFilter;

  const geometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    color: new THREE.Color("#cbb99a"),
    roughness: 1,
    metalness: 0,
    transparent: false
  });

  threeGroundMesh = new THREE.Mesh(geometry, material);
  threeGroundMesh.rotation.x = -Math.PI / 2;
  threeGroundMesh.position.set(0, groundY, 0);
  threeGroundMesh.receiveShadow = false;
  threeGroundMesh.castShadow = false;
  threeScene.add(threeGroundMesh);
  threeGroundMesh.scale.setScalar(groundSize / 1000);
}

function updateThreeBaseMesh(cols, rows) {
  if (!window.THREE || !threeScene) return;
  const inset = 0.04;
  const baseDepth = 1.6;
  const baseCenterY = -baseDepth * 2;

  if (threeBaseMesh) {
    threeBaseMesh.scale.set(cols / 100, 1, rows / 100);
    threeBaseMesh.position.set(0, baseCenterY, 0);
    return;
  }

  const geometry = new THREE.BoxGeometry(100 - inset, baseDepth * 2, 100 - inset);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#d8c9aa"),
    roughness: 1,
    metalness: 0
  });
  threeBaseMesh = new THREE.Mesh(geometry, material);
  threeBaseMesh.position.set(0, baseCenterY, 0);
  threeBaseMesh.castShadow = false;
  threeBaseMesh.receiveShadow = false;
  threeScene.add(threeBaseMesh);
  threeBaseMesh.scale.set(cols / 100, 1, rows / 100);
}

function updateThreeForestLayer(terrainGrid, smoothGrid, minHeight, terrainLift, heightScale, cols, rows) {
  if (!window.THREE || !threeScene) return;

  if (!threeForestGroup) {
    threeForestGroup = new THREE.Group();
    threeForestGroup.name = "forest-clusters";
    threeScene.add(threeForestGroup);
  }

  const placements = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (terrainGrid[y][x] !== "W") continue;
      const density = seededNoise(x * 1.21, y * 1.37, 211);
      if (density < 0.22) continue;
      const count = density > 0.9 ? 2 : 1;
      for (let i = 0; i < count; i += 1) {
        const ox = seededNoise(x * 3.7 + i * 11, y * 2.9, 301) * 0.34;
        const oy = seededNoise(x * 2.1, y * 4.3 + i * 13, 409) * 0.34;
        const sx = x + 0.5 + ox;
        const sy = y + 0.5 + oy;
        if (getTerrainSlope(smoothGrid, sx, sy) > 0.22) continue;
        const scale = 0.55 + ((seededNoise(x * 5.3 + i, y * 3.1, 517) + 1) / 2) * 0.62;
        placements.push({x: sx, y: sy, scale});
      }
    }
  }

  while (threeForestGroup.children.length > placements.length) {
    const child = threeForestGroup.children[threeForestGroup.children.length - 1];
    threeForestGroup.remove(child);
  }

  placements.forEach((placement, index) => {
    let cluster = threeForestGroup.children[index];
    if (!cluster) {
      cluster = createThreeTreeCluster();
      threeForestGroup.add(cluster);
    }

    const worldX = placement.x - cols / 2;
    const worldZ = placement.y - rows / 2;
    cluster.scale.setScalar(placement.scale);
    alignTreeClusterToTerrain(cluster, placement, smoothGrid, terrainGrid, minHeight, terrainLift, heightScale, cols, rows);
    const worldY = sampleThreeTerrainWorldY(smoothGrid, terrainGrid, placement.x, placement.y, minHeight, terrainLift, heightScale) - 0.04;
    cluster.position.set(worldX, worldY, worldZ);
    cluster.visible = true;
  });

  threeForestGroup.children.forEach((child, index) => {
    child.visible = index < placements.length;
  });
}

function updateThreePropLayer(terrainGrid, smoothGrid, minHeight, terrainLift, heightScale, cols, rows) {
  if (!window.THREE || !threeScene) return;

  if (!threePropGroup) {
    threePropGroup = new THREE.Group();
    threePropGroup.name = "biome-props";
    threeScene.add(threePropGroup);
  }

  const placements = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const char = terrainGrid[y][x];
      if (!["I", "E", "H", "G", "A", "V", "R"].includes(char)) continue;
      const seed = seededNoise(x * 1.91, y * 1.37, 601);
      if (seed < 0.64 && !["I", "E"].includes(char)) continue;
      const count =
        char === "I" ? (seed > 0.92 ? 2 : 1) :
        char === "E" ? (seed > 0.88 ? 2 : 1) :
        1;

      for (let i = 0; i < count; i += 1) {
        const ox = seededNoise(x * 2.7 + i * 9, y * 4.1, 677) * 0.26;
        const oy = seededNoise(x * 3.3, y * 2.4 + i * 7, 733) * 0.26;
        const px = x + 0.5 + ox;
        const py = y + 0.5 + oy;
        if (getTerrainSlope(smoothGrid, px, py) > 0.26) continue;
        const scale = 0.8 + ((seededNoise(x * 2.3 + i, y * 5.1, 811) + 1) / 2) * 0.9;
        placements.push({char, x: px, y: py, scale});
      }
    }
  }

  while (threePropGroup.children.length > placements.length) {
    const child = threePropGroup.children[threePropGroup.children.length - 1];
    threePropGroup.remove(child);
  }

  placements.forEach((placement, index) => {
    let prop = threePropGroup.children[index];
    if (!prop || prop.userData.kind !== placement.char) {
      if (prop) threePropGroup.remove(prop);
      prop = createThreeBiomeProp(placement.char);
      threePropGroup.add(prop);
      if (index !== threePropGroup.children.length - 1) {
        threePropGroup.children.splice(index, 0, threePropGroup.children.pop());
      }
    }

    const worldX = placement.x - cols / 2;
    const worldZ = placement.y - rows / 2;
    const worldY = sampleThreeTerrainWorldY(smoothGrid, terrainGrid, placement.x, placement.y, minHeight, terrainLift, heightScale);
    prop.position.set(worldX, worldY, worldZ);
    prop.scale.setScalar(placement.scale);
    prop.visible = true;
  });

  threePropGroup.children.forEach((child, index) => {
    child.visible = index < placements.length;
  });
}

function createThreeBiomeProp(char) {
  const group = new THREE.Group();
  group.userData.kind = char;

  if (char === "I") {
    const towerMaterial = new THREE.MeshStandardMaterial({color: new THREE.Color("#6f5f50"), roughness: 1, metalness: 0});
    const pipeMaterial = new THREE.MeshStandardMaterial({color: new THREE.Color("#8e765f"), roughness: 1, metalness: 0});
    [0, 1, 2].forEach(i => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.7 + i * 0.08, 6), towerMaterial);
      tower.position.set(-0.18 + i * 0.18, tower.geometry.parameters.height / 2, -0.05 + i * 0.04);
      group.add(tower);
    });
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.24), pipeMaterial);
    block.position.set(0, 0.09, 0.12);
    group.add(block);
  } else if (char === "E") {
    const metal = new THREE.MeshStandardMaterial({color: new THREE.Color("#55736a"), roughness: 1, metalness: 0});
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.05), metal);
    mast.position.set(0, 0.45, 0);
    group.add(mast);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.04), metal);
    cross.position.set(0, 0.72, 0);
    group.add(cross);
  } else if (char === "H" || char === "G") {
    const puddleColor = char === "H" ? "#546964" : "#759053";
    const puddle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.26, 0.03, 16),
      new THREE.MeshStandardMaterial({color: new THREE.Color(puddleColor), roughness: 0.9, metalness: 0})
    );
    puddle.position.set(0, 0.012, 0);
    group.add(puddle);
    if (char === "G") {
      const fungus = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.28, 7),
        new THREE.MeshStandardMaterial({color: new THREE.Color("#8ba35f"), roughness: 1, metalness: 0})
      );
      fungus.position.set(0.08, 0.14, -0.04);
      group.add(fungus);
    }
  } else if (char === "A") {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.34, 8),
      new THREE.MeshStandardMaterial({color: new THREE.Color("#5b4a3d"), roughness: 1, metalness: 0})
    );
    cone.position.set(0, 0.17, 0);
    group.add(cone);
    const ember = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshStandardMaterial({color: new THREE.Color("#b54a2d"), roughness: 0.8, metalness: 0})
    );
    ember.position.set(0.02, 0.06, 0.03);
    group.add(ember);
  } else if (char === "V") {
    const glass = new THREE.MeshStandardMaterial({color: new THREE.Color("#b2d5ce"), roughness: 0.55, metalness: 0});
    const shard1 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.42, 5), glass);
    shard1.position.set(-0.05, 0.21, 0);
    shard1.rotation.z = 0.18;
    group.add(shard1);
    const shard2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 5), glass);
    shard2.position.set(0.12, 0.15, 0.03);
    shard2.rotation.z = -0.22;
    group.add(shard2);
  } else if (char === "R") {
    const stone = new THREE.MeshStandardMaterial({color: new THREE.Color("#a48a76"), roughness: 1, metalness: 0});
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.32), stone);
    base.position.set(0, 0.05, 0);
    group.add(base);
    const spire = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.08), stone);
    spire.position.set(0, 0.31, 0);
    group.add(spire);
  }

  group.renderOrder = 3;
  return group;
}

function updateThreeLandmarkLayer(pois, terrainGrid, smoothGrid, minHeight, terrainLift, heightScale, cols, rows) {
  if (!window.THREE || !threeScene) return;

  if (!threeLandmarkGroup) {
    threeLandmarkGroup = new THREE.Group();
    threeLandmarkGroup.name = "landmarks";
    threeScene.add(threeLandmarkGroup);
  }

  const landmarkNames = [
    "Gerichtskirche",
    "Die Orgel",
    "Glaspforte",
    "Schacht 47",
    "Der Hafen",
    "Nullpunkt",
    "Leithive-Kern"
  ];
  const selected = pois.filter(poi => landmarkNames.includes(poi.name));

  while (threeLandmarkGroup.children.length > selected.length) {
    const child = threeLandmarkGroup.children[threeLandmarkGroup.children.length - 1];
    threeLandmarkGroup.remove(child);
  }

  selected.forEach((poi, index) => {
    let mesh = threeLandmarkGroup.children[index];
    if (!mesh || mesh.userData.name !== poi.name) {
      if (mesh) threeLandmarkGroup.remove(mesh);
      mesh = createThreeLandmarkMesh(poi.name);
      threeLandmarkGroup.add(mesh);
    }

    const worldX = poi.x - cols / 2 + 0.5;
    const worldZ = poi.y - rows / 2 + 0.5;
    const worldY = sampleThreeTerrainWorldY(smoothGrid, terrainGrid, poi.x, poi.y, minHeight, terrainLift, heightScale);
    mesh.position.set(worldX, worldY, worldZ);
    mesh.visible = true;
  });

  threeLandmarkGroup.children.forEach((child, index) => {
    child.visible = index < selected.length;
  });
}

function createThreeLandmarkMesh(name) {
  const group = new THREE.Group();
  group.userData.name = name;

  const stone = new THREE.MeshStandardMaterial({color: new THREE.Color("#8c7763"), roughness: 1, metalness: 0});
  const metal = new THREE.MeshStandardMaterial({color: new THREE.Color("#6b5b50"), roughness: 1, metalness: 0});
  const glass = new THREE.MeshStandardMaterial({color: new THREE.Color("#b9d8d4"), roughness: 0.6, metalness: 0});

  if (name === "Gerichtskirche") {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.28, 0.5), stone);
    base.position.set(0, 0.14, 0);
    group.add(base);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.82, 0.22), stone);
    tower.position.set(0, 0.69, 0);
    group.add(tower);
  } else if (name === "Die Orgel") {
    [-0.22, -0.08, 0.08, 0.22].forEach((x, i) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.55 + i * 0.08, 6), metal);
      pipe.position.set(x, pipe.geometry.parameters.height / 2, 0);
      group.add(pipe);
    });
  } else if (name === "Glaspforte") {
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), glass);
    left.position.set(-0.18, 0.3, 0);
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), glass);
    right.position.set(0.18, 0.3, 0);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.12), glass);
    lintel.position.set(0, 0.55, 0);
    group.add(left, right, lintel);
  } else if (name === "Schacht 47") {
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 14), metal);
    rim.position.set(0, 0.04, 0);
    const pit = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.46, 14), new THREE.MeshStandardMaterial({color: new THREE.Color("#3f332c"), roughness: 1, metalness: 0}));
    pit.position.set(0, -0.18, 0);
    group.add(rim, pit);
  } else if (name === "Der Hafen") {
    const dock = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.18), stone);
    dock.position.set(0, 0.04, 0);
    const crane = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.08), metal);
    crane.position.set(0.18, 0.24, 0);
    group.add(dock, crane);
  } else if (name === "Nullpunkt") {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.42), stone);
    block.position.set(0, 0.08, 0);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), metal);
    mast.position.set(0, 0.36, 0);
    group.add(block, mast);
  } else if (name === "Leithive-Kern") {
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.42, 8), metal);
    core.position.set(0, 0.21, 0);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 6), new THREE.MeshStandardMaterial({color: new THREE.Color("#8bb49c"), roughness: 0.9, metalness: 0}));
    spike.position.set(0, 0.55, 0);
    group.add(core, spike);
  }

  group.scale.setScalar(1.5);
  group.renderOrder = 5;
  return group;
}

function createThreeTreeCluster() {
  const group = new THREE.Group();
  const trunkGeometry = new THREE.CylinderGeometry(0.03, 0.045, 0.22, 6);
  const canopyGeometry = new THREE.ConeGeometry(0.15, 0.34, 6);
  const trunkMaterial = new THREE.MeshStandardMaterial({color: new THREE.Color("#5a4636"), roughness: 1, metalness: 0});
  const canopyMaterial = new THREE.MeshStandardMaterial({color: new THREE.Color("#5d7450"), roughness: 1, metalness: 0});

  const stems = [
    {x: 0, z: 0, s: 1},
    {x: -0.12, z: 0.07, s: 0.84},
    {x: 0.11, z: 0.05, s: 0.76}
  ];

  group.userData.stems = [];
  stems.forEach(stem => {
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(stem.x, 0.11 * stem.s, stem.z);
    trunk.scale.setScalar(stem.s);
    group.add(trunk);

    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.set(stem.x, 0.33 * stem.s, stem.z);
    canopy.scale.setScalar(stem.s);
    group.add(canopy);

    const canopy2 = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy2.position.set(stem.x, 0.45 * stem.s, stem.z);
    canopy2.scale.set(stem.s * 0.78, stem.s * 0.72, stem.s * 0.78);
    group.add(canopy2);

    group.userData.stems.push({stem, trunk, canopy, canopy2});
  });

  group.renderOrder = 4;
  return group;
}

function alignTreeClusterToTerrain(cluster, placement, smoothGrid, terrainGrid, minHeight, terrainLift, heightScale) {
  const stems = cluster.userData.stems || [];
  if (!stems.length) return;

  const scale = cluster.scale.x || 1;
  const rootHeights = stems.map(({stem}) =>
    sampleThreeTerrainWorldY(
      smoothGrid,
      terrainGrid,
      placement.x + stem.x * scale,
      placement.y + stem.z * scale,
      minHeight,
      terrainLift,
      heightScale
    )
  );
  const minRootHeight = Math.min(...rootHeights);

  stems.forEach(({stem, trunk, canopy, canopy2}, index) => {
    const rootOffset = rootHeights[index] - minRootHeight;
    trunk.position.set(stem.x, rootOffset + 0.11 * stem.s, stem.z);
    canopy.position.set(stem.x, rootOffset + 0.33 * stem.s, stem.z);
    canopy2.position.set(stem.x, rootOffset + 0.45 * stem.s, stem.z);
  });
}

function updateThreePoiLayer(pois, terrainGrid, smoothGrid, minHeight, terrainLift, heightScale, cols, rows) {
  if (!window.THREE || !threeScene) return;

  if (!document.getElementById("toggle-pois").checked) {
    if (threePoiGroup) threePoiGroup.visible = false;
    return;
  }

  if (!threePoiGroup) {
    threePoiGroup = new THREE.Group();
    threePoiGroup.name = "poi-billboards";
    threeScene.add(threePoiGroup);
  }
  threePoiGroup.visible = true;

  while (threePoiGroup.children.length > pois.length) {
    const child = threePoiGroup.children[threePoiGroup.children.length - 1];
    threePoiGroup.remove(child);
    if (child.material && child.material.map && typeof child.material.map.dispose === "function") child.material.map.dispose();
    if (child.material && typeof child.material.dispose === "function") child.material.dispose();
  }

  pois.forEach((poi, index) => {
    let sprite = threePoiGroup.children[index];
    const billboardCanvas = buildPoiBillboardCanvas(poi);
    if (!sprite) {
      const texture = new THREE.CanvasTexture(billboardCanvas);
      texture.needsUpdate = true;
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: false
      });
      sprite = new THREE.Sprite(material);
      threePoiGroup.add(sprite);
    } else {
      sprite.material.map.dispose();
      sprite.material.map = new THREE.CanvasTexture(billboardCanvas);
      sprite.material.map.needsUpdate = true;
    }

    const worldX = poi.x - cols / 2 + 0.5;
    const worldZ = poi.y - rows / 2 + 0.5;
    const worldY = sampleThreeTerrainWorldY(smoothGrid, terrainGrid, poi.x, poi.y, minHeight, terrainLift, heightScale) + 0.28;

    sprite.position.set(worldX, worldY, worldZ);
    const baseHeight = 2.15;
    const aspect = billboardCanvas.width / billboardCanvas.height;
    sprite.scale.set(baseHeight * aspect, baseHeight, 1);
    sprite.renderOrder = 8;
    sprite.material.depthTest = false;
    sprite.material.depthWrite = false;
  });
}

function sampleThreeTerrainWorldY(smoothGrid, terrainGrid, x, y, minHeight, terrainLift, heightScale) {
  let elevation = sampleElevation(smoothGrid, x, y);
  const routeFactor = getRouteFlattenFactor(terrainGrid, x, y);
  if (routeFactor > 0) {
    const routeLevel = sampleRouteLevel(smoothGrid, terrainGrid, x, y, elevation);
    const hardRouteFactor = routeFactor > 0.38 ? 1 : routeFactor * 0.9;
    elevation = elevation * (1 - hardRouteFactor) + routeLevel * hardRouteFactor;
  }
  return elevation * heightScale - minHeight + terrainLift;
}

function getTerrainSlope(grid, x, y) {
  const center = sampleElevation(grid, x, y);
  const dx = Math.abs(sampleElevation(grid, x + 0.35, y) - center) + Math.abs(sampleElevation(grid, x - 0.35, y) - center);
  const dy = Math.abs(sampleElevation(grid, x, y + 0.35) - center) + Math.abs(sampleElevation(grid, x, y - 0.35) - center);
  return Math.max(dx, dy);
}

function buildPoiBillboardCanvas(poi) {
  const measureCanvas = document.createElement("canvas");
  measureCanvas.width = 1;
  measureCanvas.height = 1;
  const measureContext = measureCanvas.getContext("2d");
  measureContext.font = "700 30px 'IBM Plex Mono'";
  const titleWidth = Math.ceil(measureContext.measureText(poi.name).width);
  let noteWidth = 0;
  if (poi.note) {
    measureContext.font = "700 20px 'IBM Plex Mono'";
    noteWidth = Math.ceil(measureContext.measureText(poi.note).width);
  }

  const labelWidth = Math.max(titleWidth, noteWidth);
  const bubbleX = 64;
  const textX = 86;
  const rightPadding = 28;
  const bubbleWidth = Math.max(308, labelWidth + (textX - bubbleX) + rightPadding);
  const canvas = document.createElement("canvas");
  canvas.width = bubbleX + bubbleWidth + 28;
  canvas.height = 140;
  const context = canvas.getContext("2d");
  const color = POI_COLORS[poi.type] || "#5b4633";
  const icon = POI_NAME_ICONS[poi.name] || POI_TYPE_ICONS[poi.type] || "\uf3c5";

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(248, 240, 223, 0.9)";
  fillRoundRect(context, bubbleX, 24, bubbleWidth, 72, 16);
  context.strokeStyle = "rgba(74, 52, 33, 0.38)";
  context.lineWidth = 2;
  strokeRoundRect(context, bubbleX, 24, bubbleWidth, 72, 16);

  context.fillStyle = "#f8f0df";
  context.strokeStyle = color;
  context.lineWidth = 12;
  context.beginPath();
  context.arc(44, 60, 24, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = color;
  context.beginPath();
  context.arc(44, 60, 10.5, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = color;
  context.font = "900 34px 'Font Awesome 6 Free'";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(icon, 44, 22);

  context.fillStyle = "rgba(36, 24, 16, 0.92)";
  context.font = "700 30px 'IBM Plex Mono'";
  context.textAlign = "left";
  context.fillText(poi.name, 96, 54);

  if (poi.note) {
    context.fillStyle = "rgba(74, 52, 33, 0.78)";
    context.font = "700 20px 'IBM Plex Mono'";
    context.fillText(poi.note, 96, 82);
  }

  return canvas;
}

function fillRoundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fill();
}

function strokeRoundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.stroke();
}

function updateThreeSkirtMesh(cols, rows, widthSegments, heightSegments, sampledHeights, minHeight, terrainLift) {
  if (!window.THREE || !threeScene) return;

  const skirtDepth = 1.6;
  const skirtGeometry = buildThreeSkirtGeometry(cols, rows, widthSegments, heightSegments, sampledHeights, minHeight, terrainLift, skirtDepth);

  if (threeSkirtMesh) {
    threeSkirtMesh.geometry.dispose();
    threeSkirtMesh.geometry = skirtGeometry;
    return;
  }

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#d6c29f"),
    roughness: 1,
    metalness: 0
  });
  threeSkirtMesh = new THREE.Mesh(skirtGeometry, material);
  threeSkirtMesh.rotation.x = -Math.PI / 2;
  threeSkirtMesh.position.set(0, 0, 0);
  threeSkirtMesh.castShadow = false;
  threeSkirtMesh.receiveShadow = false;
  threeScene.add(threeSkirtMesh);
}

function buildThreeSkirtGeometry(cols, rows, widthSegments, heightSegments, sampledHeights, minHeight, terrainLift, skirtDepth) {
  const points = [];
  const pushQuad = (a, b) => {
    const topA = a.height - minHeight + terrainLift;
    const topB = b.height - minHeight + terrainLift;
    points.push(
      a.x, a.y, topA,
      b.x, b.y, topB,
      a.x, a.y, -skirtDepth,
      b.x, b.y, topB,
      b.x, b.y, -skirtDepth,
      a.x, a.y, -skirtDepth
    );
  };

  const vertexAt = (gridX, gridY) => {
    const index = gridY * (widthSegments + 1) + gridX;
    return {
      x: (gridX / widthSegments) * cols - cols / 2,
      y: (gridY / heightSegments) * rows - rows / 2,
      height: sampledHeights[index]
    };
  };

  for (let x = 0; x < widthSegments; x += 1) pushQuad(vertexAt(x, 0), vertexAt(x + 1, 0));
  for (let y = 0; y < heightSegments; y += 1) pushQuad(vertexAt(widthSegments, y), vertexAt(widthSegments, y + 1));
  for (let x = widthSegments; x > 0; x -= 1) pushQuad(vertexAt(x, heightSegments), vertexAt(x - 1, heightSegments));
  for (let y = heightSegments; y > 0; y -= 1) pushQuad(vertexAt(0, y), vertexAt(0, y - 1));

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function resizeThreeScene() {
  if (!threeRenderer || !threeCamera || !map3dRoot) return;
  const rect = map3dRoot.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  threeRenderer.setSize(width, height, false);
  threeCamera.aspect = width / height;
  threeCamera.updateProjectionMatrix();
}

function animateThreeScene() {
  if (!threeRenderer || !threeScene || !threeCamera) return;
  if (state.viewMode === "3d") {
    if (threeControls) threeControls.update();
    threeRenderer.render(threeScene, threeCamera);
  }
  threeFrameId = requestAnimationFrame(animateThreeScene);
}

async function buildThreeTexture(terrainGrid, influenceData) {
  try {
    const projectedCanvas = await renderSvgTextureCanvas(terrainGrid);
    const projectedContext = projectedCanvas.getContext("2d");
    projectedContext.fillStyle = "rgba(24, 18, 14, 0.035)";
    projectedContext.fillRect(0, 0, projectedCanvas.width, projectedCanvas.height);
    return new THREE.CanvasTexture(projectedCanvas);
  } catch {
    // Fallback stays intentionally simple if SVG rasterization fails in the browser.
  }

  const cols = terrainGrid[0].length;
  const rows = terrainGrid.length;
  const canvas = document.createElement("canvas");
  const size = 28;
  canvas.width = cols * size;
  canvas.height = rows * size;
  const context = canvas.getContext("2d");

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const char = terrainGrid[y][x];
      const style = TERRAIN_STYLES[char] || TERRAIN_STYLES[":"];
      const px = x * size;
      const py = y * size;

      context.fillStyle = style.fill;
      context.fillRect(px, py, size, size);
      paintBiomeTexture(context, char, px, py, size, x, y);

      if (document.getElementById("toggle-influence").checked) {
        const chars = influenceData.cellKeys[y] && influenceData.cellKeys[y][x] ? influenceData.cellKeys[y][x] : "";
        if (chars) {
          const tone = INFLUENCE_STYLES[chars[0]] ? INFLUENCE_STYLES[chars[0]].fill : null;
          if (tone) {
            context.fillStyle = hexToRgba(tone, 0.12);
            context.fillRect(px, py, size, size);
          }
        }
      }
    }
  }

  if (document.getElementById("toggle-routes").checked) {
    const routeCells = collectCells(terrainGrid, "=");
    routeCells.forEach(({x, y}) => {
      const px = x * size;
      const py = y * size;
      context.fillStyle = "#6b655d";
      context.fillRect(px + 2, py + size * 0.24, size - 4, size * 0.52);
      context.strokeStyle = "#47413b";
      context.lineWidth = 2;
      context.strokeRect(px + 2, py + size * 0.24, size - 4, size * 0.52);
      context.strokeStyle = "#c6a06f";
      context.lineWidth = 1.5;
      context.setLineDash([5, 5]);
      context.beginPath();
      context.moveTo(px + 5, py + size * 0.5);
      context.lineTo(px + size - 5, py + size * 0.5);
      context.stroke();
      context.setLineDash([]);
    });
  }

  context.fillStyle = "rgba(24, 18, 14, 0.04)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  return new THREE.CanvasTexture(canvas);
}

async function renderSvgTextureCanvas(terrainGrid) {
  inlineSvgSnapshotStyles(svg);
  const sourceSvg = svg.cloneNode(true);
  sourceSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  sourceSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  sourceSvg.setAttribute("width", svg.getAttribute("width") || String(svg.clientWidth || 1024));
  sourceSvg.setAttribute("height", svg.getAttribute("height") || String(svg.clientHeight || 768));
  sourceSvg.setAttribute("viewBox", svg.getAttribute("viewBox") || "0 0 1000 1000");

  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("x", "0");
  background.setAttribute("y", "0");
  background.setAttribute("width", "100%");
  background.setAttribute("height", "100%");
  background.setAttribute("fill", "#d7c7a4");
  sourceSvg.insertBefore(background, sourceSvg.firstChild);

  removeNode(sourceSvg.querySelector("#base-coord-layer"));
  removeNode(sourceSvg.querySelector("#weather-layer"));
  removeNode(sourceSvg.querySelector("#cloud-shadow-layer"));
  removeNode(sourceSvg.querySelector("#cloud-layer"));
  removeNode(sourceSvg.querySelector("#grid-layer"));
  removeNode(sourceSvg.querySelector("#poi-layer"));
  removeNode(sourceSvg.querySelector("#label-layer"));
  removeNode(sourceSvg.querySelector("#coord-cursor"));
  sourceSvg.querySelectorAll(".route-vehicle").forEach(node => node.remove());

  const serializer = new XMLSerializer();
  const markup = serializer.serializeToString(sourceSvg);
  const blob = new Blob([markup], {type: "image/svg+xml;charset=utf-8"});
  const url = URL.createObjectURL(blob);

  try {
    const image = await loadImage(url);
    const cols = terrainGrid[0].length;
    const rows = terrainGrid.length;
    const cropX = state.margin;
    const cropY = state.margin;
    const cropW = cols * state.cellSize;
    const cropH = rows * state.cellSize;
    const canvas = document.createElement("canvas");
    canvas.width = cropW;
    canvas.height = cropH;
    const context = canvas.getContext("2d");
    context.drawImage(
      image,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      cropW,
      cropH
    );
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function inlineSvgSnapshotStyles(source) {
  const sourceNodes = source.querySelectorAll("*");
  sourceNodes.forEach(node => {
    const computed = window.getComputedStyle(node);
    if (!computed) return;
    [
      "fill",
      "stroke",
      "stroke-width",
      "stroke-dasharray",
      "stroke-linecap",
      "stroke-linejoin",
      "opacity",
      "paint-order",
      "font",
      "font-size",
      "font-family",
      "font-weight",
      "letter-spacing",
      "filter",
      "mix-blend-mode"
    ].forEach(property => {
      const value = computed.getPropertyValue(property);
      if (!value) return;
      node.style.setProperty(property, value);
    });
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Projected 2D map texture could not be loaded"));
    image.src = url;
  });
}

function buildThreeGroundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");

  context.fillStyle = "#d7c7a4";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 900; i += 1) {
    const x = ((i * 37) % 512);
    const y = ((i * 53) % 512);
    const size = 1 + ((i * 17) % 5);
    const alpha = 0.025 + (((i * 29) % 100) / 100) * 0.045;
    context.fillStyle = `rgba(108, 88, 61, ${round(alpha, 3)})`;
    context.fillRect(x, y, size, size);
  }

  context.strokeStyle = "rgba(126, 102, 68, 0.08)";
  context.lineWidth = 1;
  for (let i = -64; i < 640; i += 26) {
    context.beginPath();
    context.moveTo(i, 0);
    context.lineTo(i + 120, 512);
    context.stroke();
  }

  const gradient = context.createRadialGradient(256, 256, 40, 256, 256, 280);
  gradient.addColorStop(0, "rgba(255, 244, 220, 0.06)");
  gradient.addColorStop(1, "rgba(40, 27, 18, 0.12)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);

  return new THREE.CanvasTexture(canvas);
}

function paintBiomeTexture(context, char, px, py, size, cellX, cellY) {
  const drawLine = (x1, y1, x2, y2, color, width, alpha = 1) => {
    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(px + x1, py + y1);
    context.lineTo(px + x2, py + y2);
    context.stroke();
    context.restore();
  };

  const drawCircle = (x, y, r, color, alpha = 1) => {
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = color;
    context.beginPath();
    context.arc(px + x, py + y, r, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  switch (char) {
    case ":":
      drawLine(2, size * 0.66, size - 2, size * 0.5, "#9b8866", 1.1, 0.28);
      drawLine(3, size * 0.18, size - 4, size * 0.08, "#efe2c6", 0.8, 0.18);
      break;
    case ".":
      drawLine(2, size * 0.28, size - 2, size * 0.56, "#a59474", 0.9, 0.24);
      break;
    case "I":
      drawLine(size * 0.14, size * 0.16, size * 0.86, size * 0.84, "#57493a", 1.15, 0.34);
      drawLine(size * 0.5, 2, size * 0.5, size - 2, "#d0b89d", 0.7, 0.12);
      break;
    case "H":
      drawLine(0, size * 0.58, size, size * 0.58, "#5b6f68", 1.1, 0.24);
      drawLine(0, size * 0.24, size, size * 0.2, "#dce6e0", 0.7, 0.12);
      break;
    case "R":
      drawLine(0, 0, size, size, "#7f6254", 0.95, 0.18);
      drawLine(size, 0, 0, size, "#7f6254", 0.95, 0.18);
      drawCircle(size * 0.5, size * 0.5, 1.6, "#eadfca", 0.18);
      break;
    case "V":
      drawLine(0, 0, size, size, "#8fa69f", 0.9, 0.24);
      drawLine(size * 0.5, -1, size + 1, size * 0.5, "#8fa69f", 0.7, 0.18);
      break;
    case "E":
      drawLine(0, size * 0.76, size * 0.28, size * 0.42, "#56846e", 1, 0.3);
      drawLine(size * 0.28, size * 0.42, size * 0.46, size * 0.56, "#56846e", 1, 0.3);
      drawLine(size * 0.46, size * 0.56, size * 0.74, size * 0.18, "#56846e", 1, 0.3);
      drawCircle(size * 0.74, size * 0.18, 1.4, "#d3ff45", 0.18);
      break;
    case "G":
      drawCircle(size * 0.24, size * 0.28, 2, "#74885b", 0.26);
      drawCircle(size * 0.68, size * 0.58, 3, "#dce7c3", 0.12);
      drawCircle(size * 0.46, size * 0.82, 1.7, "#687850", 0.24);
      break;
    case "W":
      drawLine(size * 0.2, size, size * 0.32, size * 0.32, "#4d5e45", 1.1, 0.28);
      drawLine(size * 0.56, size, size * 0.68, size * 0.24, "#4d5e45", 1.1, 0.28);
      break;
    case "O":
      context.save();
      context.globalAlpha = 0.22;
      context.strokeStyle = "#9e7444";
      context.lineWidth = 1;
      context.beginPath();
      context.ellipse(px + size * 0.5, py + size * 0.5, size * 0.34, size * 0.16, 0, 0, Math.PI * 2);
      context.stroke();
      context.restore();
      break;
    case "A":
      drawLine(0, size * 0.54, size, size * 0.44, "#8e806f", 1, 0.28);
      drawLine(0, size * 0.2, size, size * 0.16, "#f1e3c9", 0.5, 0.1);
      break;
    case "C":
      drawLine(size * 0.5, 2, size * 0.5, size - 2, "#a1aeb6", 0.8, 0.18);
      drawLine(2, size * 0.5, size - 2, size * 0.5, "#a1aeb6", 0.8, 0.18);
      drawLine(size * 0.2, size * 0.2, size * 0.8, size * 0.8, "#a1aeb6", 0.7, 0.14);
      drawLine(size * 0.8, size * 0.2, size * 0.2, size * 0.8, "#a1aeb6", 0.7, 0.14);
      break;
    case "S":
      drawLine(size * 0.18, size * 0.82, size * 0.4, size * 0.34, "#6a7988", 1.1, 0.24);
      drawLine(size * 0.4, size * 0.34, size * 0.56, size * 0.52, "#6a7988", 1.1, 0.24);
      drawLine(size * 0.56, size * 0.52, size * 0.78, size * 0.1, "#6a7988", 1.1, 0.24);
      break;
    case "T":
      drawLine(0, size * 0.3, size, size * 0.3, "#7e756c", 0.9, 0.22);
      drawLine(0, size * 0.7, size, size * 0.7, "#7e756c", 0.9, 0.22);
      break;
    default:
      break;
  }

  const dust = seededNoise(cellX * 1.7, cellY * 1.3, 91);
  if (dust > -0.1) {
    drawCircle(size * (0.2 + ((dust + 1) / 2) * 0.55), size * (0.18 + ((dust + 1) / 2) * 0.62), 1.2, "#ffffff", 0.04);
  }
}

function smoothElevationGrid(grid, passes = 1) {
  let current = grid.map(row => [...row].map(value => Number(value || 0)));
  for (let pass = 0; pass < passes; pass += 1) {
    current = current.map((row, y) =>
      row.map((value, x) => {
        let total = 0;
        let weight = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const sampleRow = current[y + dy];
            const sample = sampleRow ? sampleRow[x + dx] : undefined;
            if (sample === undefined) continue;
            const localWeight = dx === 0 && dy === 0 ? 4 : Math.abs(dx) + Math.abs(dy) === 2 ? 1 : 2;
            total += sample * localWeight;
            weight += localWeight;
          }
        }
        return total / weight;
      })
    );
  }
  return current;
}

function isRouteSample(terrainGrid, x, y) {
  const maxY = terrainGrid.length - 1;
  const maxX = terrainGrid[0].length - 1;
  const cx = clamp(Math.round(x), 0, maxX);
  const cy = clamp(Math.round(y), 0, maxY);

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const nx = clamp(cx + dx, 0, maxX);
      const ny = clamp(cy + dy, 0, maxY);
      if (terrainGrid[ny][nx] === "=") return true;
    }
  }
  return false;
}

function getRouteFlattenFactor(terrainGrid, x, y) {
  const maxY = terrainGrid.length - 1;
  const maxX = terrainGrid[0].length - 1;
  const cx = clamp(Math.round(x), 0, maxX);
  const cy = clamp(Math.round(y), 0, maxY);
  let minDistance = Number.POSITIVE_INFINITY;

  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const nx = clamp(cx + dx, 0, maxX);
      const ny = clamp(cy + dy, 0, maxY);
      if (terrainGrid[ny][nx] !== "=") continue;
      const dist = Math.hypot(x - nx, y - ny);
      if (dist < minDistance) minDistance = dist;
    }
  }

  if (!Number.isFinite(minDistance) || minDistance > 2.2) return 0;
  if (minDistance <= 0.9) return 1;
  return clamp(1 - (minDistance - 0.9) / 1.3, 0, 1);
}

function sampleRouteLevel(elevationGrid, terrainGrid, x, y, fallback) {
  const maxY = terrainGrid.length - 1;
  const maxX = terrainGrid[0].length - 1;
  const cx = clamp(Math.round(x), 0, maxX);
  const cy = clamp(Math.round(y), 0, maxY);
  let total = 0;
  let weight = 0;

  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const nx = clamp(cx + dx, 0, maxX);
      const ny = clamp(cy + dy, 0, maxY);
      if (terrainGrid[ny][nx] !== "=") continue;
      const localDistance = Math.max(0.2, Math.hypot(x - nx, y - ny));
      const localWeight = 1 / (localDistance * localDistance);
      total += sampleElevation(elevationGrid, nx, ny) * localWeight;
      weight += localWeight;
    }
  }

  return weight ? total / weight : fallback;
}

function sampleElevation(grid, x, y) {
  const maxY = grid.length - 1;
  const maxX = grid[0].length - 1;
  const x0 = clamp(Math.floor(x), 0, maxX);
  const y0 = clamp(Math.floor(y), 0, maxY);
  const x1 = clamp(x0 + 1, 0, maxX);
  const y1 = clamp(y0 + 1, 0, maxY);
  const tx = x - x0;
  const ty = y - y0;
  const a = grid[y0][x0];
  const b = grid[y0][x1];
  const c = grid[y1][x0];
  const d = grid[y1][x1];
  const top = a + (b - a) * tx;
  const bottom = c + (d - c) * tx;
  return top + (bottom - top) * ty;
}

function updateCursorCoordinates(event) {
  if (!coordCursor) return;
  if (!document.getElementById("toggle-grid").checked || !state.layout || !state.viewBox) {
    coordCursor.classList.remove("is-visible");
    return;
  }

  const bounds = svg.getBoundingClientRect();
  const svgX = state.viewBox.x + (event.offsetX / bounds.width) * state.viewBox.width;
  const svgY = state.viewBox.y + (event.offsetY / bounds.height) * state.viewBox.height;
  const gridX = Math.floor((svgX - state.margin) / state.cellSize);
  const gridY = Math.floor((svgY - state.margin) / state.cellSize);
  const width = state.layout.terrain_grid[0].length;
  const height = state.layout.terrain_grid.length;

  if (gridX < 0 || gridY < 0 || gridX >= width || gridY >= height) {
    coordCursor.classList.remove("is-visible");
    return;
  }

  const sectorX = Math.floor(gridX / 5);
  const sectorY = Math.floor(gridY / 5);
  coordCursor.textContent = `${alphaIndex(sectorX)}-${String(sectorY + 1).padStart(2, "0")}  [${gridX},${gridY}]`;
  coordCursor.style.left = `${event.offsetX + 18}px`;
  coordCursor.style.top = `${event.offsetY + 18}px`;
  coordCursor.classList.add("is-visible");
}

function updatePoiLabelSizing() {
  if (!state.viewBox) return;
  const bounds = svg.getBoundingClientRect();
  const scaleX = bounds.width / state.viewBox.width;
  if (!Number.isFinite(scaleX) || scaleX <= 0) return;
  if (isMobileViewport() && Math.abs(scaleX - lastPoiLabelScale) < 0.08) return;
  lastPoiLabelScale = scaleX;

  labelLayer.querySelectorAll(".poi-label, .poi-subtext").forEach(label => {
    const baseSize = Number(label.getAttribute("data-base-size")) || 12;
    const minScreenSize = Number(label.getAttribute("data-min-screen-size")) || baseSize;
    const maxScreenSize = Number(label.getAttribute("data-max-screen-size")) || minScreenSize;
    const hideScale = Number(label.getAttribute("data-hide-scale")) || 0;
    const targetScreenSize = Math.max(minScreenSize, maxScreenSize);
    const adjustedSize = targetScreenSize / scaleX;
    label.style.fontSize = `${round(adjustedSize, 2)}px`;
    label.classList.toggle("is-hidden", scaleX < hideScale);
  });
}

function schedulePoiLabelSizing() {
  if (poiLabelSizingFrame) return;
  poiLabelSizingFrame = requestAnimationFrame(() => {
    poiLabelSizingFrame = 0;
    updatePoiLabelSizing();
  });
}

function showPoiPopup(poi, event) {
  const lorePath = POI_LORE_LINKS[poi.name];
  if (!poiPopup || !poiPopupTitle || !poiPopupNote || !poiPopupLink || !lorePath) return;

  poiPopupTitle.textContent = poi.name;
  poiPopupNote.textContent = poi.note;
  poiPopupLink.href = lorePath;
  updatePoiPopupImage(lorePath, poi.name);
  poiPopup.classList.remove("is-hidden");

  const frameRect = mapFrame.getBoundingClientRect();
  const localX = event.clientX - frameRect.left;
  const localY = event.clientY - frameRect.top;
  const popupWidth = Math.min(320, frameRect.width - 24);
  const left = Math.max(12, Math.min(localX + 18, frameRect.width - popupWidth - 12));
  const top = Math.max(12, Math.min(localY + 18, frameRect.height - 180));
  poiPopup.style.left = `${left}px`;
  poiPopup.style.top = `${top}px`;
  poiPopup.style.right = "auto";
}

function hidePoiPopup() {
  if (!poiPopup) return;
  poiPopup.classList.add("is-hidden");
}

function updatePoiPopupImage(lorePath, title) {
  if (!poiPopupImage) return;

  const candidates = [
    lorePath.replace(/\.html$/, ".jpg"),
    lorePath.replace(/\.html$/, ".png"),
    lorePath.replace(/\.html$/, ".jpeg")
  ];

  let index = 0;
  poiPopupImage.alt = title;
  poiPopupImage.classList.remove("is-hidden");

  poiPopupImage.onerror = () => {
    index += 1;
    if (index >= candidates.length) {
      poiPopupImage.classList.add("is-hidden");
      poiPopupImage.removeAttribute("src");
      poiPopupImage.onerror = null;
      return;
    }
    poiPopupImage.src = candidates[index];
  };

  poiPopupImage.src = candidates[index];
}

function createSvg(tag, attributes) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
  return node;
}

function removeNode(node) {
  if (node && node.parentNode) node.parentNode.removeChild(node);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
