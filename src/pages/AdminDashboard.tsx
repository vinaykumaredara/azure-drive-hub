// src/pages/AdminDashboard.tsx
import React from "react";
import { requireAdminOrThrow, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Car, Users, Calendar, Settings } from "lucide-react";
import { motion } from "framer-motion";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  try {
    requireAdminOrThrow();
  } catch {
    return <div className="container mx-auto p-6">Access denied.</div>;
  }

  const handleSignOut = () => {
    signOut();
    navigate("/", { replace: true });
  };

  const adminCards = [
    {
      title: "Manage Cars",
      description: "Add, edit, and manage your car inventory",
      icon: Car,
      action: () => console.log("Navigate to car management"), // TODO: Implement
    },
    {
      title: "View Bookings",
      description: "Monitor all customer bookings and reservations",
      icon: Calendar,
      action: () => console.log("Navigate to bookings"), // TODO: Implement
    },
    {
      title: "Customer Management",
      description: "View and manage customer accounts",
      icon: Users,
      action: () => console.log("Navigate to customers"), // TODO: Implement
    },
    {
      title: "Settings",
      description: "Configure system settings and preferences",
      icon: Settings,
      action: () => console.log("Navigate to settings"), // TODO: Implement
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-gradient">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your RP CARS platform</p>
          </motion.div>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <card.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">{card.description}</p>
                  <Button onClick={card.action} size="sm" className="w-full">
                    Open
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">24</div>
                  <div className="text-sm text-muted-foreground">Total Cars</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">152</div>
                  <div className="text-sm text-muted-foreground">Active Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">89%</div>
                  <div className="text-sm text-muted-foreground">Utilization Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;