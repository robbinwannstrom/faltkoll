import React from 'react';

export interface FloatingAiBubbleProps {
  onOpenAi?: () => void;
  activeMomentTitle?: string;
  isOpen?: boolean;
}

export const FloatingAiBubble: React.FC<FloatingAiBubbleProps> = () => {
  // Disabled to keep interface clean, solid, and professional without floating AI widgets
  return null;
};
