import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import config from '../../../config';
import bcrypt from 'bcrypt';
import { USER_ROLES } from '../../../enums/user';
import QueryBuilder from '../../builder/QueryBuilder';
import { generateRegistrationNumber } from '../../../utils/generateUniqueNumber';



const hashPassword = async (password: string) => {
     const salt = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));
     return await bcrypt.hash(password, salt);
};
const createAdminToDB = async (payload: Partial<IUser>): Promise<IUser> => {
     const hashedPassword = await hashPassword(payload.password as string);
     const registrationNo = await generateRegistrationNumber("REG#");
     const createAdmin: any = await User.create({
          ...payload,
          password: hashedPassword,
          registrationNo: registrationNo.toUpperCase(),
     });
     if (!createAdmin) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Admin');
     }
     if (createAdmin) {
          await User.findByIdAndUpdate({ _id: createAdmin?._id }, { verified: true }, { new: true });
     }
     return createAdmin;
};
const deleteAdminFromDB = async (id: any): Promise<IUser | undefined> => {
     const isExistAdmin = await User.findByIdAndDelete(id);
     if (!isExistAdmin) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to delete Admin');
     }
     return;
};
const getAdminFromDB = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(User.find({ role: USER_ROLES.ADMIN }).select('firstName lastName email image phone role'), query);
     const result = await queryBuilder.fields().filter().paginate().sort().search(['firstName', 'lastName', 'email', 'phone']).modelQuery.exec();
     const meta = await queryBuilder.countTotal()
     return {
          meta,
          result,
     }
};

export const AdminService = {
     createAdminToDB,
     deleteAdminFromDB,
     getAdminFromDB,
};
