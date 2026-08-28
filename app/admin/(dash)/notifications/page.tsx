import {
  AdminHeading,
  AdminHint,
  InlineAction,
  Table,
  Td,
} from '@/components/admin/ui';
import {
  listNotifications,
} from '@/lib/admin/queries';
import {
  retryNotification,
} from '@/lib/admin/actions';
import {
  formatDay,
} from '@/lib/song/queries';

export const dynamic =
  'force-dynamic';

function statusColor(
  status: string,
): string {
  if (status === 'sent') {
    return 'var(--champagne)';
  }

  if (status === 'failed') {
    return 'var(--ember)';
  }

  return 'var(--text-dim)';
}

export default async function
NotificationsPage() {
  const notifications =
    await listNotifications();

  return (
    <>
      <AdminHeading>
        EMAIL DELIVERY
      </AdminHeading>

      <AdminHint>
        Transactional confirmation
        delivery, retry attempts and
        provider responses. Payment
        settlement remains successful
        even when an email delivery
        fails.
      </AdminHint>

      <Table
        head={[
          'CREATED',
          'RECIPIENT',
          'TYPE',
          'STATUS',
          'ATTEMPTS',
          'PROVIDER ID',
          'LAST ERROR',
          'ACTION',
        ]}
      >
        {notifications.map(
          async (notification) => (
            <tr
              key={
                notification.id
              }
            >
              <Td mono dim nowrap>
                {await formatDay(
                  notification.createdAt,
                )}
              </Td>

              <Td mono>
                {notification
                  .recipientEmail ??
                  '—'}
              </Td>

              <Td mono dim>
                {notification.kind}
              </Td>

              <Td mono nowrap>
                <span
                  className="uppercase"
                  style={{
                    color:
                      statusColor(
                        notification
                          .deliveryStatus,
                      ),
                  }}
                >
                  {
                    notification
                      .deliveryStatus
                  }
                </span>
              </Td>

              <Td mono>
                {
                  notification
                    .attemptCount
                }
              </Td>

              <Td mono dim>
                {notification
                  .providerMessageId ??
                  '—'}
              </Td>

              <Td dim>
                {notification
                  .lastError ??
                  '—'}
              </Td>

              <Td nowrap>
                {notification
                  .deliveryStatus !==
                'sent' ? (
                  <form
                    action={
                      retryNotification
                    }
                  >
                    <input
                      type="hidden"
                      name="notificationId"
                      value={
                        notification.id
                      }
                    />

                    <InlineAction>
                      RETRY
                    </InlineAction>
                  </form>
                ) : (
                  <span className="font-mono text-eyebrow text-[var(--text-dim)]">
                    DELIVERED
                  </span>
                )}
              </Td>
            </tr>
          ),
        )}
      </Table>

      {notifications.length ===
      0 ? (
        <p className="mt-8 text-body text-[var(--text-dim)]">
          No transactional
          notifications have been
          created yet.
        </p>
      ) : null}
    </>
  );
}
