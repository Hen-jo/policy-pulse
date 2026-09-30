const state = { benefit: 78, cost: 34, coverage: 70 };

const controls = ['benefit', 'cost', 'coverage'];
const $ = (id) => document.getElementById(id);
const districtMeta = {
  '유성구': '연구·교육 생활권 · 표본 16명',
  '서구': '행정·상업 생활권 · 표본 38명',
  '중구': '도심 생활권 · 표본 16명',
  '동구': '동부 생활권 · 표본 17명',
  '대덕구': '산업·주거 생활권 · 표본 13명'
};

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function updateRange(control) {
  const element = $(control);
  const value = Number(element.value);
  state[control] = value;
  element.style.setProperty('--range-value', `${((value - Number(element.min)) / (Number(element.max) - Number(element.min))) * 100}%`);
  $(`${control}Value`).textContent = value;
}

function calculate() {
  const { benefit, cost, coverage } = state;
  const coverageBonus = (coverage - 50) * 0.08;
  const base = 51 + benefit * 0.22 - cost * 0.12 + coverageBonus;
  const progressive = clamp(base + 4 + benefit * 0.035 - cost * 0.02, 35, 92);
  const center = clamp(base + 1 + benefit * 0.012 - cost * 0.015, 35, 92);
  const conservative = clamp(base - 4 + benefit * 0.005 - cost * 0.045, 25, 90);
  const overall = progressive * .53 + center * .07 + conservative * .40;
  const low = clamp(Math.round(overall - 6 - cost * .025), 20, 87);
  const high = clamp(Math.round(overall + 6 - cost * .01), 28, 95);
  return { overall: Math.round(overall), progressive: Math.round(progressive), center: Math.round(center), conservative: Math.round(conservative), low, high };
}

function setText(id, value) { $(id).textContent = value; }

function updateChart(result) {
  const points = [
    { x: 0, y: clamp(174 - result.overall * 2.05, 10, 174) },
    { x: 112, y: clamp(174 - (result.overall - 5) * 2.05, 10, 174) },
    { x: 225, y: clamp(174 - (result.overall - 2) * 2.05, 10, 174) },
    { x: 340, y: clamp(174 - result.overall * 2.05, 10, 174) },
    { x: 452, y: clamp(174 - (result.overall + 3) * 2.05, 10, 174) },
    { x: 565, y: clamp(174 - (result.overall + 1) * 2.05, 10, 174) },
    { x: 680, y: clamp(174 - (result.overall + 4) * 2.05, 10, 174) }
  ];
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  $('chartLine').setAttribute('d', line);
  $('chartArea').setAttribute('d', `${line} L 680 190 L 0 190 Z`);
  const current = points[3];
  $('chartPoint').setAttribute('cx', current.x);
  $('chartPoint').setAttribute('cy', current.y);
}

function render() {
  const result = calculate();
  setText('supportRate', result.overall);
  const delta = result.overall - 65.0;
  setText('supportDelta', `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%p `);
  $('supportDelta').insertAdjacentHTML('beforeend', '<span>현재 상태 대비</span>');
  setText('confidenceText', `${result.low}–${result.high}%`);
  $('confidenceBar').style.width = `${clamp(result.high - result.low + 28, 42, 82)}%`;
  for (const group of ['progressive', 'center', 'conservative']) {
    setText(`${group}Value`, result[group]);
    $(`${group}Bar`).style.width = `${result[group]}%`;
    const baseline = { progressive: 66, center: 66, conservative: 63 }[group];
    const deltaValue = result[group] - baseline;
    const deltaElement = $(`${group}Delta`);
    deltaElement.textContent = `${deltaValue >= 0 ? '+' : '−'}${Math.abs(deltaValue)}`;
    deltaElement.classList.toggle('negative', deltaValue < 0);
  }
  const group = state.cost > 60 ? '재정 민감 집단' : state.benefit > 82 ? '대중교통 이용 청년층' : '고정 통근자와 학생층';
  setText('topGroup', group);
  setText('topGroupText', state.cost > 60 ? '혜택이 유지돼도 재원 설명이 약하면 보수 성향과 고정소득층의 반응이 빠르게 낮아집니다.' : '비용 절감이 직접 체감되는 통근·통학 집단에서 반응이 가장 빠릅니다.');
  updateChart(result);
}

for (const control of controls) {
  $(control).addEventListener('input', () => { updateRange(control); render(); });
  updateRange(control);
}

function selectDistrict(district) {
  document.querySelectorAll('[data-district]').forEach((element) => element.classList.toggle('selected', element.dataset.district === district));
  setText('mapDistrict', district);
  setText('mapMeta', districtMeta[district]);
}

document.querySelectorAll('[data-district]').forEach((element) => {
  element.addEventListener('click', () => selectDistrict(element.dataset.district));
  element.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectDistrict(element.dataset.district); }
  });
});

$('runButton').addEventListener('click', () => {
  const toast = $('toast');
  toast.textContent = 'Jev 실행은 터미널에서 API 키와 함께 진행합니다.';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3400);
});

render();
