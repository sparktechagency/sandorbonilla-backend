import { StatusCodes } from "http-status-codes";
import { User } from "../../../app/modules/user/user.model";
import AppError from "../../../errors/AppError";
import Stripe from "stripe";

const handleAccountUpdate = async (account: Stripe.Account) => {
  try {
    // Fetch user by the account ID associated with the Stripe Connect account
    const user = await User.findOne({ 'stripeConnectAccount.accountId': account.id });

    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, 'User not found for this Stripe Connect account');
    }

    // Update the user record with the latest account status
    await User.findByIdAndUpdate(user._id, {
      'stripeConnectAccount.payoutEnabled': account.payouts_enabled,
      'stripeConnectAccount.chargesEnabled': account.charges_enabled,
      'stripeConnectAccount.onboardingComplete': account.details_submitted,
      'stripeConnectAccount.accountStatus': account.details_submitted ? 'active' : 'pending',
      'stripeConnectAccount.lastUpdated': new Date(),
    });

    console.log('Account status updated in database');
  } catch (err) {
    console.error('Error handling account update:', err);
  }
};