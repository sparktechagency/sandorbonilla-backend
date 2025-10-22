import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    images: {
        type: [String],
        default: [],
    },
    rating: {
        type: Number,
        required: true,
        min: 1, // Assuming rating scale is 1-5, adjust as necessary
        max: 5,
    },
    comment: {
        type: String,
        default: '',
    },
}, { timestamps: true });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
