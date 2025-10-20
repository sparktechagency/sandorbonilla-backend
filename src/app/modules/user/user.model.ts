import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES } from '../../../enums/user';
import AppError from '../../../errors/AppError';
import { IUser, UserModel } from './user.interface';
import generateOrderNumber from '../../../utils/generateOrderNumber';

const userSchema = new Schema<IUser, UserModel>(
     {
          firstName: {
               type: String,
               required: false,
          },
          lastName: {
               type: String,
               required: false,
          },
          registrationNo: {
               type: String,
               required: false,
               unique: true,
               default: generateOrderNumber("REG#"),
          },
          role: {
               type: String,
               enum: Object.values(USER_ROLES),
               default: USER_ROLES.USER,
          },
          email: {
               type: String,
               required: false,
               sparse: true,
               unique: true,
               lowercase: true,
          },
          phone: {
               type: String,
               required: false,
               sparse: true,
               unique: true,
          },
          password: {
               type: String,
               required: function () {
                    // Password is only required for non-OAuth users
                    return this.role === USER_ROLES.ADMIN && USER_ROLES.SUPER_ADMIN && !this.oauthProvider;
               },
               select: false,
               minlength: 8,
          },
          image: {
               type: String,
               default: '',
          },
          gender: {
               type: String,
               default: 'N/A',
          },
          date: {
               type: Date,
               default: Date.now,
          },
          address: {
               type: String,
               default: 'N/A',
          },
          addressCategory: {
               type: String,
               default: 'N/A',
          },
          shopName: {
               type: String,
               required: false,
               default: '',
          },
          status: {
               type: String,
               enum: ['active', 'blocked'],
               default: 'active',
          },
          isVerified: {
               type: Boolean,
               default: false,
          },
          isDeleted: {
               type: Boolean,
               default: false,
          },
          stripeCustomerId: {
               type: String,
               default: '',
          },
          // OAuth fields
          googleId: {
               type: String,
               sparse: true,
          },
          facebookId: {
               type: String,
               sparse: true,
          },
          oauthProvider: {
               type: String,
               enum: ['google', 'facebook'],
          },
          authentication: {
               type: {
                    isResetPassword: {
                         type: Boolean,
                         default: false,
                    },
                    oneTimeCode: {
                         type: Number,
                         default: null,
                    },
                    expireAt: {
                         type: Date,
                         default: null,
                    },
               },
               select: false,
          },
          onlineStatus: {
               isOnline: {
                    type: Boolean,
                    default: false,
               },
               lastSeen: {
                    type: Date,
                    default: Date.now,
               },
               lastHeartbeat: {
                    type: Date,
                    default: Date.now,
               },
          },
     },
     { timestamps: true },
);

// Exist User Check
userSchema.statics.isExistUserById = async (id: string) => {
     return await User.findById(id);
};

// db.users.updateOne({email:"tihow91361@linxues.com"},{email:"rakibhassan305@gmail.com"})

userSchema.statics.isExistUserByEmail = async (email: string) => {
     return await User.findOne({ email });
};
userSchema.statics.isExistUserByPhone = async (contact: string) => {
     return await User.findOne({ contact });
};
// Password Matching
userSchema.statics.isMatchPassword = async (password: string, hashPassword: string): Promise<boolean> => {
     return await bcrypt.compare(password, hashPassword);
};

// Pre-Save Hook for Hashing Password & Checking Email Uniqueness
userSchema.pre('save', async function (next) {
     if (this.email && (this.isNew || this.isModified('email'))) {
          const existingUser = await User.findOne({
               email: this.email,
               _id: { $ne: this._id }
          });
          if (existingUser) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Email already exists!');
          }
     }
     if (this.phone && (this.isNew || this.isModified('phone'))) {
          const existingUser = await User.findOne({
               phone: this.phone,
               _id: { $ne: this._id }
          });
          if (existingUser) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Phone number already exists!');
          }
     }
     // Only hash password if it's provided and modified
     if (this.password && this.isModified('password')) {
          this.password = await bcrypt.hash(this.password, Number(config.bcrypt_salt_rounds));
     }

     // Auto-verify OAuth users
     if (this.oauthProvider && !this.isVerified) {
          this.isVerified = true;
     }

     next();
});
// ✅ Online Status Methods
userSchema.statics.setUserOnline = async (userId: string) => {
     await User.findByIdAndUpdate(userId, {
          'onlineStatus.isOnline': true,
          'onlineStatus.lastSeen': new Date(),
          'onlineStatus.lastHeartbeat': new Date(),
     });
};

userSchema.statics.setUserOffline = async (userId: string) => {
     await User.findByIdAndUpdate(userId, {
          'onlineStatus.isOnline': false,
          'onlineStatus.lastSeen': new Date(),
     });
};

userSchema.statics.updateHeartbeat = async (userId: string) => {
     await User.findByIdAndUpdate(userId, {
          'onlineStatus.lastHeartbeat': new Date(),
          'onlineStatus.lastSeen': new Date(),
     });
};

userSchema.statics.getOnlineUsers = async () => {
     return await User.find({ 'onlineStatus.isOnline': true }).select('name userName profile onlineStatus');
};

userSchema.statics.bulkUserStatus = async (userIds: string[]) => {
     return await User.find({ _id: { $in: userIds } }).select('name userName profile onlineStatus');
};
// Query Middleware
userSchema.pre('find', function (next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

userSchema.pre('findOne', function (next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

userSchema.pre('aggregate', function (next) {
     this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
     next();
});
userSchema.index({ "onlineStatus.isOnline": 1 });
userSchema.index({ "onlineStatus.lastHeartbeat": 1 });
export const User = model<IUser, UserModel>('User', userSchema);
