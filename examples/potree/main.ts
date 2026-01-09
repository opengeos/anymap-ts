// Potree viewer settings (matching notebook example)
interface PotreeSettings {
  pointBudget: number;
  pointSize: number;
  edlEnabled: boolean;
  edlRadius: number;
  edlStrength: number;
  background: string;
  pointShape: string;
}

const settings: PotreeSettings = {
  pointBudget: 1000000,
  pointSize: 1.0,
  edlEnabled: true,
  edlRadius: 1.8,
  edlStrength: 0.5,
  background: '#1a1a2e',
  pointShape: 'circle',
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  return `${(num / 1000).toFixed(0)}K`;
}

function updateBudget(): void {
  const budgetInput = document.getElementById('pointBudget') as HTMLInputElement;
  const budgetValue = document.getElementById('budgetValue');
  const infoBudget = document.getElementById('infoBudget');

  if (budgetInput && budgetValue && infoBudget) {
    settings.pointBudget = parseInt(budgetInput.value);
    budgetValue.textContent = formatNumber(settings.pointBudget);
    infoBudget.textContent = settings.pointBudget.toLocaleString();
    console.log('Point budget:', settings.pointBudget);
  }
}

function updateSize(): void {
  const sizeInput = document.getElementById('pointSize') as HTMLInputElement;
  const sizeValue = document.getElementById('sizeValue');
  const infoSize = document.getElementById('infoSize');

  if (sizeInput && sizeValue && infoSize) {
    settings.pointSize = parseFloat(sizeInput.value);
    sizeValue.textContent = settings.pointSize.toFixed(1);
    infoSize.textContent = settings.pointSize.toFixed(1);
    console.log('Point size:', settings.pointSize);
  }
}

function updateShape(): void {
  const shapeSelect = document.getElementById('pointShape') as HTMLSelectElement;
  if (shapeSelect) {
    settings.pointShape = shapeSelect.value;
    console.log('Point shape:', settings.pointShape);
  }
}

function toggleEDL(): void {
  settings.edlEnabled = !settings.edlEnabled;
  const infoEDL = document.getElementById('infoEDL');
  if (infoEDL) {
    infoEDL.textContent = settings.edlEnabled ? 'Yes' : 'No';
  }
  console.log('EDL enabled:', settings.edlEnabled);
}

function resetCamera(): void {
  console.log('Reset camera to fit point cloud');
}

// Bind event listeners
document.getElementById('pointBudget')?.addEventListener('input', updateBudget);
document.getElementById('pointSize')?.addEventListener('input', updateSize);
document.getElementById('pointShape')?.addEventListener('change', updateShape);
document.getElementById('btn-edl')?.addEventListener('click', toggleEDL);
document.getElementById('btn-reset')?.addEventListener('click', resetCamera);
