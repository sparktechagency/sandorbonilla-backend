import { Bookmark } from './bookmark.model'; // Import the Bookmark model

// Toggle bookmark (add or remove)
const toggleBookmark = async (payload: { userId: string; referenceId: string; }) => {
     const { userId, referenceId } = payload;

     // Find if the bookmark already exists
     const existingBookmark = await Bookmark.findOne({ userId, referenceId });

     if (existingBookmark) {
          // If it exists, delete it (i.e., unbookmark)
          await Bookmark.deleteOne({ _id: existingBookmark._id });
          return { message: 'Bookmark removed successfully' };
     } else {
          // If it doesn't exist, create a new bookmark
          const newBookmark = new Bookmark({ userId, referenceId, isBookmarked: true });
          await newBookmark.save();
          return { message: 'Bookmark added successfully' };
     }
};

// Get all bookmarks for a user (optionally filtered by reference type)
const getBookmark = async (userId: string) => {
     const query: any = { userId };
     return await Bookmark.find(query);
};

// Delete a specific bookmark
const deleteBookmark = async (userId: string, referenceId: string) => {
     const result = await Bookmark.deleteOne({ userId, referenceId });

     if (result.deletedCount === 0) {
          throw new Error('Bookmark not found');
     }

     return { message: 'Bookmark deleted successfully' };
};



export const BookmarkService = { toggleBookmark, getBookmark, deleteBookmark };
