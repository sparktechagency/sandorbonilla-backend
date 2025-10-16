import { model, Schema } from 'mongoose';
import { ISubCategory, SubCategoryModel } from './subCategory.interface';

const subCategorySchema = new Schema<ISubCategory, SubCategoryModel>(
     {
          name: {
               type: String,
               required: true,
               unique: true,
          },
          categoryId: {
               type: Schema.Types.ObjectId,
               ref: 'Category',
               required: true,
          },
          thumbnail: {
               type: String,
               required: true,
          },
          isDeleted: {
               type: Boolean,
               default: false,
          },
     },
     { timestamps: true },
);
// Query Middleware
subCategorySchema.pre('find', function (next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

subCategorySchema.pre('findOne', function (next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

subCategorySchema.pre('aggregate', function (next) {
     this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
     next();
});
export const SubCategory = model<ISubCategory, SubCategoryModel>('SubCategory', subCategorySchema);
