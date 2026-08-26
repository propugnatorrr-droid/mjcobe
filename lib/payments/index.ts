import 'server-only';
import type { PaymentProvider, ProviderId } from './types';
import { mockProvider } from './mock';
import { offlineProvider } from './offline';
import { stripeProvider } from './stripe';

const registry: Record<ProviderId, PaymentProvider> = {
  mock: mockProvider,
  offline: offlineProvider,
  stripe: stripeProvider,
};

export function getProvider(id?: ProviderId): PaymentProvider {
  const configured = (process.env.PAYMENTS_PROVIDER ?? 'mock') as ProviderId;
  return registry[id ?? configured] ?? mockProvider;
}

/** Drives the SIMULATION MODE ribbon. */
export function paymentsAreSimulated(): boolean {
  return getProvider().isSimulated;
}

export * from './types';
