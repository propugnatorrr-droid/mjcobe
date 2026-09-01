export function resolveSponsorPackageId(
  requestedPackageId: string | undefined,
  availablePackageIds: readonly string[],
  claimTop: boolean,
): string | undefined {
  if (
    claimTop ||
    !requestedPackageId
  ) {
    return undefined;
  }

  return availablePackageIds.includes(
    requestedPackageId,
  )
    ? requestedPackageId
    : undefined;
}

export function sponsorCheckoutHref(
  songSlug: string,
  input?: {
    packageId?: string;
    claimTop?: boolean;
  },
): string {
  const path =
    `/song/${encodeURIComponent(
      songSlug,
    )}/sponsor`;

  if (input?.claimTop) {
    return `${path}?claim=1`;
  }

  if (input?.packageId) {
    return (
      `${path}?package=` +
      encodeURIComponent(
        input.packageId,
      )
    );
  }

  return path;
}
