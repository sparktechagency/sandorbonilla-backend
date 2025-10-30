import { Schema, model } from 'mongoose';
import { IBookmark } from './bookmark.interface';

const bookmarkSchema = new Schema<IBookmark>(
     {
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          referenceId: {
               type: Schema.Types.ObjectId,
               ref: 'Product',
               required: true,
          },
          isBookmarked: {
               type: Boolean,
               default: true,
          },
     },
     { timestamps: true },
);

export const Bookmark = model<IBookmark>('Bookmark', bookmarkSchema);