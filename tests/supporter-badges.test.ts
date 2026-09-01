import { describe, expect, it } from 'vitest';
import {
  FAN_BADGE_THRESHOLDS,
  fanBadgeKeys,
} from '@/lib/supporter/badge-rules';

const base = {
  amountCents: 5_000,
  supporterNumber: null,
  foundingNumber: null,
  rank: null,
};

describe('fanBadgeKeys', () => {
  it('grants the base badge for any settled amount', () => {
    expect(fanBadgeKeys(base)).toEqual(['supporter']);
  });

  it('grants nothing when no money moved', () => {
    expect(
      fanBadgeKeys({ ...base, amountCents: 0 }),
    ).toEqual([]);
  });

  it('grants nothing for a negative net amount', () => {
    expect(
      fanBadgeKeys({ ...base, amountCents: -5_000 }),
    ).toEqual([]);
  });

  it('grants day one at the boundary number', () => {
    expect(
      fanBadgeKeys({
        ...base,
        supporterNumber:
          FAN_BADGE_THRESHOLDS.dayOneNumber,
      }),
    ).toContain('day_one');
  });

  it('withholds day one past the boundary', () => {
    expect(
      fanBadgeKeys({
        ...base,
        supporterNumber:
          FAN_BADGE_THRESHOLDS.dayOneNumber + 1,
      }),
    ).not.toContain('day_one');
  });

  it('withholds day one when no number was issued', () => {
    expect(
      fanBadgeKeys({ ...base, supporterNumber: null }),
    ).not.toContain('day_one');
  });

  it('grants founding when a founding number exists', () => {
    expect(
      fanBadgeKeys({ ...base, foundingNumber: 7 }),
    ).toContain('founding_100');
  });

  it('withholds founding when the series was exhausted', () => {
    expect(
      fanBadgeKeys({ ...base, foundingNumber: null }),
    ).not.toContain('founding_100');
  });

  it('grants inner circle at the threshold', () => {
    expect(
      fanBadgeKeys({
        ...base,
        amountCents:
          FAN_BADGE_THRESHOLDS.innerCircleCents,
      }),
    ).toContain('inner_circle');
  });

  it('withholds inner circle one cent below', () => {
    expect(
      fanBadgeKeys({
        ...base,
        amountCents:
          FAN_BADGE_THRESHOLDS.innerCircleCents - 1,
      }),
    ).not.toContain('inner_circle');
  });

  it('grants gold and inner circle together', () => {
    const keys = fanBadgeKeys({
      ...base,
      amountCents: FAN_BADGE_THRESHOLDS.goldCents,
    });
    expect(keys).toContain('gold');
    expect(keys).toContain('inner_circle');
  });

  it('grants top ten at the rank boundary', () => {
    expect(
      fanBadgeKeys({
        ...base,
        rank: FAN_BADGE_THRESHOLDS.topTenRank,
      }),
    ).toContain('top_ten');
  });

  it('withholds top ten past the boundary', () => {
    expect(
      fanBadgeKeys({
        ...base,
        rank: FAN_BADGE_THRESHOLDS.topTenRank + 1,
      }),
    ).not.toContain('top_ten');
  });

  it('grants number one and top ten to the leader', () => {
    const keys = fanBadgeKeys({ ...base, rank: 1 });
    expect(keys).toContain('number_one');
    expect(keys).toContain('top_ten');
  });

  it('withholds number one from rank two', () => {
    expect(
      fanBadgeKeys({ ...base, rank: 2 }),
    ).not.toContain('number_one');
  });

  it('withholds rank badges when unranked', () => {
    const keys = fanBadgeKeys({ ...base, rank: null });
    expect(keys).not.toContain('top_ten');
    expect(keys).not.toContain('number_one');
  });

  it('returns keys in a deterministic order', () => {
    expect(
      fanBadgeKeys({
        amountCents: FAN_BADGE_THRESHOLDS.goldCents,
        supporterNumber: 3,
        foundingNumber: 2,
        rank: 1,
      }),
    ).toEqual([
      'supporter',
      'day_one',
      'founding_100',
      'inner_circle',
      'gold',
      'top_ten',
      'number_one',
    ]);
  });

  it('never repeats a key', () => {
    const keys = fanBadgeKeys({
      amountCents: 1_000_000,
      supporterNumber: 1,
      foundingNumber: 1,
      rank: 1,
    });
    expect(keys.length).toBe(new Set(keys).size);
  });

  it('honours injected thresholds', () => {
    expect(
      fanBadgeKeys({
        ...base,
        amountCents: 200,
        thresholds: {
          dayOneNumber:
            FAN_BADGE_THRESHOLDS.dayOneNumber,
          innerCircleCents: 100,
          goldCents:
            FAN_BADGE_THRESHOLDS.goldCents,
          topTenRank:
            FAN_BADGE_THRESHOLDS.topTenRank,
        },
      }),
    ).toContain('inner_circle');
  });
});
