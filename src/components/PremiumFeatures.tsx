import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Shield, Clock, MapPin, Star, Smartphone, CreditCard, Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Shield,
    title: "Premium Insurance",
    description: "Comprehensive coverage with zero-deductible options",
    color: "success"
  },
  {
    icon: Clock,
    title: "24/7 Support", 
    description: "Round-the-clock assistance for all your needs",
    color: "primary"
  },
  {
    icon: MapPin,
    title: "GPS Tracking",
    description: "Real-time vehicle tracking for peace of mind",
    color: "accent-purple"
  },
  {
    icon: Smartphone,
    title: "Smart Unlock",
    description: "Keyless entry via mobile app",
    color: "primary"
  },
  {
    icon: CreditCard,
    title: "Flexible Payment",
    description: "Multiple payment options and EMI available",
    color: "success"
  },
  {
    icon: Car,
    title: "Premium Fleet",
    description: "Well-maintained, sanitized vehicles",
    color: "accent-purple"
  }
];

const testimonials = [
  {
    name: "Rajesh Kumar",
    rating: 5,
    comment: "Excellent service! The car was spotless and the booking process was seamless.",
    location: "Hyderabad",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Priya Sharma", 
    rating: 5,
    comment: "Amazing experience. The GPS tracking feature gave me confidence during my trip.",
    location: "Secunderabad",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Amit Patel",
    rating: 5,
    comment: "Best car rental service in the city. Highly recommend for everyone!",
    location: "HITEC City",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  }
];

export const PremiumFeatures = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-accent-purple/5 to-primary/10 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="secondary" className="mb-4 bg-gradient-primary text-white">
            Premium Experience
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-foreground">Why Choose</span>{" "}
            <span className="text-gradient bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent">
              RP CARS
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Experience premium car rental with cutting-edge technology, 
            unmatched service quality, and complete peace of mind.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
          style={{ y }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }}
            >
              <Card className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="p-8 relative z-10">
                  <div className={`inline-flex p-4 rounded-2xl bg-${feature.color}/10 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-8 h-8 text-${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
        >
          {[
            { label: "Happy Customers", value: "2500+" },
            { label: "Cities Covered", value: "15+" },
            { label: "Fleet Size", value: "200+" },
            { label: "Years Experience", value: "8+" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className="text-4xl lg:text-5xl font-bold text-gradient bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent mb-2"
                whileInView={{ 
                  textShadow: "0 0 20px rgba(99, 102, 241, 0.3)" 
                }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {stat.value}
              </motion.div>
              <p className="text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h3 className="text-3xl font-bold text-center mb-12">
            What Our <span className="text-gradient">Customers Say</span>
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -5, transition: { type: "spring", stiffness: 300 } }}
              >
                <Card className="relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">
                      "{testimonial.comment}"
                    </p>
                    <div className="flex items-center space-x-3">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center bg-gradient-primary rounded-3xl p-12 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 opacity-20" />
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-4">Ready to Experience Premium?</h3>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust RP CARS for their transportation needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90 px-8 py-3 font-semibold"
              >
                Start Your Journey
              </Button>
              <Button 
                size="lg" 
                variant="ghost"
                className="text-white border-white hover:bg-white/10 px-8 py-3"
              >
                Learn More
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};