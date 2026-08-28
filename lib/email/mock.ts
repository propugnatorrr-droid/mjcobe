import 'server-only';

import {
  randomUUID,
} from 'node:crypto';
import type {
  EmailProvider,
} from './types';

export const mockEmailProvider: EmailProvider = {
  id: 'mock',

  async send(message, idempotencyKey) {
    console.info(
      '[email:mock]',
      JSON.stringify({
        idempotencyKey,
        to: message.to,
        from: message.from,
        subject: message.subject,
      }),
    );

    return {
      messageId:
        `mock_${randomUUID()}`,
    };
  },
};
