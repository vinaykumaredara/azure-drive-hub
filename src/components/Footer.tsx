import { Car, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">RP CARS</span>
            </div>
            <p className="text-gray-300">
              Your trusted partner for premium car rental experiences in Hyderabad. 
              Drive with confidence, book with ease.
            </p>
            <div className="flex space-x-3">
              <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 p-2">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 p-2">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 p-2">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 p-2">
                <Linkedin className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#cars" className="hover:text-white transition-colors">Browse Cars</a></li>
              <li><a href="#booking" className="hover:text-white transition-colors">Book Now</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#locations" className="hover:text-white transition-colors">Locations</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#self-drive" className="hover:text-white transition-colors">Self Drive</a></li>
              <li><a href="#chauffeur" className="hover:text-white transition-colors">Chauffeur Service</a></li>
              <li><a href="#corporate" className="hover:text-white transition-colors">Corporate Rentals</a></li>
              <li><a href="#wedding" className="hover:text-white transition-colors">Wedding Cars</a></li>
              <li><a href="#airport" className="hover:text-white transition-colors">Airport Transfer</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+91 99999 00000</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>info@rpcars.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-1" />
                <span>HITEC City, Hyderabad<br />Telangana, India</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-300 text-sm">
              © 2024 RP CARS. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-300">
              <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#cookies" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};