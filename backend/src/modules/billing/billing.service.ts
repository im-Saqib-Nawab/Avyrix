import { LogLevel, SubscriptionStatus, TransactionType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { config } from '@/config';
import { findCreditPack, getPlansForApi } from '@/config/plans';
import { AppError } from '@/lib/appError';
import { logger, logToDb } from '@/services/logger.service';
import { sendCreditsUpdated } from '@/services/websocket.service';
import type { CreditTransactionResponse } from '@/types/credits.types';
import type { CheckoutInput } from './billing.schema';
import Stripe from 'stripe';

export function getPlans() {
  return getPlansForApi();
}

async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripe_customer_id: true },
  });

  if (user?.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripe_customer_id: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSession(userId: string, email: string, input: CheckoutInput) {
  const pack = findCreditPack(input.pack_id);
  if (!pack) {
    throw new AppError(404, 'NOT_FOUND', 'Credit pack not found.');
  }

  const customerId = await getOrCreateStripeCustomer(userId, email);

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = pack.stripe_price_id
    ? { price: pack.stripe_price_id, quantity: 1 }
    : {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(pack.price_usd * 100),
          product_data: {
            name: pack.name,
            description: `${pack.credits} AVYRIX AI credits`,
          },
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [lineItem],
    success_url: `${config.FRONTEND_URL}/billing?success=true`,
    cancel_url: `${config.FRONTEND_URL}/billing?cancelled=true`,
    metadata: {
      user_id: userId,
      pack_id: pack.id,
      credits: String(pack.credits),
    },
  });

  if (!session.url) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Failed to create checkout session.');
  }

  return { checkout_url: session.url };
}

export async function addCreditsFromPurchase(
  userId: string,
  credits: number,
  packId: string,
  description: string,
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { credit_balance: { increment: credits } },
      select: { credit_balance: true },
    });

    await tx.creditTransaction.create({
      data: {
        user_id: userId,
        type: TransactionType.purchase,
        amount: credits,
        balance_after: updated.credit_balance,
        description,
      },
    });

    await logToDb(LogLevel.info, 'stripe', 'Credits purchased', {
      user_id: userId,
      pack_id: packId,
      credits,
    });

    return updated.credit_balance;
  });
}

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.metadata?.user_id;
  const packId = session.metadata?.pack_id ?? 'unknown';
  const creditsRaw = session.metadata?.credits;

  if (!userId || !creditsRaw) {
    throw new Error('Checkout session missing required metadata');
  }

  const sessionId = session.id;
  const idempotencyMarker = `stripe:${sessionId}`;

  const alreadyProcessed = await prisma.creditTransaction.findFirst({
    where: {
      user_id: userId,
      type: TransactionType.purchase,
      description: { contains: idempotencyMarker },
    },
    select: { id: true },
  });

  if (alreadyProcessed) {
    logger.info('Stripe checkout already processed — skipping duplicate credit', {
      session_id: sessionId,
      user_id: userId,
    });
    return;
  }

  const credits = Number.parseInt(creditsRaw, 10);
  if (!Number.isFinite(credits) || credits <= 0) {
    throw new Error('Invalid credits amount in checkout metadata');
  }

  const pack = findCreditPack(packId);
  const baseDescription = pack ? `${pack.name} Purchase` : 'Credit pack purchase';
  const description = `${baseDescription} (${idempotencyMarker})`;

  const newBalance = await addCreditsFromPurchase(userId, credits, packId, description);
  sendCreditsUpdated(userId, newBalance);
}

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return SubscriptionStatus.active;
    case 'past_due':
    case 'unpaid':
      return SubscriptionStatus.past_due;
    case 'canceled':
    case 'incomplete_expired':
      return SubscriptionStatus.cancelled;
    default:
      return SubscriptionStatus.free;
  }
}

export async function handleSubscriptionUpsert(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const user = await prisma.user.findFirst({
    where: { stripe_customer_id: customerId },
  });

  if (!user) {
    throw new Error(`No user found for Stripe customer ${customerId}`);
  }

  const status = mapStripeSubscriptionStatus(subscription.status);
  const priceId = subscription.items.data[0]?.price?.id ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: { stripe_subscription_id: subscription.id },
      create: {
        user_id: user.id,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      update: {
        stripe_price_id: priceId,
        status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        subscription_status:
          status === SubscriptionStatus.active ? SubscriptionStatus.active : status,
      },
    });
  });
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const user = await prisma.user.findFirst({
    where: { stripe_customer_id: customerId },
  });

  if (!user) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({
      where: { stripe_subscription_id: subscription.id },
      data: { status: SubscriptionStatus.cancelled },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { subscription_status: SubscriptionStatus.cancelled },
    });
  });
}

export async function getPurchaseHistory(userId: string): Promise<CreditTransactionResponse[]> {
  const transactions = await prisma.creditTransaction.findMany({
    where: {
      user_id: userId,
      type: TransactionType.purchase,
    },
    orderBy: { created_at: 'desc' },
  });

  return transactions.map((tx) => ({
    id: tx.id,
    type: 'purchase' as const,
    amount: tx.amount,
    balance_after: tx.balance_after,
    description: tx.description,
    created_at: tx.created_at.toISOString(),
    generation_id: tx.generation_id,
  }));
}
