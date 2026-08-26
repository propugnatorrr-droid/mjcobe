/**
 * Disposable demo data for /dev/gallery only. Invented handles, amounts and
 * figures — deletable wholesale in Slice 1, never promoted into `settings`.
 */
import { cents, type Cents } from '@/lib/money/cents';

export const gallerySong = {
  title: "CAN'T READ YOUR MIND",
  raised: cents(1_842_000),
  goal: cents(2_500_000),
  supporterCount: 486,
};

// Floor, not round — the PRD states this campaign at exactly 73% funded;
// rounding 73.68 to 74 would silently drift from the documented figure.
export const gallerySongPercent = Math.floor(
  (gallerySong.raised / gallerySong.goal) * 100,
);

export type LeaderboardEntry = {
  rank: number;
  name: string;
  amount: Cents;
};

export const fanLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: '@Marcus', amount: cents(125_000) },
  { rank: 2, name: '@jasmine.reyes', amount: cents(82_500) },
  { rank: 3, name: '@KDot_ATL', amount: cents(60_000) },
  { rank: 4, name: '@sincerely.tee', amount: cents(45_000) },
  { rank: 5, name: '@coreyw', amount: cents(40_050) },
];

export const fanLeaderboardMoreCount = 182;

export const businessLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'ABC Clothing', amount: cents(750_000) },
  { rank: 2, name: 'Lowkey Studios', amount: cents(550_000) },
  { rank: 3, name: 'Northbound Coffee Co.', amount: cents(375_000) },
];
