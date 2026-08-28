import {
  createShareImage,
} from '@/lib/checkout/share-image';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: Context,
) {
  const { token } = await params;

  return createShareImage(
    token,
    'x',
  );
}
