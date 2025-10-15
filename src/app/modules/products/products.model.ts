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
    productImage: {
        type: [String], // Assuming an array of image URLs
        required: true,
    },
    productName: {
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
    sizeType: [{
        size: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        }
    }],
    purchasePrice: {
        type: Number,
        required: true,
    },
    profitPrice: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    specialCategory: {
        type: String, // e.g. Male, Female, etc.
        enum: ['Male', 'Female', 'Unisex'],
        required: true,
    },
    details: {
        type: String,
        default: '',
    }
}, {
    timestamps: true, // Automatically add createdAt and updatedAt fields
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
