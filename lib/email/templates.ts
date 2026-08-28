import 'server-only';

import type {
  EmailMessage,
} from './types';

export const notificationKinds = [
  'contribution_confirmation',
  'sponsor_confirmation',
  'sponsor_approved',
  'sponsor_declined',
  'refund_confirmation',
  'outbid',
  'top_ten',
  'milestone',
  'song_release',
  'video_release',
  'campaign_ended',
] as const;

export type NotificationKind =
  typeof notificationKinds[number];

export type ConfirmationPayload = {
  transactionId: string;
  contributionId: string;
  supportType: 'fan' | 'business';
  songTitle: string;
  songSlug: string;
  displayName: string | null;
  businessName: string | null;
  amountCents: number;
  supporterNumber: number | null;
  foundingNumber: number | null;
  rank: number | null;
  thanksToken: string | null;
};

function escapeHtml(
  value: string,
): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function money(
  cents: number,
): string {
  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
    },
  ).format(cents / 100);
}

function siteUrl(): string {
  const configured =
    process.env
      .NEXT_PUBLIC_SITE_URL
      ?.trim();

  return (
    configured ||
    'https://mjcobe.vercel.app'
  ).replace(/\/+$/, '');
}

function fromAddress(): string {
  return (
    process.env.EMAIL_FROM
      ?.trim() ||
    'MJ COBE <onboarding@resend.dev>'
  );
}

function confirmationEmail(
  recipientEmail: string,
  payload: ConfirmationPayload,
): EmailMessage {
  const business =
    payload.supportType ===
    'business';

  const name =
    business
      ? payload.businessName
      : payload.displayName;

  const greeting =
    name?.trim()
      ? `THANK YOU, ${name.trim().toUpperCase()}`
      : 'THANK YOU FOR BELIEVING EARLY';

  const subject =
    business
      ? `Your MJ COBE sponsorship is confirmed — ${payload.songTitle}`
      : `You backed ${payload.songTitle}`;

  const destination =
    payload.thanksToken
      ? `${siteUrl()}/thanks/${encodeURIComponent(payload.thanksToken)}`
      : `${siteUrl()}/song/${encodeURIComponent(payload.songSlug)}`;

  const numberLines: string[] = [];

  if (
    payload.supporterNumber !== null
  ) {
    numberLines.push(
      `Supporter #${payload.supporterNumber}`,
    );
  }

  if (
    payload.foundingNumber !== null
  ) {
    numberLines.push(
      `Founding Supporter #${payload.foundingNumber}`,
    );
  }

  if (
    payload.rank !== null
  ) {
    numberLines.push(
      `Current campaign rank: #${payload.rank}`,
    );
  }

  const statusCopy =
    business
      ? 'Your sponsorship has been approved and captured. Your business is now part of this record’s permanent journey.'
      : 'Your support has been received. You are now part of this record’s permanent journey.';

  const detailsText = [
    `Record: ${payload.songTitle}`,
    `Amount: ${money(payload.amountCents)}`,
    ...numberLines,
  ].join('\n');

  const detailsHtml = [
    `<strong>Record:</strong> ${escapeHtml(payload.songTitle)}`,
    `<strong>Amount:</strong> ${escapeHtml(money(payload.amountCents))}`,
    ...numberLines.map(
      (line) =>
        `<strong>${escapeHtml(line)}</strong>`,
    ),
  ]
    .map(
      (line) =>
        `<div style="margin:0 0 10px">${line}</div>`,
    )
    .join('');

  const text = [
    greeting,
    '',
    statusCopy,
    '',
    detailsText,
    '',
    `View your permanent confirmation: ${destination}`,
    '',
    'What starts as belief becomes history.',
    'MJ COBE',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#090909;color:#f5f0e7;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">
      Your support for ${escapeHtml(payload.songTitle)} is confirmed.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#090909">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #3e372b;background:#111111">
            <tr>
              <td style="padding:38px 36px;border-bottom:1px solid #3e372b">
                <div style="font-family:Georgia,Times,serif;font-size:27px;letter-spacing:5px;color:#d6b979">
                  MJ COBE
                </div>
                <div style="margin-top:9px;font-size:10px;letter-spacing:3px;color:#978b76">
                  THE JOURNEY OF A RECORD
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:42px 36px">
                <div style="font-size:11px;letter-spacing:2px;color:#d6b979">
                  ${escapeHtml(greeting)}
                </div>

                <h1 style="margin:18px 0 22px;font-family:Georgia,Times,serif;font-size:35px;line-height:1.15;font-weight:400;color:#f5f0e7">
                  ${escapeHtml(payload.songTitle)}
                </h1>

                <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#c8c0b2">
                  ${escapeHtml(statusCopy)}
                </p>

                <div style="padding:22px;border:1px solid #3e372b;background:#0c0c0c;font-size:14px;line-height:1.6;color:#d8d0c3">
                  ${detailsHtml}
                </div>

                <div style="margin-top:32px">
                  <a
                    href="${escapeHtml(destination)}"
                    style="display:inline-block;padding:15px 24px;background:#d6b979;color:#090909;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:2px"
                  >
                    VIEW YOUR PLACE IN THE JOURNEY
                  </a>
                </div>

                <p style="margin:34px 0 0;font-family:Georgia,Times,serif;font-size:19px;line-height:1.5;color:#f5f0e7">
                  What starts as belief becomes history.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 36px;border-top:1px solid #3e372b;font-size:11px;line-height:1.6;color:#786f62">
                This is a transactional confirmation for your support of MJ COBE.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    to: recipientEmail,
    from: fromAddress(),
    subject,
    html,
    text,
  };
}

export function buildNotificationEmail(
  kind: NotificationKind,
  recipientEmail: string,
  payload: Record<string, unknown>,
): EmailMessage {
  if (
    kind ===
      'contribution_confirmation' ||
    kind ===
      'sponsor_confirmation' ||
    kind ===
      'sponsor_approved'
  ) {
    return confirmationEmail(
      recipientEmail,
      payload as ConfirmationPayload,
    );
  }

  throw new Error(
    `No email template exists for notification kind: ${kind}`,
  );
}
