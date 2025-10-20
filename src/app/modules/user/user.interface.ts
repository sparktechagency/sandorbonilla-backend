import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';
export type IUser = {
     firstName: string;
     lastName: string;
     gender: string;
     role: USER_ROLES;
     shopName: string;
     registrationNo: string;
     email: string;
     phone: string;
     address: string;
     addressCategory: string;
     date: Date;
     password?: string;
     image?: string;
     isDeleted: boolean;
     stripeCustomerId: string;
     status: 'active' | 'blocked';
     isVerified: boolean;
     googleId?: string;
     facebookId?: string;
     oauthProvider?: 'google' | 'facebook';
     authentication?: {
          isResetPassword: boolean;
          oneTimeCode: number;
          expireAt: Date;
     };
     // ✅ Online Status Interface
     onlineStatus?: {
          isOnline?: boolean;
          lastSeen?: Date;
          lastHeartbeat?: Date;
     };
};

export type UserModel = {
     isExistUserById(id: string): any;
     isExistUserByEmail(email: string): any;
     isExistUserByPhone(contact: string): any;
     isMatchPassword(password: string, hashPassword: string): boolean;
     // ✅ Online Status Methods
      setUserOnline(userId: string): Promise<void>;
      setUserOffline(userId: string): Promise<void>;
      updateHeartbeat(userId: string): Promise<void>;
      getOnlineUsers(): Promise<IUser[]>;
      bulkUserStatus(userIds: string[]): Promise<IUser[]>;
} & Model<IUser>;
