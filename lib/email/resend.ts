import 'server-only';

import type {
  EmailProvider,
} from './types';

type ResendResponse = {
  id?: string;
  message?: string;
  name?: string;
};

export const resendEmailProvider: EmailProvider = {
  id: 'resend',

  async send(message, idempotencyKey) {
    const apiKey =
      process.env.RESEND_API_KEY?.trim();

    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY is not configured.',
      );
    }

    const response = await fetch(
      'https://api.resend.com/emails',
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          'Content-Type':
            'application/json',
          'Idempotency-Key':
            idempotencyKey,
        },

        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          tags: [
            {
              name: 'application',
              value: 'mj-cobe',
            },
          ],
        }),

        cache: 'no-store',
      },
    );

    const body =
      await response
        .json()
        .catch(
          () => ({}),
        ) as ResendResponse;

    if (
      !response.ok ||
      !body.id
    ) {
      throw new Error(
        body.message ||
        body.name ||
        `Resend returned HTTP ${response.status}.`,
      );
    }

    return {
      messageId: body.id,
    };
  },
};
