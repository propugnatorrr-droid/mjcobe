import {
  createShareImage,
  shareImageNotFound,
} from '@/lib/checkout/share-image';
import {
  parseShareFormat,
} from '@/lib/checkout/share-formats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = {
  params: Promise<{
    token: string;
    format: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: Context,
) {
  const {
    token,
    format: requestedFormat,
  } = await params;

  const format =
    parseShareFormat(
      requestedFormat,
    );

  if (!format) {
    return shareImageNotFound();
  }

  return createShareImage(
    token,
    format,
  );
}
