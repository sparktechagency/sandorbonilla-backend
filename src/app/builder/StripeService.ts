import Stripe from 'stripe';
import stripe from '../../config/stripe';
import { User } from '../modules/user/user.model';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import config from '../../config';

class StripeService {
     // Create a connected account for the seller
     async createConnectedAccount(email: string, userId: string): Promise<Stripe.Account> {
          try {
               // Create a Stripe Connect Express account
               const account = await stripe.accounts.create({
                    type: 'express', // Express account for easier onboarding
                    email,
                    capabilities: {
                         transfers: { requested: true },
                         card_payments: { requested: true },
                    },
                    metadata: {
                         userId: userId
                    }
               });
               
               // Update user with the new account ID
               await User.findByIdAndUpdate(userId, {
                    'stripeConnectAccount.accountId': account.id,
                    'stripeConnectAccount.accountStatus': 'pending',
                    'stripeConnectAccount.lastUpdated': new Date()
               });
               
               return account;
          } catch (error: any) {
               throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create Connect account: ${error.message}`);
          }
     }

     // Generate the account onboarding link for the seller
     async createAccountLink(userId: string): Promise<string> {
          try {
               // Get user with Connect account ID
               const user = await User.findById(userId);
               
               if (!user || !user.stripeConnectAccount?.accountId) {
                    throw new AppError(StatusCodes.NOT_FOUND, 'No Stripe Connect account found for this user');
               }
               
               const accountLink = await stripe.accountLinks.create({
                    account: user.stripeConnectAccount.accountId,
                    refresh_url: `${config.frontend_url}/seller/account/refresh`,
                    return_url: `${config.frontend_url}/seller/account/setup-complete`,
                    type: 'account_onboarding',
               });
               
               return accountLink.url;
          } catch (error: any) {
               throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create account link: ${error.message}`);
          }
     }


     // Generate a login link for the connected user's Express Dashboard
     async createLoginLink(userId: string): Promise<string> {
          try {
               const user = await User.findById(userId);
               
               if (!user || !user.stripeConnectAccount?.accountId) {
                    throw new AppError(StatusCodes.NOT_FOUND, 'No Stripe Connect account found for this user');
               }
               
               const loginLink = await stripe.accounts.createLoginLink(user.stripeConnectAccount.accountId);
               
               // Update the login URL in the user's record
               await User.findByIdAndUpdate(userId, {
                    'stripeConnectAccount.loginUrl': loginLink.url,
                    'stripeConnectAccount.lastUpdated': new Date()
               });
               
               return loginLink.url;
          } catch (error: any) {
               throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create login link: ${error.message}`);
          }
     }

     // Check the status of a Connect account
     async checkAccountStatus(userId: string): Promise<Stripe.Account> {
          try {
               const user = await User.findById(userId);
               
               if (!user || !user.stripeConnectAccount?.accountId) {
                    throw new AppError(StatusCodes.NOT_FOUND, 'No Stripe Connect account found for this user');
               }
               
               const account = await stripe.accounts.retrieve(user.stripeConnectAccount.accountId);
               
               // Update user record with latest account status
               await User.findByIdAndUpdate(userId, {
                    'stripeConnectAccount.payoutEnabled': account.payouts_enabled,
                    'stripeConnectAccount.chargesEnabled': account.charges_enabled,
                    'stripeConnectAccount.onboardingComplete': account.details_submitted,
                    'stripeConnectAccount.accountStatus': account.details_submitted ? 'active' : 'pending',
                    'stripeConnectAccount.lastUpdated': new Date()
               });
               
               return account;
          } catch (error: any) {
               throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to check account status: ${error.message}`);
          }
     }

     // Create a transfer to the seller's Connect account
     async createTransfer(userId: string, amount: number, description: string): Promise<Stripe.Transfer> {
          try {
               const user = await User.findById(userId);
               
               if (!user || !user.stripeConnectAccount?.accountId) {
                    throw new AppError(StatusCodes.NOT_FOUND, 'No Stripe Connect account found for this user');
               }
               
               if (!user.stripeConnectAccount.payoutEnabled) {
                    throw new AppError(StatusCodes.BAD_REQUEST, 'Payouts are not enabled for this account');
               }
               
               const transfer = await stripe.transfers.create({
                    amount: Math.round(amount * 100), // Convert to cents
                    currency: 'usd',
                    destination: user.stripeConnectAccount.accountId,
                    description: description,
                    metadata: {
                         userId: userId,
                         transferredAt: new Date().toISOString()
                    }
               });
               
               return transfer;
          } catch (error: any) {
               throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create transfer: ${error.message}`);
          }
     }
}

export default new StripeService();
