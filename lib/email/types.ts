import 'server-only';

export type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailSendResult = {
  messageId: string;
};

export interface EmailProvider {
  readonly id: 'mock' | 'resend';

  send(
    message: EmailMessage,
    idempotencyKey: string,
  ): Promise<EmailSendResult>;
}
