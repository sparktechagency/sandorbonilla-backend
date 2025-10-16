import { Types } from 'mongoose';

export interface IBookmark extends Document {
     userId: Types.ObjectId;
     referenceId: Types.ObjectId;
     isBookmarked: boolean;
}
