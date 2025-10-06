import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { UserCarListing } from "@/components/UserCarListing";
import { PremiumFeatures } from "@/components/PremiumFeatures";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeroSection />
        <UserCarListing />
        <PremiumFeatures />
      </main>
      <Footer />
    </div>
  );
};

export default Index;