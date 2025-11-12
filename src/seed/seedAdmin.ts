import mongoose from 'mongoose';
import { User } from '../app/modules/user/user.model';
import config from '../config';
import { USER_ROLES } from '../enums/user';
import { logger } from '../shared/logger';
import colors from 'colors';
import bcrypt from 'bcrypt';

const usersData = [
     {
          firstName: 'Administrator',
          lastName: 'Admin',
          email: config.super_admin.email,
          phone: config.super_admin.phone,
          registrationNo: 'REG#SUPER_ADMIN',
          role: USER_ROLES.SUPER_ADMIN,
          password: config.super_admin.password,
          isVerified: true,
     },
     {
          firstName: 'User',
          lastName: 'User',
          email: 'user@gmail.com',
          role: USER_ROLES.USER,
          registrationNo: 'REG#USER',
          password: 'hello123',
          isVerified: true,
     },
];

// Function to hash passwords
export const hashPassword = async (password: string) => {
     const salt = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));
     return await bcrypt.hash(password, salt);
};

// Function to seed users
const seedUsers = async () => {
     try {
          await User.deleteMany();

          const hashedUsersData = await Promise.all(
               usersData.map(async (user: any) => {
                    const hashedPassword = await hashPassword(user.password);
                    return { ...user, password: hashedPassword };
               }),
          );

          // Insert users into the database
          await User.insertMany(hashedUsersData);
          logger.info(colors.green('✨ --------------> Users seeded successfully <-------------- ✨'));
     } catch (err) {
          logger.error(colors.red('💥 Error seeding users: 💥'), err);
     }
};

// Connect to MongoDB
mongoose.connect(config.database_url as string);

const seedSuperAdmin = async () => {
     try {
          logger.info(colors.cyan('🎨 --------------> Database seeding start <--------------- 🎨'));

          // Start seeding users
          await seedUsers();
          logger.info(colors.green('🎉 --------------> Database seeding completed <--------------- 🎉'));
     } catch (error) {
          logger.error(colors.red('🔥 Error creating Super Admin: 🔥'), error);
     } finally {
          mongoose.disconnect();
     }
};

seedSuperAdmin();
