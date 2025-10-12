import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import twilio, { Twilio } from 'twilio';
import AppError from '../../errors/AppError';

class TwilioService {
     private client: Twilio;

     constructor() {
          const accountSid = config.twilio.accountSid;
          const authToken = config.twilio.authToken;

          // Initialize Twilio client
          this.client = twilio(accountSid, authToken);
     }

     // Using Twilio Verify API (supports channel parameter)
     async sendOTPWithVerify(phoneNumber: string): Promise<void> {
          try {
               await this.client.verify.v2
                    .services(config.twilio.verifyServiceSid)
                    .verifications.create({
                         to: phoneNumber,
                         channel: 'sms',
                    });
          } catch (error: any) {
               throw new AppError(
                    StatusCodes.EXPECTATION_FAILED,
                    `Failed to send verification code: ${error.message}`,
               );
          }
     }

     // Verify the OTP
     async verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
          try {
               const verification = await this.client.verify.v2
                    .services(config.twilio.verifyServiceSid)
                    .verificationChecks.create({
                         to: phoneNumber,
                         code: code,
                    });

               return verification.status === 'approved';
          } catch (error: any) {
               throw new AppError(
                    StatusCodes.EXPECTATION_FAILED,
                    `Failed to verify code: ${error.message}`,
               );
          }
     }

     // Original method (no channel support but custom OTP)
     async sendOTP(phoneNumber: string, otp: number): Promise<void> {
          try {
               await this.client.messages.create({
                    body: `Your verification code is: ${otp}`,
                    from: config.twilio.number,
                    to: phoneNumber,
               });
          } catch (error: any) {
               throw new AppError(
                    StatusCodes.EXPECTATION_FAILED,
                    `Failed to send verification code: ${error.message}`,
               );
          }
     }
}

export const twilioService = new TwilioService();