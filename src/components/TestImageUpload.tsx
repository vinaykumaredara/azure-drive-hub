// src/components/TestImageUpload.tsx
import React, { useState } from 'react';
import AdminImage from './AdminImage';
import ImageCarousel from './ImageCarousel';

const TestImageUpload: React.FC = () => {
  const [testImages, setTestImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1549399542-7e7f0c3c4b6c?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&h=600&fit=crop&crop=center&auto=format&q=80'
  ]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Image Component Tests</h2>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">AdminImage Component</h3>
        <div className="flex gap-4">
          <AdminImage 
            src={testImages[0]} 
            alt="Test image 1" 
            className="w-48 h-48 object-cover rounded" 
          />
          <AdminImage 
            src="invalid-url" 
            alt="Invalid image" 
            className="w-48 h-48 object-cover rounded" 
          />
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">ImageCarousel Component</h3>
        <div className="w-full max-w-2xl">
          <ImageCarousel images={testImages} className="h-64" />
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Empty State</h3>
        <div className="w-full max-w-2xl">
          <ImageCarousel images={[]} className="h-64" />
        </div>
      </div>
    </div>
  );
};

export default TestImageUpload;