// frontend/src/contexts/BookmarkContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const BookmarkContext = createContext();

export const useBookmarks = () => useContext(BookmarkContext);

export const BookmarkProvider = ({ children }) => {
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState({});

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('bookmarkedQuestions');
    if (savedBookmarks) {
      try {
        setBookmarkedQuestions(JSON.parse(savedBookmarks));
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      }
    }
  }, []);

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bookmarkedQuestions', JSON.stringify(bookmarkedQuestions));
  }, [bookmarkedQuestions]);

  // Toggle bookmark for a question in a specific exam
  const toggleBookmark = (examId, questionIndex) => {
    setBookmarkedQuestions(prev => {
      const examBookmarks = prev[examId] || [];
      const isBookmarked = examBookmarks.includes(questionIndex);
      
      const updatedExamBookmarks = isBookmarked
        ? examBookmarks.filter(idx => idx !== questionIndex)
        : [...examBookmarks, questionIndex];
      
      return {
        ...prev,
        [examId]: updatedExamBookmarks
      };
    });
  };

  // Check if a question is bookmarked
  const isBookmarked = (examId, questionIndex) => {
    return (bookmarkedQuestions[examId] || []).includes(questionIndex);
  };

  // Get all bookmarked questions for an exam
  const getExamBookmarks = (examId) => {
    return bookmarkedQuestions[examId] || [];
  };

  // Clear all bookmarks for an exam
  const clearExamBookmarks = (examId) => {
    setBookmarkedQuestions(prev => {
      const newBookmarks = { ...prev };
      delete newBookmarks[examId];
      return newBookmarks;
    });
  };

  return (
    <BookmarkContext.Provider value={{
      isBookmarked,
      toggleBookmark,
      getExamBookmarks,
      clearExamBookmarks
    }}>
      {children}
    </BookmarkContext.Provider>
  );
};