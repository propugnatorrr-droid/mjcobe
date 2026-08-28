import 'server-only';

import {
  mockEmailProvider,
} from './mock';
import {
  resendEmailProvider,
} from './resend';
import type {
  EmailProvider,
} from './types';

export type {
  EmailMessage,
  EmailProvider,
  EmailSendResult,
} from './types';

export function getEmailProvider():
EmailProvider {
  const selected =
    process.env.EMAIL_PROVIDER
      ?.trim()
      .toLowerCase() ??
    'mock';

  if (selected === 'resend') {
    return resendEmailProvider;
  }

  if (
    selected !== 'mock'
  ) {
    throw new Error(
      `Unsupported EMAIL_PROVIDER: ${selected}`,
    );
  }

  return mockEmailProvider;
}
