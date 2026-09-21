/** Reusable Framer Motion variant factories. Pass `reduced = !!useReducedMotion()` from the caller. */

export function makeFadeUp(reduced: boolean, delay = 0) {
  return {
    initial: { opacity: 0, y: reduced ? 0 : 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function makeFadeIn(reduced: boolean, delay = 0) {
  return {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.5, delay },
  };
}

export function makeScaleIn(reduced: boolean, delay = 0) {
  return {
    initial: { opacity: 0, scale: reduced ? 1 : 0.92 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true },
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function makeSlideLeft(reduced: boolean, delay = 0) {
  return {
    initial: { opacity: 0, x: reduced ? 0 : -32 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function makeSlideRight(reduced: boolean, delay = 0) {
  return {
    initial: { opacity: 0, x: reduced ? 0 : 32 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}
