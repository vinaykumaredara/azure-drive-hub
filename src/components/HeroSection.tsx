import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Clock, Star } from "lucide-react";
import { motion } from "framer-motion";

export const HeroSection = () => {
  const scrollToCars = () => {
    const carsSection = document.getElementById('cars-section');
    if (carsSection) {
      carsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

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
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Trust Badges */}
            <motion.div 
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
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
            </motion.div>

            {/* Main Heading */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight break-words">
                <span className="text-foreground">Premium Car</span>
                <br />
                <span className="text-gradient">Rental Experience</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-lg leading-relaxed break-words">
                Discover our fleet of premium vehicles. Book instantly, drive safely, 
                and experience the freedom of reliable car rental in Hyderabad.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Button 
                size="lg" 
                className="bg-gradient-primary text-white hover:shadow-xl transition-all duration-200 group"
                onClick={scrollToCars}
              >
                Browse Cars
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary-light">
                How It Works
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Content - Hero Image */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
          >
            <div className="relative">
              {/* Placeholder car image */}
              <div className="w-full h-80 lg:h-96 bg-gradient-to-br from-primary/10 to-accent-purple/10 rounded-2xl shadow-hover flex items-center justify-center">
                <div className="text-center text-primary">
                  <div className="text-6xl mb-4">🚗</div>
                  <div className="text-lg font-semibold">Premium Car Fleet</div>
                  <div className="text-sm text-muted-foreground">Available for Rent</div>
                </div>
              </div>
              
              {/* Floating Card */}
              <motion.div 
                className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-hover p-4"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4, ease: "backOut" }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground whitespace-nowrap">Fully Insured</div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap">Comprehensive Coverage</div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Stats */}
              <motion.div 
                className="absolute -top-6 -right-6 bg-white rounded-xl shadow-hover p-4"
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.4, ease: "backOut" }}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary whitespace-nowrap">₹999</div>
                  <div className="text-sm text-muted-foreground whitespace-nowrap">Starting from</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};