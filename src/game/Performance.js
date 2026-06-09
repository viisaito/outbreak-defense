export const BEST_PERFORMANCE_KEY = 'outbreak-defense-best-performance';

export function loadBestPerformance() {
  const raw = localStorage.getItem(BEST_PERFORMANCE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Falha ao ler melhor desempenho:', error);
    return null;
  }
}

export function formatStarRating(count) {
  const stars = Math.max(0, Math.min(3, count));
  return '★'.repeat(stars) + '☆'.repeat(3 - stars);
}

export function isBetterPerformance(current, previous) {
  if (!previous) return true;
  if (current.estrelas !== previous.estrelas) return current.estrelas > previous.estrelas;
  if (current.ondas !== previous.ondas) return current.ondas > previous.ondas;
  if (current.eliminados !== previous.eliminados) return current.eliminados > previous.eliminados;
  if (current.hp !== previous.hp) return current.hp > previous.hp;
  if (current.result !== previous.result) return current.result === 'victory';
  return false;
}

export function saveBestPerformance(current) {
  const previous = loadBestPerformance();
  const currentRecord = {
    ...current,
    estrelas: Math.max(0, Math.min(3, current.estrelas || 0)),
    ondas: current.ondas || 0,
    eliminados: current.eliminados || 0,
    hp: current.hp != null ? current.hp : 0,
    result: current.result || 'defeat',
    date: new Date().toISOString()
  };

  if (isBetterPerformance(currentRecord, previous)) {
    localStorage.setItem(BEST_PERFORMANCE_KEY, JSON.stringify(currentRecord));
    return { best: currentRecord, isNewRecord: true };
  }

  return { best: previous, isNewRecord: false };
}
