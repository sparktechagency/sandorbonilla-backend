import { model, Schema } from 'mongoose';
import { IBrand, BrandModel } from './brand.interface';

const brandSchema = new Schema<IBrand, BrandModel>(
     {
          name: {
               type: String,
               required: true,
               unique: true,
          },
          subCategoryId: {
               type: Schema.Types.ObjectId,
               ref: 'SubCategory',
               required: true,
          },
     },
     { timestamps: true },
);

export const Brand = model<IBrand, BrandModel>('Brand', brandSchema);
