export type SettlementModeration =
  | 'approved'
  | 'flagged';

const blockedPatterns = [
  /https?:\/\//i,
  /\bwww\./i,
  /\b(?:telegram|whatsapp)\b/i,
  /\b(?:crypto|giveaway|airdrop)\b/i,
  /[\u0000-\u001f]/,
];

export function settlementModerationForName(
  value:
    | string
    | null
    | undefined,
): SettlementModeration {
  const normalized =
    value?.trim() ?? '';

  if (!normalized) {
    return 'approved';
  }

  if (
    normalized.length > 80 ||
    blockedPatterns.some(
      (pattern) =>
        pattern.test(normalized),
    )
  ) {
    return 'flagged';
  }

  return 'approved';
}
