import { Suspense } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { CarListing } from "@/components/CarListing";
import { PremiumFeatures } from "@/components/PremiumFeatures";
import { Footer } from "@/components/Footer";

const Index = () => {
  console.log('Index page rendering...');
  
  try {
    return (
      <div className="min-h-screen bg-background">
        <Suspense fallback={<div style={{padding: '1rem', textAlign: 'center'}}>Loading header...</div>}>
          <Header />
        </Suspense>
        <main>
          <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>Loading hero section...</div>}>
            <HeroSection />
          </Suspense>
          <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>Loading car listings...</div>}>
            <CarListing />
          </Suspense>
          <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>Loading premium features...</div>}>
            <PremiumFeatures />
          </Suspense>
        </main>
        <Suspense fallback={<div style={{padding: '1rem', textAlign: 'center'}}>Loading footer...</div>}>
          <Footer />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error in Index component:', error);
    return (
      <div style={{padding: '2rem', textAlign: 'center'}}>
        <h1>RP CARS - Premium Car Rental</h1>
        <p>We're working on loading the full experience. Please refresh the page.</p>
        <button onClick={() => window.location.reload()} style={{
          padding: '0.75rem 1.5rem',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          marginTop: '1rem'
        }}>
          Refresh Page
        </button>
      </div>
    );
  }
};

export default Index;
