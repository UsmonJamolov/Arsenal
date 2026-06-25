/** Bosh sahifa va zona sahifalari uchun umumiy framer-motion presetlari */

export const zoneEase = [0.22, 1, 0.36, 1] as const;

/** Bosh sahifadagi fadeUp bilan bir xil */
export const zoneStagger = 0.08;
export const zoneItemDuration = 0.45;
export const zoneHeroDuration = 0.55;

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * zoneStagger, duration: zoneItemDuration, ease: zoneEase },
  }),
};

export function zonePageMotion(reduced: boolean) {
  if (reduced) {
    return {};
  }

  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: zoneHeroDuration, ease: zoneEase },
  };
}

export function zoneSectionMotion(delay: number, reduced: boolean) {
  if (reduced) {
    return {};
  }

  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: zoneItemDuration, delay, ease: zoneEase },
  };
}

export function zoneItemMotion(index: number, baseDelay: number, reduced: boolean) {
  if (reduced) {
    return {};
  }

  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: zoneItemDuration,
      delay: baseDelay + index * zoneStagger,
      ease: zoneEase,
    },
  };
}

export function zoneDockMotion(reduced: boolean) {
  if (reduced) {
    return {};
  }

  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: zoneItemDuration, delay: zoneStagger * 3, ease: zoneEase },
  };
}

export function zoneHeroMotion(reduced: boolean) {
  if (reduced) {
    return {};
  }

  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: zoneHeroDuration, ease: zoneEase },
  };
}

export const zoneTap = { scale: 0.985 };
