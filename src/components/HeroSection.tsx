import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Clock, Star } from "lucide-react";
import heroImage from "@/assets/hero-car.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center bg-gradient-to-br from-primary-light via-white to-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231E6FFF' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="flex items-center space-x-1 bg-white shadow-sm">
                <Shield className="w-3 h-3 text-primary" />
                <span>Trusted Platform</span>
              </Badge>
              <Badge variant="secondary" className="flex items-center space-x-1 bg-white shadow-sm">
                <Clock className="w-3 h-3 text-primary" />
                <span>24/7 Support</span>
              </Badge>
              <Badge variant="secondary" className="flex items-center space-x-1 bg-white shadow-sm">
                <Star className="w-3 h-3 text-primary" />
                <span>4.9 Rating</span>
              </Badge>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-foreground">Premium Car</span>
                <br />
                <span className="text-gradient">Rental Experience</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-lg">
                Discover our fleet of premium vehicles. Book instantly, drive safely, 
                and experience the freedom of reliable car rental in Hyderabad.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 py-6 border-y border-border/50">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Cars Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Locations</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gradient-primary text-white hover:shadow-xl transition-all duration-200 group">
                Browse Cars
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary-light">
                How It Works
              </Button>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative animate-slide-up">
            <div className="relative">
              <img 
                src={heroImage}
                alt="Premium car rental"
                className="w-full h-auto rounded-2xl shadow-hover object-cover"
              />
              
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-hover p-4 animate-bounce-in">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Fully Insured</div>
                    <div className="text-sm text-muted-foreground">Comprehensive Coverage</div>
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-hover p-4 animate-scale-in">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">₹999</div>
                  <div className="text-sm text-muted-foreground">Starting from</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};