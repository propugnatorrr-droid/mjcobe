/**
 * Numeric sampler for the signature curve (cubic-bezier(0.16, 1, 0.3, 1)).
 * CSS transitions apply this curve for free; CountUp interpolates a plain
 * number every frame, so it needs the same easing evaluated in JS.
 */
const P1X = 0.16;
const P1Y = 1;
const P2X = 0.3;
const P2Y = 1;

function sampleCurve(a: number, b: number, c: number, t: number): number {
  return ((a * t + b) * t + c) * t;
}

function sampleCurveDerivative(a: number, b: number, c: number, t: number): number {
  return (3 * a * t + 2 * b) * t + c;
}

function solveX(x: number): number {
  const cx = 3 * P1X;
  const bx = 3 * (P2X - P1X) - cx;
  const ax = 1 - cx - bx;

  let t = x;
  for (let i = 0; i < 8; i++) {
    const currentX = sampleCurve(ax, bx, cx, t) - x;
    const derivative = sampleCurveDerivative(ax, bx, cx, t);
    if (Math.abs(derivative) < 1e-6) break;
    t -= currentX / derivative;
  }
  return t;
}

/** Evaluates the signature curve at progress `x` in [0, 1]. */
export function signatureEase(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const cy = 3 * P1Y;
  const by = 3 * (P2Y - P1Y) - cy;
  const ay = 1 - cy - by;

  const t = solveX(x);
  return sampleCurve(ay, by, cy, t);
}
