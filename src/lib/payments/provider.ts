import { Prisma } from '@prisma/client';

export type PaymentIntent = {
  provider: string;
  providerPaymentId: string;
  amount: Prisma.Decimal;
  currency: string;
  checkoutUrl?: string;
};

export interface PaymentProvider {
  readonly name: string;
  createIntent(input: { paymentId: string; amount: Prisma.Decimal; currency: string; returnUrl?: string }): Promise<PaymentIntent>;
  capture(input: { providerPaymentId: string; amount?: Prisma.Decimal }): Promise<void>;
  refund(input: { providerPaymentId: string; amount: Prisma.Decimal; reason?: string }): Promise<void>;
}

class ManualPaymentProvider implements PaymentProvider {
  readonly name = 'manual';

  async createIntent(): Promise<PaymentIntent> {
    throw new Error('MANUAL_PROVIDER_DOES_NOT_CREATE_INTENTS');
  }

  async capture(): Promise<void> {
    throw new Error('MANUAL_PROVIDER_DOES_NOT_CAPTURE');
  }

  async refund(): Promise<void> {
    throw new Error('MANUAL_PROVIDER_DOES_NOT_REFUND');
  }
}

const providers = new Map<string, PaymentProvider>([['manual', new ManualPaymentProvider()]]);

export function getPaymentProvider(name: string | null | undefined): PaymentProvider {
  const provider = providers.get(name?.trim().toLowerCase() || 'manual');
  if (!provider) throw new Error(`PAYMENT_PROVIDER_NOT_CONFIGURED:${name}`);
  return provider;
}