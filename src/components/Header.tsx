import { Car, Menu, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-primary rounded-xl">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">RP CARS</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#cars" className="text-foreground hover:text-primary transition-colors duration-200">
              Browse Cars
            </a>
            <a href="#about" className="text-foreground hover:text-primary transition-colors duration-200">
              About
            </a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors duration-200">
              Contact
            </a>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">+91 99999 00000</span>
            </div>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-primary" onClick={() => navigate('/login')}>
              <User className="w-4 h-4 mr-2" />
              Login
            </Button>
            <Button className="bg-gradient-primary text-white hover:shadow-lg transition-all duration-200">
              Rent Now
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-6 mt-6">
                <div className="flex items-center space-x-2 pb-4 border-b">
                  <div className="p-2 bg-gradient-primary rounded-xl">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gradient">RP CARS</span>
                </div>
                
                <nav className="flex flex-col space-y-4">
                  <a href="#cars" className="text-lg text-foreground hover:text-primary transition-colors">
                    Browse Cars
                  </a>
                  <a href="#about" className="text-lg text-foreground hover:text-primary transition-colors">
                    About
                  </a>
                  <a href="#contact" className="text-lg text-foreground hover:text-primary transition-colors">
                    Contact
                  </a>
                </nav>

                <div className="space-y-3 pt-4 border-t">
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/login')}>
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button className="w-full bg-gradient-primary text-white">
                    Rent Now
                  </Button>
                </div>

                <div className="flex items-center space-x-2 text-muted-foreground pt-4 border-t">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">+91 99999 00000</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};