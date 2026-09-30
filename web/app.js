const regionData = {
  daejeon: { name: '대전광역시', baseline: 65, mix: [66, 66, 63] },
  seoul: { name: '서울특별시', baseline: 66, mix: [68, 66, 63] },
  busan: { name: '부산광역시', baseline: 60, mix: [61, 60, 59] },
  daegu: { name: '대구광역시', baseline: 58, mix: [56, 58, 61] },
  incheon: { name: '인천광역시', baseline: 63, mix: [65, 63, 61] },
  gwangju: { name: '광주광역시', baseline: 68, mix: [71, 68, 62] },
  sejong: { name: '세종특별자치시', baseline: 70, mix: [71, 70, 66] }
};

const positiveWords = ['지원', '환급', '감면', '무료', '확대', '보장', '돌봄', '주거', '일자리', '의료', '청년', '교통', '교육', '장학', '보조'];
const burdenWords = ['증세', '세금', '부담', '재정', '예산', '규제', '축소', '폐지', '인상', '의무'];
const broadWords = ['모든', '전 시민', '전국민', '전 국민', '무상', '전면'];

const $ = (id) => document.getElementById(id);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function countMatches(text, words) {
  return words.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
}

function analyze() {
  const region = regionData[$('regionSelect').value];
  const text = $('policyInput').value.trim();
  const benefits = countMatches(text, positiveWords);
  const burdens = countMatches(text, burdenWords);
  const broad = countMatches(text, broadWords);
  const hasPolicy = text.length > 5;
  const lengthSignal = Math.min(1.8, Math.floor(text.length / 30) * .3);
  const effect = hasPolicy ? clamp(benefits * 1.25 + lengthSignal - burdens * 1.1 - broad * .35, -10, 10) : 0;
  const proposed = Math.round(region.baseline + effect);
  const progressive = clamp(Math.round(region.mix[0] + effect * 1.15), 20, 90);
  const center = clamp(Math.round(region.mix[1] + effect * .85), 20, 90);
  const conservative = clamp(Math.round(region.mix[2] + effect * .55 - burdens * .3), 20, 90);
  return { region, proposed, progressive, center, conservative };
}

function drawSparkline(result) {
  const spread = result.proposed - result.region.baseline;
  const points = [[0, 78], [105, 70], [210, 76], [315, 58], [420, clamp(58 - spread * 2, 18, 95)], [520, clamp(52 - spread * 3, 12, 95)], [620, clamp(46 - spread * 3.5, 10, 98)]];
  const line = points.map(([x, y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');
  $('sparkPath').setAttribute('d', line);
  $('sparkFillPath').setAttribute('d', `${line} L 620 110 L 0 110 Z`);
  $('sparkPoint').setAttribute('cx', points[6][0]);
  $('sparkPoint').setAttribute('cy', points[6][1]);
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
  const groups = [['progressive', result.progressive, result.region.mix[0]], ['center', result.center, result.region.mix[1]], ['conservative', result.conservative, result.region.mix[2]]];
  for (const [name, proposed, baseline] of groups) {
    $(`${name}Current`).textContent = baseline;
    $(`${name}Proposed`).textContent = proposed;
    const groupDelta = proposed - baseline;
    const element = $(`${name}Delta`);
    element.textContent = `${groupDelta >= 0 ? '+' : '−'}${Math.abs(groupDelta)}`;
    element.classList.toggle('negative', groupDelta < 0);
  }
  drawSparkline(result);
}

['regionSelect', 'policyInput'].forEach((id) => $(id).addEventListener('input', render));
$('policyForm').addEventListener('submit', (event) => { event.preventDefault(); render(); });
render();
