import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { User } from "../../../app/modules/user/user.model";
import StripeService from "../../../app/builder/StripeService";
import Stripe from "stripe";

export const handleAccountUpdatedEvent = async (account: Stripe.Account) => {
  try {
    const user = await User.findOne({ 'stripeConnectAccount.accountId': account.id });

    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, `User not found for account ID: ${account.id}`);
    }
    if (account.charges_enabled) {
      const loginLink = await StripeService.createLoginLink(account.id);
      await User.findByIdAndUpdate(user._id, {
        'stripeConnectAccount.payoutEnabled': account.payouts_enabled,
        'stripeConnectAccount.chargesEnabled': account.charges_enabled,
        'stripeConnectAccount.onboardingComplete': account.details_submitted,
        'stripeConnectAccount.accountStatus': account.details_submitted ? 'active' : 'pending',
        'stripeConnectAccount.loginUrl': loginLink, 
        'stripeConnectAccount.lastUpdated': new Date(),
      });

      console.log('Account updated: Payouts enabled, charges enabled, login link generated.');
    } else {
      await User.findByIdAndUpdate(user._id, {
        'stripeConnectAccount.payoutEnabled': account.payouts_enabled,
        'stripeConnectAccount.chargesEnabled': account.charges_enabled,
        'stripeConnectAccount.onboardingComplete': account.details_submitted,
        'stripeConnectAccount.accountStatus': account.details_submitted ? 'active' : 'pending',
        'stripeConnectAccount.lastUpdated': new Date(),
      });

      console.log('Account status updated without login link (onboarding not complete).');
    }
  } catch (err) {
    console.error('Error handling account update:', err);
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to process account update`);
  }
};
