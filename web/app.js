const regionData = {
  daejeon: { name: '대전광역시', baseline: 65, mix: [66, 66, 63], coords: [36.3504, 127.3845], zoom: 12 },
  seoul: { name: '서울특별시', baseline: 66, mix: [68, 66, 63], coords: [37.5665, 126.978], zoom: 11 },
  busan: { name: '부산광역시', baseline: 60, mix: [61, 60, 59], coords: [35.1796, 129.0756], zoom: 11 },
  daegu: { name: '대구광역시', baseline: 58, mix: [56, 58, 61], coords: [35.8714, 128.6014], zoom: 11 },
  incheon: { name: '인천광역시', baseline: 63, mix: [65, 63, 61], coords: [37.4563, 126.7052], zoom: 11 },
  gwangju: { name: '광주광역시', baseline: 68, mix: [71, 68, 62], coords: [35.1595, 126.8526], zoom: 11 },
  sejong: { name: '세종특별자치시', baseline: 70, mix: [71, 70, 66], coords: [36.48, 127.289], zoom: 12 }
};

const positiveWords = ['지원', '환급', '감면', '무료', '확대', '보장', '돌봄', '주거', '일자리', '의료', '청년', '교통', '교육', '장학', '보조'];
const burdenWords = ['증세', '세금', '부담', '재정', '예산', '규제', '축소', '폐지', '인상', '의무'];
const broadWords = ['모든', '전 시민', '전국민', '전 국민', '무상', '전면'];

const $ = (id) => document.getElementById(id);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
let selectedRegion = 'daejeon';
let realMap = null;
let regionMarker = null;

function countMatches(text, words) {
  return words.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
}

function analyze() {
  const region = regionData[selectedRegion];
  const text = $('policyInput').value.trim();
  const benefits = countMatches(text, positiveWords);
  const burdens = countMatches(text, burdenWords);
  const broad = countMatches(text, broadWords);
  const hasPolicy = text.length > 5;
  const lengthSignal = Math.min(1.8, Math.floor(text.length / 30) * .3);
  const effect = hasPolicy ? clamp(benefits * 1.25 + lengthSignal - burdens * 1.1 - broad * .35, -10, 10) : 0;
  const proposed = Math.round(region.baseline + effect);
  return {
    region,
    proposed,
    yes: proposed,
    no: 100 - proposed,
    progressive: clamp(Math.round(region.mix[0] + effect * 1.15), 20, 90),
    center: clamp(Math.round(region.mix[1] + effect * .85), 20, 90),
    conservative: clamp(Math.round(region.mix[2] + effect * .55 - burdens * .3), 20, 90)
  };
}

function updateMap(region) {
  $('mapHeading').textContent = region.name;
  $('mapLabel').textContent = region.name;
  if (!realMap || !regionMarker) return;
  realMap.setView(region.coords, region.zoom, { animate: true });
  regionMarker.setLatLng(region.coords).bindTooltip(region.name, { direction: 'top', offset: [0, -8] }).openTooltip();
}

function render() {
  const result = analyze();
  const current = result.region.baseline;
  const delta = result.proposed - current;
  $('resultRegion').textContent = `${result.region.name} 기준`;
  $('currentRate').textContent = current;
  $('proposedRate').textContent = result.proposed;
  $('deltaRate').textContent = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%p`;
  $('deltaRate').style.color = delta >= 0 ? 'var(--green)' : 'var(--rose)';
  $('yesRate').textContent = result.yes;
  $('noRate').textContent = result.no;
  $('yesCount').textContent = `${result.yes}명`;
  $('noCount').textContent = `${result.no}명`;
  $('yesBar').style.width = `${result.yes}%`;
  $('noBar').style.width = `${result.no}%`;
  const groups = [['progressive', result.progressive, result.region.mix[0]], ['center', result.center, result.region.mix[1]], ['conservative', result.conservative, result.region.mix[2]]];
  for (const [name, proposed, baseline] of groups) {
    $(`${name}Current`).textContent = baseline;
    $(`${name}Proposed`).textContent = proposed;
    const groupDelta = proposed - baseline;
    const element = $(`${name}Delta`);
    element.textContent = `${groupDelta >= 0 ? '+' : '−'}${Math.abs(groupDelta)}`;
    element.classList.toggle('negative', groupDelta < 0);
  }
  updateMap(result.region);
}

document.querySelectorAll('.region-option').forEach((button) => {
  button.addEventListener('click', () => {
    selectedRegion = button.dataset.region;
    document.querySelectorAll('.region-option').forEach((option) => option.classList.toggle('active', option === button));
    render();
  });
});

$('policyInput').addEventListener('input', render);
$('policyForm').addEventListener('submit', (event) => { event.preventDefault(); render(); });

function initMap() {
  if (!window.L) { window.setTimeout(initMap, 150); return; }
  realMap = window.L.map('realMap', { scrollWheelZoom: false, zoomControl: true }).setView(regionData[selectedRegion].coords, regionData[selectedRegion].zoom);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(realMap);
  regionMarker = window.L.circleMarker(regionData[selectedRegion].coords, { radius: 8, color: '#b86f32', weight: 2, fillColor: '#f0a35b', fillOpacity: .9 }).addTo(realMap);
  updateMap(regionData[selectedRegion]);
  window.setTimeout(() => realMap.invalidateSize(), 150);
}

initMap();
render();
