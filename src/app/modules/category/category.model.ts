import { model, Schema } from 'mongoose';
import { ICategory, CategoryModel } from './category.interface';

const serviceSchema = new Schema<ICategory, CategoryModel>(
     {
          name: {
               type: String,
               required: true,
               unique: true,
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
serviceSchema.pre('find', function (next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

serviceSchema.pre('findOne', function (next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

serviceSchema.pre('aggregate', function (next) {
     this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
     next();
});
export const Category = model<ICategory, CategoryModel>('Category', serviceSchema);
