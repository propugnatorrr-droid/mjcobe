import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  resolveSponsorPackageId,
  sponsorCheckoutHref,
} from '@/lib/checkout/sponsor-selection';

describe(
  'sponsor package selection',
  () => {
    const packageIds = [
      'digital-package',
      'featured-package',
    ];

    it(
      'accepts an available package',
      () => {
        expect(
          resolveSponsorPackageId(
            'featured-package',
            packageIds,
            false,
          ),
        ).toBe(
          'featured-package',
        );
      },
    );

    it(
      'rejects a package from another campaign',
      () => {
        expect(
          resolveSponsorPackageId(
            'unknown-package',
            packageIds,
            false,
          ),
        ).toBeUndefined();
      },
    );

    it(
      'ignores a package while claiming the top position',
      () => {
        expect(
          resolveSponsorPackageId(
            'featured-package',
            packageIds,
            true,
          ),
        ).toBeUndefined();
      },
    );
  },
);

describe(
  'sponsor checkout URL',
  () => {
    it(
      'builds a normal campaign checkout URL',
      () => {
        expect(
          sponsorCheckoutHref(
            'some-real',
          ),
        ).toBe(
          '/song/some-real/sponsor',
        );
      },
    );

    it(
      'preserves a selected package',
      () => {
        expect(
          sponsorCheckoutHref(
            'some-real',
            {
              packageId:
                'featured-package',
            },
          ),
        ).toBe(
          '/song/some-real/sponsor?package=featured-package',
        );
      },
    );

    it(
      'builds a top-position challenge URL',
      () => {
        expect(
          sponsorCheckoutHref(
            'some-real',
            {
              claimTop: true,
            },
          ),
        ).toBe(
          '/song/some-real/sponsor?claim=1',
        );
      },
    );

    it(
      'gives the top-position challenge precedence',
      () => {
        expect(
          sponsorCheckoutHref(
            'some-real',
            {
              packageId:
                'featured-package',
              claimTop: true,
            },
          ),
        ).toBe(
          '/song/some-real/sponsor?claim=1',
        );
      },
    );
  },
);
