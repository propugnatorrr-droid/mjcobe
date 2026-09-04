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
  'brand_submission_invite',
  'ticket_order_confirmation',
  'shop_order_confirmation',
  'shop_shipment',
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
export type BrandSubmissionInvitePayload = {
  businessName: string;
  submissionUrl: string;
  expiresAtIso: string;
};
export type TicketOrderConfirmationPayload = {
  eventTitle: string;
  orderNumber: string;
  tickets: { displayCode: string; ticketUrl: string; eventTitle: string }[];
};
export type ShopOrderConfirmationPayload = {
  orderNumber: string;
  orderUrl: string;
  items: { title: string; quantity: number; lineTotalCents: number }[];
  totalCents: number;
};
export type ShopShipmentPayload = {
  orderNumber: string;
  orderUrl: string;
  carrier: string | null;
  trackingNumber: string | null;
};

export type OutbidPayload = {
  songTitle: string;
  songSlug: string;
  scope:
    | 'fan'
    | 'business';
  leadingAmountCents: number;
  minimumToReclaimCents:
    number;
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

export function siteUrl(): string {
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
/** The submission link itself is the bearer credential — it's meant to be
 * in this email, once, for its intended recipient. Nothing here logs it;
 * see lib/feed/invites.ts for where the token is generated and hashed. */
function brandSubmissionInviteEmail(
  recipientEmail: string,
  payload: BrandSubmissionInvitePayload,
): EmailMessage {
  const subject = `Post to the MJ COBE feed — ${payload.businessName}`;

  const expiresLabel = new Date(payload.expiresAtIso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const text = [
    'YOU’RE INVITED TO POST',
    '',
    `MJ COBE has invited ${payload.businessName} to submit content for the brand feed.`,
    'Every submission is reviewed before it goes public — nothing you send is published automatically.',
    '',
    `Submit here: ${payload.submissionUrl}`,
    '',
    `This link expires ${expiresLabel} and can only be used once.`,
    '',
    'MJ COBE',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#090909;color:#f5f0e7;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#090909">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #3e372b;background:#111111">
            <tr>
              <td style="padding:38px 36px;border-bottom:1px solid #3e372b">
                <div style="font-family:Georgia,Times,serif;font-size:27px;letter-spacing:5px;color:#d6b979">
                  MJ COBE
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:42px 36px">
                <div style="font-size:11px;letter-spacing:2px;color:#d6b979">
                  YOU'RE INVITED TO POST
                </div>
                <h1 style="margin:18px 0 22px;font-family:Georgia,Times,serif;font-size:30px;line-height:1.2;font-weight:400;color:#f5f0e7">
                  ${escapeHtml(payload.businessName)}
                </h1>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#c8c0b2">
                  MJ COBE has invited you to submit content for the brand feed. Every submission is reviewed before it goes public — nothing you send is published automatically.
                </p>
                <div style="margin-top:28px">
                  <a
                    href="${escapeHtml(payload.submissionUrl)}"
                    style="display:inline-block;padding:15px 24px;background:#d6b979;color:#090909;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:2px"
                  >
                    SUBMIT YOUR POST
                  </a>
                </div>
                <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#786f62">
                  This link expires ${escapeHtml(expiresLabel)} and can only be used once.
                </p>
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

/** Each ticket's own link is the bearer credential (an HMAC-signed
 * deterministic value, not a stored secret — see lib/tickets/credentials.ts) —
 * meant to be in this email, once, for its buyer. Nothing here logs it. */
function ticketOrderConfirmationEmail(
  recipientEmail: string,
  payload: TicketOrderConfirmationPayload,
): EmailMessage {
  const subject = `Your tickets — ${payload.eventTitle}`;

  const text = [
    'YOUR TICKETS',
    '',
    `Order ${payload.orderNumber} for ${payload.eventTitle} is confirmed.`,
    '',
    ...payload.tickets.map((ticket) => `Ticket ${ticket.displayCode}: ${ticket.ticketUrl}`),
    '',
    'Show the QR code on any ticket link at the door, or give staff the code printed above it.',
    '',
    'MJ COBE',
  ].join('\n');

  const ticketRows = payload.tickets
    .map(
      (ticket) => `
              <tr>
                <td style="padding:16px 0;border-bottom:1px solid #3e372b">
                  <div style="font-size:11px;letter-spacing:2px;color:#d6b979">${escapeHtml(ticket.displayCode)}</div>
                  <a href="${escapeHtml(ticket.ticketUrl)}" style="color:#f5f0e7;font-size:15px;text-decoration:underline">
                    View this ticket
                  </a>
                </td>
              </tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#090909;color:#f5f0e7;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#090909">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #3e372b;background:#111111">
            <tr>
              <td style="padding:38px 36px;border-bottom:1px solid #3e372b">
                <div style="font-family:Georgia,Times,serif;font-size:27px;letter-spacing:5px;color:#d6b979">
                  MJ COBE
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:42px 36px">
                <div style="font-size:11px;letter-spacing:2px;color:#d6b979">
                  YOUR TICKETS
                </div>
                <h1 style="margin:18px 0 10px;font-family:Georgia,Times,serif;font-size:30px;line-height:1.2;font-weight:400;color:#f5f0e7">
                  ${escapeHtml(payload.eventTitle)}
                </h1>
                <p style="margin:0 0 18px;font-size:13px;color:#786f62">
                  Order ${escapeHtml(payload.orderNumber)}
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${ticketRows}
                </table>
                <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#786f62">
                  Show the QR code on any ticket link at the door, or give staff the code printed above it.
                </p>
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

function shopOrderConfirmationEmail(
  recipientEmail: string,
  payload: ShopOrderConfirmationPayload,
): EmailMessage {
  const subject = `Order confirmed — ${payload.orderNumber}`;

  const text = [
    'ORDER CONFIRMED',
    '',
    `Order ${payload.orderNumber}`,
    '',
    ...payload.items.map((item) => `${item.title} ×${item.quantity} — ${money(item.lineTotalCents)}`),
    '',
    `Total: ${money(payload.totalCents)}`,
    '',
    `View your order: ${payload.orderUrl}`,
    '',
    'MJ COBE',
  ].join('\n');

  const itemRows = payload.items
    .map(
      (item) => `
              <tr>
                <td style="padding:14px 0;border-bottom:1px solid #3e372b;color:#f5f0e7;font-size:15px">${escapeHtml(item.title)} ×${item.quantity}</td>
                <td style="padding:14px 0;border-bottom:1px solid #3e372b;color:#c8c0b2;font-size:15px;text-align:right">${escapeHtml(money(item.lineTotalCents))}</td>
              </tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#090909;color:#f5f0e7;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#090909">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #3e372b;background:#111111">
            <tr>
              <td style="padding:38px 36px;border-bottom:1px solid #3e372b">
                <div style="font-family:Georgia,Times,serif;font-size:27px;letter-spacing:5px;color:#d6b979">
                  MJ COBE
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:42px 36px">
                <div style="font-size:11px;letter-spacing:2px;color:#d6b979">
                  ORDER CONFIRMED
                </div>
                <p style="margin:18px 0 22px;font-size:13px;color:#786f62">
                  Order ${escapeHtml(payload.orderNumber)}
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${itemRows}
                  <tr>
                    <td style="padding-top:16px;color:#f5f0e7;font-size:16px;font-weight:bold">Total</td>
                    <td style="padding-top:16px;color:#d6b979;font-size:16px;font-weight:bold;text-align:right">${escapeHtml(money(payload.totalCents))}</td>
                  </tr>
                </table>
                <div style="margin-top:28px">
                  <a
                    href="${escapeHtml(payload.orderUrl)}"
                    style="display:inline-block;padding:15px 24px;background:#d6b979;color:#090909;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:2px"
                  >
                    VIEW YOUR ORDER
                  </a>
                </div>
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

function shopShipmentEmail(
  recipientEmail: string,
  payload: ShopShipmentPayload,
): EmailMessage {
  const subject = `Your order shipped — ${payload.orderNumber}`;

  const trackingLine = payload.trackingNumber
    ? `${payload.carrier ? payload.carrier + ' — ' : ''}${payload.trackingNumber}`
    : 'Tracking details to follow.';

  const text = [
    'YOUR ORDER SHIPPED',
    '',
    `Order ${payload.orderNumber}`,
    trackingLine,
    '',
    `View your order: ${payload.orderUrl}`,
    '',
    'MJ COBE',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#090909;color:#f5f0e7;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#090909">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #3e372b;background:#111111">
            <tr>
              <td style="padding:38px 36px;border-bottom:1px solid #3e372b">
                <div style="font-family:Georgia,Times,serif;font-size:27px;letter-spacing:5px;color:#d6b979">
                  MJ COBE
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:42px 36px">
                <div style="font-size:11px;letter-spacing:2px;color:#d6b979">
                  YOUR ORDER SHIPPED
                </div>
                <p style="margin:18px 0 8px;font-size:13px;color:#786f62">
                  Order ${escapeHtml(payload.orderNumber)}
                </p>
                <p style="margin:0 0 22px;font-size:16px;color:#f5f0e7">
                  ${escapeHtml(trackingLine)}
                </p>
                <div style="margin-top:10px">
                  <a
                    href="${escapeHtml(payload.orderUrl)}"
                    style="display:inline-block;padding:15px 24px;background:#d6b979;color:#090909;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:2px"
                  >
                    VIEW YOUR ORDER
                  </a>
                </div>
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

function outbidEmail(
  recipientEmail: string,
  payload: OutbidPayload,
): EmailMessage {
  const destination =
    payload.scope === 'business'
      ? `${siteUrl()}/song/${encodeURIComponent(payload.songSlug)}/sponsor`
      : `${siteUrl()}/back?song=${encodeURIComponent(payload.songSlug)}`;

  const subject =
    `The lead changed — ${payload.songTitle}`;

  const reclaim =
    money(
      payload
        .minimumToReclaimCents,
    );

  const leading =
    money(
      payload
        .leadingAmountCents,
    );

  const text = [
    'THE LEAD CHANGED',
    '',
    `Another supporter now leads ${payload.songTitle} at ${leading}.`,
    `Add ${reclaim} or more to reclaim first place.`,
    '',
    destination,
    '',
    'MJ COBE',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#090909;color:#f5f0e7;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border-top:2px solid #d6b979;border-bottom:1px solid #3e372b">
            <tr>
              <td style="padding:36px 0">
                <div style="font-size:10px;letter-spacing:3px;color:#d6b979">
                  LEADERBOARD UPDATE
                </div>

                <h1 style="margin:18px 0;font-family:Georgia,Times,serif;font-size:38px;font-weight:400">
                  The lead changed.
                </h1>

                <p style="font-size:16px;line-height:1.7;color:#c8c0b2">
                  Another supporter now leads
                  <strong>${escapeHtml(payload.songTitle)}</strong>
                  at ${escapeHtml(leading)}.
                </p>

                <p style="font-size:16px;line-height:1.7;color:#c8c0b2">
                  Add ${escapeHtml(reclaim)} or more to reclaim first place.
                </p>

                <p style="margin-top:30px">
                  <a href="${escapeHtml(destination)}" style="display:inline-block;border-bottom:1px solid #d6b979;padding:8px 0;color:#f5f0e7;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:2px">
                    RETURN TO THE RECORD →
                  </a>
                </p>
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
    text,
    html,
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
  if (kind === 'outbid') {
    return outbidEmail(
      recipientEmail,
      payload as OutbidPayload,
    );
  }
  if (kind === 'brand_submission_invite') {
    return brandSubmissionInviteEmail(
      recipientEmail,
      payload as BrandSubmissionInvitePayload,
    );
  }
  if (kind === 'ticket_order_confirmation') {
    return ticketOrderConfirmationEmail(
      recipientEmail,
      payload as TicketOrderConfirmationPayload,
    );
  }
  if (kind === 'shop_order_confirmation') {
    return shopOrderConfirmationEmail(
      recipientEmail,
      payload as ShopOrderConfirmationPayload,
    );
  }
  if (kind === 'shop_shipment') {
    return shopShipmentEmail(
      recipientEmail,
      payload as ShopShipmentPayload,
    );
  }

  throw new Error(
    `No email template exists for notification kind: ${kind}`,
  );
}
