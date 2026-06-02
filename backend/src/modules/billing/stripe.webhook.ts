import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { config } from '@/config';
import { stripe } from '@/lib/stripe';
import { logger, logToDb } from '@/services/logger.service';
import { LogLevel } from '@prisma/client';
import {
  handleCheckoutSessionCompleted,
  handleSubscriptionDeleted,
  handleSubscriptionUpsert,
} from './billing.service';

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const signature = req.headers['stripe-signature'];

  if (!signature || typeof signature !== 'string') {
    res.status(400).send('Missing Stripe signature');
    return;
  }

  let event: Stripe.Event;

  try {
    const rawBody = req.body as Buffer;
    event = stripe.webhooks.constructEvent(rawBody, signature, config.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    logger.error('Stripe webhook signature verification failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(400).send('Webhook signature verification failed');
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'payment') {
          await handleCheckoutSessionCompleted(session);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpsert(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        logger.debug('Unhandled Stripe webhook event', { type: event.type });
    }
  } catch (error) {
    logger.error('Stripe webhook handler error', {
      type: event.type,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    await logToDb(LogLevel.error, 'stripe', 'Webhook processing failed', {
      event_type: event.type,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  res.status(200).json({ received: true });
}
