import { Car, Menu, User, Phone, Shield, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";

export const Header = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {return;} // Prevent double clicks
    
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
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
            <a href="#contact" className="text-foreground hover:text-primary transition-colors duration-200" onClick={() => {
              const text = encodeURIComponent("Hello RP cars! I'd like to know more about your car rental services.");
              const waUrl = `https://wa.me/918897072640?text=${text}`;
              window.open(waUrl, "_blank");
            }}>
              Contact
            </a>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">+91 8897072640</span>
            </div>
          </nav>

          {/* Action Buttons */}
          {user ? (
            <div className="hidden md:flex items-center space-x-3">
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="border-primary/20 hover:bg-primary/5"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-foreground hover:text-primary">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {user.email?.split('@')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
                    {isSigningOut ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4 mr-2" />
                    )}
                    {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-foreground hover:text-primary" onClick={() => navigate('/auth')}>
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button className="bg-gradient-primary text-white hover:shadow-lg transition-all duration-200" onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>
          )}

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
                  <a href="#contact" className="text-lg text-foreground hover:text-primary transition-colors" onClick={() => {
                    const text = encodeURIComponent("Hello RP cars! I'd like to know more about your car rental services.");
                    const waUrl = `https://wa.me/918897072640?text=${text}`;
                    window.open(waUrl, "_blank");
                  }}>
                    Contact
                  </a>
                </nav>

                <div className="space-y-3 pt-4 border-t">
                  {user ? (
                    <>
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/dashboard')}>
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                      {isAdmin && (
                        <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin')}>
                          <Shield className="w-4 h-4 mr-2" />
                          Admin
                        </Button>
                      )}
                      <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/auth')}>
                        <User className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                      <Button className="w-full bg-gradient-primary text-white" onClick={() => navigate('/auth')}>
                        Get Started
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-muted-foreground pt-4 border-t">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">+91 8897072640</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};