export type RankableIdentity = {
  identityId: string;
  amountCents: number;
  firstSupportedAt: Date;
};

export function compareRankedIdentity(
  left: RankableIdentity,
  right: RankableIdentity,
): number {
  if (
    left.amountCents !==
    right.amountCents
  ) {
    return (
      right.amountCents -
      left.amountCents
    );
  }

  const timeDifference =
    left.firstSupportedAt.getTime() -
    right.firstSupportedAt.getTime();

  if (timeDifference !== 0) {
    return timeDifference;
  }

  return left.identityId.localeCompare(
    right.identityId,
  );
}

export function minimumToLead(
  leaderAmountCents: number,
  challengerAmountCents: number,
  incrementCents: number,
): number {
  return Math.max(
    incrementCents,
    leaderAmountCents +
      incrementCents -
      challengerAmountCents,
  );
}

export function shouldSendOutbid(
  input: {
    previousLeaderId:
      string | null;
    currentLeaderId:
      string | null;
    winnerIdentityId:
      string;
  },
): boolean {
  return Boolean(
    input.previousLeaderId &&
      input.currentLeaderId &&
      input.previousLeaderId !==
        input.currentLeaderId &&
      input.currentLeaderId ===
        input.winnerIdentityId,
  );
}
