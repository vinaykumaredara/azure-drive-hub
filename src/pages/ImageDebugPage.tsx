// src/pages/ImageDebugPage.tsx
import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import ImageDebugComponent from '../components/ImageDebug';

export default function ImageDebugPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <ImageDebugComponent />
      </main>
      <Footer />
    </div>
  );
}