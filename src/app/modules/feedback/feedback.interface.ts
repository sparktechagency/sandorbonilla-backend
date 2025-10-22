import { Types } from 'mongoose';
export interface IFeedback {
    userId: Types.ObjectId;
    productId: Types.ObjectId;
    images: string[];
    rating: number; 
    comment: string;
}

export default IFeedback;
