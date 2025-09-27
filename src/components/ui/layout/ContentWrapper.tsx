// src/components/ui/layout/ContentWrapper.tsx
import React from 'react';

interface ContentWrapperProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const ContentWrapper = ({ 
  children, 
  className = '', 
  padding = 'md' 
}: ContentWrapperProps) => {
  const getPaddingClass = () => {
    switch (padding) {
      case 'none': return '';
      case 'sm': return 'p-4';
      case 'md': return 'p-6';
      case 'lg': return 'p-8';
      default: return 'p-6';
    }
  };

  return (
    <div className={`container mx-auto ${getPaddingClass()} ${className}`}>
      {children}
    </div>
  );
};

export default ContentWrapper;