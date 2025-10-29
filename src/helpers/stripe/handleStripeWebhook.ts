import { Request, Response } from 'express';
import Stripe from 'stripe';
import colors from 'colors';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../shared/logger';
import config from '../../config';
import stripe from '../../config/stripe';
import AppError from '../../errors/AppError';
import { handleSuccessfulPayment } from './handlers/handleSuccessfulPayment';
import { handleFailedPayment } from './handlers/handleFailedPayment ';
import { handleAccountUpdate } from './handlers';

const handleStripeWebhook = async (req: Request, res: Response) => {
     const signature = req.headers['stripe-signature'] as string;
     const webhookSecret = config.stripe.stripe_webhook_secret as string;

     let event: Stripe.Event | undefined;
     try {
          event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
     } catch (error) {
          throw new AppError(StatusCodes.BAD_REQUEST, `Webhook signature verification failed. ${error}`);
     }
     if (!event) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid event received!');
     }

     const eventType = event.type;
     console.log('this is event type', eventType);
     try {
          switch (eventType) {
               case 'account.updated':
                    const account = event.data.object as Stripe.Account;
                    await handleAccountUpdate(account);
                    break;
               case 'checkout.session.completed':
                    const session = event.data.object as Stripe.Checkout.Session;
                    handleSuccessfulPayment(session);
                    break;
               case 'payment_intent.payment_failed':
                    const failedIntent = event.data.object as Stripe.PaymentIntent;
                    handleFailedPayment(failedIntent);
                    break;
               default:
                    logger.warn(colors.bgGreen.bold(`Unhandled event type: ${eventType}`));
          }
     } catch (error) {
          throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Error handling event: ${error}`);
     }
     res.sendStatus(200);
};

export default handleStripeWebhook;
