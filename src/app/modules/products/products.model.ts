import mongoose, { Schema, Types } from "mongoose";
import { IProduct } from "./products.interface";

const productSchema = new Schema<IProduct>({
    category: {
        type: String,
        required: true,
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    subCategory: {
        type: String,
        required: true,
    },
    subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true,
    },
    images: {
        type: [String],
        default: [],
    },
    name: {
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    color: {
        type: [String], // Array to handle multiple colors (Black, White, etc.)
        required: true,
    },
    sizeType: {
        type: [{
            size: {
                type: String,
                required: false,
            },
            price: {
                type: Number,
                required: false,
            },
            quantity: {
                type: Number,
                required: false,
            }
        }],
        default: undefined,  // Ensures that it's only there when relevant
    },
    price: {
        type: Number,
        required: true,
    },
    profit: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    specialCategory: {
        type: String,
        enum: ['Male', 'Female', 'Unisex'],
        required: true,
    },
    details: {
        type: String,
        default: '',
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Query Middleware to filter deleted products
productSchema.pre('find', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

productSchema.pre('findOne', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

productSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
    next();
});

export const ProductModel = mongoose.model<IProduct>('Product', productSchema);
