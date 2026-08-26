import { describe, expect, it } from 'vitest';
import {
  rankStandings, costToTakeFirst, minimumBidToLead,
  extendedCloseTime, checkSpendGuardrails, fundedPercent, type Standing,
} from './engine';

const at = (iso: string) => new Date(iso);

describe('rankStandings', () => {
  it('orders by amount descending', () => {
    const r = rankStandings([
      { id: 'b', amountCents: 500, reachedAt: at('2026-01-01') },
      { id: 'a', amountCents: 1500, reachedAt: at('2026-01-02') },
    ]);
    expect(r.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('breaks ties on who reached the total first', () => {
    const r = rankStandings([
      { id: 'late', amountCents: 1000, reachedAt: at('2026-03-01') },
      { id: 'early', amountCents: 1000, reachedAt: at('2026-01-01') },
    ]);
    expect(r[0].id).toBe('early');
  });

  it('is fully deterministic when amount and time both tie', () => {
    const input: Standing[] = [
      { id: 'zzz', amountCents: 100, reachedAt: at('2026-01-01') },
      { id: 'aaa', amountCents: 100, reachedAt: at('2026-01-01') },
    ];
    expect(rankStandings(input).map((x) => x.id))
      .toEqual(rankStandings([...input].reverse()).map((x) => x.id));
  });

  it('excludes fully refunded identities', () => {
    const r = rankStandings([
      { id: 'kept', amountCents: 100, reachedAt: at('2026-01-01') },
      { id: 'refunded', amountCents: 0, reachedAt: at('2026-01-01') },
      { id: 'chargeback', amountCents: -500, reachedAt: at('2026-01-01') },
    ]);
    expect(r.map((x) => x.id)).toEqual(['kept']);
  });

  it('produces contiguous ranks from 1', () => {
    const r = rankStandings(
      Array.from({ length: 20 }, (_, i) => ({
        id: `s${i}`, amountCents: (i + 1) * 100, reachedAt: at('2026-01-01'),
      })),
    );
    expect(r.map((x) => x.rank)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it('stays consistent under random refunds', () => {
    let pool: Standing[] = Array.from({ length: 60 }, (_, i) => ({
      id: `s${i}`,
      amountCents: ((i * 7919) % 40 + 1) * 500,
      reachedAt: at(`2026-0${(i % 9) + 1}-01`),
    }));
    for (let n = 0; n < 500; n++) {
      const i = (n * 31) % pool.length;
      pool = pool.map((s, j) => (j === i ? { ...s, amountCents: Math.max(0, s.amountCents - 500) } : s));
      const r = rankStandings(pool);
      expect(r.map((x) => x.rank)).toEqual(r.map((_, k) => k + 1));
      for (let k = 1; k < r.length; k++) expect(r[k - 1].amountCents).toBeGreaterThanOrEqual(r[k].amountCents);
    }
  });
});

describe('costToTakeFirst', () => {
  it('charges only the delta plus the increment', () => {
    expect(costToTakeFirst({ leaderCents: 140_000, challengerCents: 125_000, incrementCents: 100 })).toBe(15_100);
  });

  it('charges the increment when the challenger already leads', () => {
    expect(costToTakeFirst({ leaderCents: 100_000, challengerCents: 150_000, incrementCents: 100 })).toBe(100);
  });

  it('charges leader plus increment for a newcomer', () => {
    expect(costToTakeFirst({ leaderCents: 750_000, challengerCents: 0, incrementCents: 50_000 })).toBe(800_000);
  });

  it('actually results in the lead', () => {
    const leader = 123_456, mine = 99_999, inc = 100;
    const pay = costToTakeFirst({ leaderCents: leader, challengerCents: mine, incrementCents: inc });
    expect(mine + pay).toBeGreaterThanOrEqual(leader + inc);
  });
});

describe('minimumBidToLead', () => {
  it('never falls below the campaign floor', () => {
    expect(minimumBidToLead({ leaderCents: 1000, challengerCents: 999, incrementCents: 100, floorCents: 1000 })).toBe(1000);
  });
});

describe('extendedCloseTime', () => {
  const closesAt = at('2026-09-30T23:59:59Z');

  it('leaves an early challenge alone', () => {
    expect(extendedCloseTime({ closesAt, challengeAt: at('2026-09-01T00:00:00Z'), windowHours: 24, extensionHours: 12 }))
      .toEqual(closesAt);
  });

  it('extends a challenge inside the window', () => {
    const out = extendedCloseTime({ closesAt, challengeAt: at('2026-09-30T20:00:00Z'), windowHours: 24, extensionHours: 12 });
    expect(out.toISOString()).toBe('2026-10-01T08:00:00.000Z');
  });
});

describe('checkSpendGuardrails', () => {
  it('blocks above the daily ceiling', () => {
    const v = checkSpendGuardrails({ proposedCents: 100_000, spentLast24hCents: 150_000, spentLast7dCents: 150_000, dailyCeilingCents: 200_000, weeklyWarningCents: 100_000 });
    expect(v.allowed).toBe(false);
  });

  it('allows but warns above the weekly soft threshold', () => {
    const v = checkSpendGuardrails({ proposedCents: 50_000, spentLast24hCents: 0, spentLast7dCents: 90_000, dailyCeilingCents: 200_000, weeklyWarningCents: 100_000 });
    expect(v).toEqual({ allowed: true, warn: true });
  });
});

describe('fundedPercent', () => {
  it('matches the documented campaign figure', () => {
    expect(fundedPercent(1_842_000, 2_500_000)).toBe(73);
  });

  it('never rounds up to 100', () => {
    expect(fundedPercent(2_499_999, 2_500_000)).toBe(99);
  });

  it('handles a zero goal', () => {
    expect(fundedPercent(1000, 0)).toBe(0);
  });
});
