import mongoose, { Schema } from "mongoose";
import { IProduct } from "./products.interface";

const productSchema = new Schema<IProduct>({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
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
        validate: {
            validator: function (v: string[]) {
                return v.length > 0;
            },
            message: 'At least one image is required'
        }
    },
    name: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    model: {
        type: String,
        required: true,
        trim: true,
    },
    brand: {
        type: String,
        required: true,
        trim: true,
    },
    color: {
        type: [String],
        required: true,
        validate: {
            validator: function (v: string[]) {
                return v.length > 0;
            },
            message: 'At least one color is required'
        }
    },
    sizeType: [{
        size: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        purchasePrice: {
            type: Number,
            required: true,
            min: 0,
        },
        profit: {
            type: Number,
            default: 0,
        },
    }],
    specialCategory: {
        type: String,
        default: '',
    },
    overview: {
        type: String,
        default: '',
        trim: true,
    },
    highlights: {
        type: String,
        default: '',
        trim: true,
    },
    techSpecs: {
        type: String,
        default: '',
        trim: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'out-of-stock'],
        default: 'active',
    },
    totalStock: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
    views: {
        type: Number,
        default: 0,
        min: 0,
    }
}, {
    timestamps: true,
});

// Compound index for better query performance
productSchema.index({ sellerId: 1, isDeleted: 1 });
productSchema.index({ categoryId: 1, isDeleted: 1 });
productSchema.index({ name: 'text', brand: 'text' }); // Text search

// Pre-save middleware to calculate total stock
productSchema.pre('save', function (next) {
    if (this.sizeType && this.sizeType.length > 0) {
        this.totalStock = this.sizeType.reduce((sum, item) => sum + item.quantity, 0);

        // Calculate profit if not set
        this.sizeType.forEach(item => {
            if (item.profit === 0 || item.profit === undefined) {
                const discountedPrice = item.price - (item.price * item.discount / 100);
                item.profit = discountedPrice - item.purchasePrice;
            }
        });

        // Update status based on stock
        this.status = this.totalStock > 0 ? 'active' : 'out-of-stock';
    }
    next();
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

// Instance methods
productSchema.methods.decreaseStock = async function (size: string, quantity: number) {
    const sizeItem = this.sizeType.find((item: any) => item.size === size);
    if (!sizeItem) {
        throw new Error('Size not found');
    }
    if (sizeItem.quantity < quantity) {
        throw new Error('Insufficient stock');
    }
    sizeItem.quantity -= quantity;
    this.totalStock -= quantity;
    if (this.totalStock === 0) {
        this.status = 'out-of-stock';
    }
    await this.save();
};

productSchema.methods.increaseStock = async function (size: string, quantity: number) {
    const sizeItem = this.sizeType.find((item: any) => item.size === size);
    if (!sizeItem) {
        throw new Error('Size not found');
    }
    sizeItem.quantity += quantity;
    this.totalStock += quantity;
    if (this.status === 'out-of-stock') {
        this.status = 'active';
    }
    await this.save();
};

export const ProductModel = mongoose.model<IProduct>('Product', productSchema);