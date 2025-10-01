import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Wrench, Plus, Edit, Trash2, AlertCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "@/hooks/useRealtime";
import { useNavigate } from "react-router-dom";

interface Maintenance {
  id: string;
  car_id: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  cars?: {
    title: string;
    make: string | null;
    model: string | null;
  } | null;
}

interface Car {
  id: string;
  title: string;
  make: string | null;
  model: string | null;
}

export const MaintenanceScheduler: React.FC = () => {
  const navigate = useNavigate();
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  
  // Form state
  const [selectedCarId, setSelectedCarId] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [notes, setNotes] = useState("");

  // Fetch data
  const fetchMaintenances = async () => {
    try {
      const { data, error } = await supabase
        .from("maintenance")
        .select(`
          *,
          cars (
            title,
            make,
            model
          )
        `)
        .order("start_date", { ascending: true });

      if (error) {throw error;}
      setMaintenances(data as Maintenance[] || []);
    } catch (error: any) {
      console.error("Error fetching maintenances:", error);
      toast({
        title: "Error",
        description: "Failed to load maintenance schedules",
        variant: "destructive",
      });
    }
  };

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from("cars")
        .select("id, title, make, model")
        .eq("status", "active")
        .order("title");

      if (error) {throw error;}
      setCars(data as Car[] || []);
    } catch (error: any) {
      console.error("Error fetching cars:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMaintenances(), fetchCars()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Real-time subscription
  useRealtimeSubscription(
    "maintenance",
    () => fetchMaintenances(),
    () => fetchMaintenances(),
    () => fetchMaintenances()
  );

  const resetForm = () => {
    setSelectedCarId("");
    setStartDate(undefined);
    setEndDate(undefined);
    setNotes("");
    setEditingMaintenance(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCarId || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: "Invalid Dates",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    try {
      const maintenanceData = {
        car_id: selectedCarId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        notes: notes.trim(),
      };

      if (editingMaintenance) {
        // Update existing maintenance
        const { error } = await (supabase
          .from("maintenance") as any)
          .update(maintenanceData)
          .eq("id", editingMaintenance.id);

        if (error) {throw error;}
        
        toast({
          title: "Maintenance Updated",
          description: "Maintenance schedule has been updated successfully",
        });
      } else {
        // Create new maintenance
        const { error } = await (supabase
          .from("maintenance") as any)
          .insert(maintenanceData);

        if (error) {throw error;}
        
        toast({
          title: "Maintenance Scheduled",
          description: "New maintenance has been scheduled successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving maintenance:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save maintenance schedule",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (maintenance: Maintenance) => {
    setEditingMaintenance(maintenance);
    setSelectedCarId(maintenance.car_id || "");
    setStartDate(new Date(maintenance.start_date));
    setEndDate(new Date(maintenance.end_date));
    setNotes(maintenance.notes || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (maintenanceId: string) => {
    if (!confirm("Are you sure you want to delete this maintenance schedule?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("maintenance")
        .delete()
        .eq("id", maintenanceId);

      if (error) {throw error;}
      
      toast({
        title: "Maintenance Deleted",
        description: "Maintenance schedule has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting maintenance:", error);
      toast({
        title: "Error",
        description: "Failed to delete maintenance schedule",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (maintenance: Maintenance) => {
    const now = new Date();
    const startDate = new Date(maintenance.start_date);
    const endDate = new Date(maintenance.end_date);

    if (now < startDate) {
      return <Badge variant="outline">Scheduled</Badge>;
    } else if (now >= startDate && now <= endDate) {
      return <Badge className="bg-warning text-warning-foreground">In Progress</Badge>;
    } else {
      return <Badge className="bg-success text-success-foreground">Completed</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate('/admin')}
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Maintenance Scheduler
            </CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingMaintenance ? "Edit Maintenance" : "Schedule Maintenance"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="car">Car *</Label>
                  <select
                    id="car"
                    value={selectedCarId}
                    onChange={(e) => setSelectedCarId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select a car</option>
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.title} - {car.make} {car.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {startDate ? format(startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {endDate ? format(endDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => date < (startDate || new Date())}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Maintenance details, parts needed, etc."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingMaintenance ? "Update" : "Schedule"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {maintenances.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Maintenance Scheduled</h3>
            <p className="text-muted-foreground mb-4">
              Schedule maintenance to keep your fleet in top condition
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {maintenances.map((maintenance) => (
              <Card key={maintenance.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">
                        {maintenance.cars?.title || "Unknown Car"}
                      </h3>
                      {getStatusBadge(maintenance)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Start:</span> {format(new Date(maintenance.start_date), "PPP")}
                      </div>
                      <div>
                        <span className="font-medium">End:</span> {format(new Date(maintenance.end_date), "PPP")}
                      </div>
                    </div>
                    
                    {maintenance.notes && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Notes:</span> {maintenance.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(maintenance)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(maintenance.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};