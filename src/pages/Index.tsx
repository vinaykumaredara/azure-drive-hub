import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { CarListing } from "@/components/CarListing";
import { PremiumFeatures } from "@/components/PremiumFeatures";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CarListing />
        <PremiumFeatures />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
