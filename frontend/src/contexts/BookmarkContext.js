import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the bookmark context
const BookmarkContext = createContext();

// Custom hook to use the bookmark context
export const useBookmarks = () => useContext(BookmarkContext);

// Bookmark provider component
export const BookmarkProvider = ({ children }) => {
  // Initialize bookmarks from localStorage or empty array
  const [bookmarks, setBookmarks] = useState(() => {
    const savedBookmarks = localStorage.getItem('bookmarks');
    return savedBookmarks ? JSON.parse(savedBookmarks) : [];
  });

  // Toggle bookmark function
  const toggleBookmark = (questionId) => {
    setBookmarks(prevBookmarks => {
      if (prevBookmarks.includes(questionId)) {
        return prevBookmarks.filter(id => id !== questionId);
      } else {
        return [...prevBookmarks, questionId];
      }
    });
  };

  // Check if a question is bookmarked
  const isBookmarked = (questionId) => {
    return bookmarks.includes(questionId);
  };

  // Update localStorage when bookmarks change
  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Provide bookmark context to children
  return (
    <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export default BookmarkContext;