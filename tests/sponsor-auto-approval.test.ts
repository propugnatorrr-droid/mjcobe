import { describe, expect, it } from 'vitest';
import {
  sponsorAutoDecision,
} from '@/lib/sponsor/auto-approval';

describe('sponsorAutoDecision', () => {
  it('publishes an ordinary business immediately', () => {
    const decision = sponsorAutoDecision({
      businessName: 'Rivera Auto Body',
    });
    expect(decision.sponsorModeration).toBe('approved');
    expect(decision.contributionModeration).toBe('approved');
    expect(decision.leaderboardVisible).toBe(true);
    expect(decision.needsAttention).toBe(false);
  });

  it('requires no admin step for a large sponsorship', () => {
    /* Amount is deliberately not an input. */
    expect(
      sponsorAutoDecision({
        businessName: 'Meridian Capital',
      }).leaderboardVisible,
    ).toBe(true);
  });

  it('publishes a business with no name supplied', () => {
    expect(
      sponsorAutoDecision({ businessName: null })
        .sponsorModeration,
    ).toBe('approved');
  });

  it('withholds a name containing a URL', () => {
    const decision = sponsorAutoDecision({
      businessName: 'visit https://spam.example',
    });
    expect(decision.leaderboardVisible).toBe(false);
    expect(decision.needsAttention).toBe(true);
  });

  it('withholds crypto solicitation names', () => {
    expect(
      sponsorAutoDecision({
        businessName: 'Free crypto airdrop',
      }).sponsorModeration,
    ).toBe('flagged');
  });

  it('keeps a blocked sponsor blocked', () => {
    const decision = sponsorAutoDecision({
      businessName: 'Rivera Auto Body',
      currentSponsorModeration: 'blocked',
    });
    expect(decision.leaderboardVisible).toBe(false);
    expect(decision.needsAttention).toBe(true);
  });

  it('does not silently unhide a hidden sponsor', () => {
    expect(
      sponsorAutoDecision({
        businessName: 'Rivera Auto Body',
        currentSponsorModeration: 'hidden',
      }).leaderboardVisible,
    ).toBe(false);
  });

  it('re-publishes a previously flagged sponsor once renamed', () => {
    expect(
      sponsorAutoDecision({
        businessName: 'Rivera Auto Body',
        currentSponsorModeration: 'flagged',
      }).sponsorModeration,
    ).toBe('approved');
  });

  it('never returns a visible row it also flagged', () => {
    for (const name of [
      'Rivera Auto Body',
      'https://x.example',
      'telegram me',
      null,
    ]) {
      const decision = sponsorAutoDecision({
        businessName: name,
      });
      if (decision.sponsorModeration === 'flagged') {
        expect(decision.leaderboardVisible).toBe(false);
      }
    }
  });
});
