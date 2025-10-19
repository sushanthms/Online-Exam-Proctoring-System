import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Find matching shortcut
      const shortcut = shortcuts.find(s => {
        const modifiersMatch = 
          (s.ctrl === undefined || s.ctrl === event.ctrlKey) &&
          (s.alt === undefined || s.alt === event.altKey) &&
          (s.shift === undefined || s.shift === event.shiftKey);
        
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
        
        return modifiersMatch && keyMatch;
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
};