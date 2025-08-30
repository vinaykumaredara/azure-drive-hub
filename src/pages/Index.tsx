import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { CarListing } from "@/components/CarListing";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CarListing />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
