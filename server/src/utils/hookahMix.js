const HOOKAH_MIN_FLAVOR_PERCENT = 5;
const HOOKAH_FLAVOR_PERCENT_STEP = 5;

function snapHookahPercent(value) {
  const safe = Number.isFinite(value) ? value : HOOKAH_MIN_FLAVOR_PERCENT;
  const snapped = Math.round(safe / HOOKAH_FLAVOR_PERCENT_STEP) * HOOKAH_FLAVOR_PERCENT_STEP;
  return Math.max(HOOKAH_MIN_FLAVOR_PERCENT, Math.min(100, snapped));
}

function isHookahPercentOnStep(value) {
  return Number(value) % HOOKAH_FLAVOR_PERCENT_STEP === 0;
}

function normalizeMixes(mixes, flavorIds, quantity) {
  if (!Array.isArray(mixes) || !mixes.length) {
    const equalEach = snapHookahPercent(100 / flavorIds.length);
    return Array.from({ length: quantity }, () =>
      Object.fromEntries(flavorIds.map((id) => [id, equalEach])),
    );
  }

  return Array.from({ length: quantity }, (_, index) => {
    const source = mixes[index] ?? mixes[0] ?? {};
    const mix = {};
    flavorIds.forEach((id) => {
      mix[id] = snapHookahPercent(Number(source[id]) || HOOKAH_MIN_FLAVOR_PERCENT);
    });
    return mix;
  });
}

function isMixValid(mix, flavorIds) {
  if (!flavorIds.length) {
    return false;
  }

  if (flavorIds.length === 1) {
    return Number(mix[flavorIds[0]]) === 100;
  }

  const total = flavorIds.reduce((sum, id) => sum + (Number(mix[id]) || 0), 0);
  return (
    total === 100 &&
    flavorIds.every((id) => {
      const value = Number(mix[id]) || 0;
      return value >= HOOKAH_MIN_FLAVOR_PERCENT && isHookahPercentOnStep(value);
    })
  );
}

function formatMixLabel(flavors, mix) {
  return flavors.map((flavor) => `${flavor.title} ${mix[flavor.slug]}%`).join(" + ");
}

function buildHookahMixTitle(flavors, mixes, quantity) {
  if (flavors.length === 1) {
    return flavors[0].title;
  }

  const labels = mixes.map((mix) => formatMixLabel(flavors, mix));
  const allSame = labels.every((label) => label === labels[0]);

  if (quantity === 1 || allSame) {
    return labels[0];
  }

  return labels.map((label, index) => `#${index + 1} ${label}`).join("; ");
}

module.exports = {
  HOOKAH_MIN_FLAVOR_PERCENT,
  HOOKAH_FLAVOR_PERCENT_STEP,
  normalizeMixes,
  isMixValid,
  buildHookahMixTitle,
};
