import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Car, Heart, Phone } from 'lucide-react';

export const EmptyCarState = () => {
  const handleWhatsAppContact = () => {
    const text = encodeURIComponent("Hello Azure Drive Hub! I'm looking for a car. When will new cars be available?");
    const waUrl = `https://wa.me/918897072640?text=${text}`;
    window.open(waUrl, "_blank");
  };

  const handleCallUs = () => {
    window.location.href = "tel:+918897072640";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex justify-center items-center min-h-[400px]"
    >
      <Card className="max-w-md w-full mx-4 bg-gradient-to-br from-primary-light/20 to-white shadow-xl border-0">
        <CardContent className="p-8 text-center">
          {/* Animated Car Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6"
          >
            <div className="relative">
              <motion.div
                animate={{ 
                  x: [0, 10, 0],
                  rotate: [0, 2, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-block"
              >
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                  <Car className="w-10 h-10 text-white" />
                </div>
              </motion.div>
              
              {/* Floating hearts */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.5
                }}
                className="absolute -top-2 -right-2"
              >
                <Heart className="w-6 h-6 text-red-400 fill-red-400" />
              </motion.div>
            </div>
          </motion.div>

          {/* Main Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-bold text-foreground">
              🚗 Our Cars Are Busy!
            </h3>
            
            <div className="flex items-center justify-center space-x-2 text-primary">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Currently serving other customers</span>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              All our amazing cars are currently out making other customers happy! 
              <br />
              <span className="font-medium text-primary">New cars will be available soon.</span>
            </p>

            <div className="bg-primary-light/50 rounded-lg p-4 mt-6">
              <p className="text-sm text-primary font-medium">
                💡 Tip: Contact us to get notified when cars become available!
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-3 mt-8"
          >
            <Button
              onClick={handleWhatsAppContact}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.588z"/>
              </svg>
              WhatsApp Us
            </Button>
            
            <Button
              onClick={handleCallUs}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call +91 8897072640
            </Button>
          </motion.div>

          {/* Reassuring Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-6 p-3 bg-muted/50 rounded-lg"
          >
            <p className="text-xs text-muted-foreground">
              ⚡ We typically have cars available within 2-4 hours. 
              <br />
              Thank you for choosing RP CARS!
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};