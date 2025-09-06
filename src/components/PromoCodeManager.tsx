import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Tag, Plus, Edit, Trash2, Copy, AlertCircle, Percent, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "@/hooks/useRealtime";

interface PromoCode {
  id: string;
  code: string;
  discount_percent?: number;
  discount_flat?: number;
  valid_from?: string;
  valid_to?: string;
  active: boolean;
  usage_limit?: number;
  created_at: string;
}

export const PromoCodeManager: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [validFrom, setValidFrom] = useState<Date>();
  const [validTo, setValidTo] = useState<Date>();
  const [usageLimit, setUsageLimit] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Fetch promo codes
  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast({
        title: "Error",
        description: "Failed to load promo codes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  // Real-time subscription
  useRealtimeSubscription(
    "promo_codes",
    () => fetchPromoCodes(),
    () => fetchPromoCodes(),
    () => fetchPromoCodes()
  );

  const resetForm = () => {
    setCode("");
    setDiscountType("percent");
    setDiscountValue("");
    setValidFrom(undefined);
    setValidTo(undefined);
    setUsageLimit("");
    setIsActive(true);
    setEditingPromo(null);
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !discountValue) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (validTo && validFrom && validTo < validFrom) {
      toast({
        title: "Invalid Dates",
        description: "Valid to date must be after valid from date",
        variant: "destructive",
      });
      return;
    }

    try {
      const promoData = {
        code: code.trim().toUpperCase(),
        discount_percent: discountType === "percent" ? parseInt(discountValue) : null,
        discount_flat: discountType === "flat" ? parseFloat(discountValue) : null,
        valid_from: validFrom?.toISOString().split('T')[0] || null,
        valid_to: validTo?.toISOString().split('T')[0] || null,
        usage_limit: usageLimit ? parseInt(usageLimit) : 0,
        active: isActive,
      };

      if (editingPromo) {
        // Update existing promo code
        const { error } = await supabase
          .from("promo_codes")
          .update(promoData)
          .eq("id", editingPromo.id);

        if (error) throw error;

        toast({
          title: "Promo Code Updated",
          description: "Promo code has been updated successfully",
        });
      } else {
        // Create new promo code
        const { error } = await supabase
          .from("promo_codes")
          .insert(promoData);

        if (error) throw error;

        toast({
          title: "Promo Code Created",
          description: "New promo code has been created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving promo code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save promo code",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setCode(promo.code);
    setDiscountType(promo.discount_percent ? "percent" : "flat");
    setDiscountValue(String(promo.discount_percent || promo.discount_flat || ""));
    setValidFrom(promo.valid_from ? new Date(promo.valid_from) : undefined);
    setValidTo(promo.valid_to ? new Date(promo.valid_to) : undefined);
    setUsageLimit(String(promo.usage_limit || ""));
    setIsActive(promo.active);
    setIsDialogOpen(true);
  };

  const handleDelete = async (promoId: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", promoId);

      if (error) throw error;

      toast({
        title: "Promo Code Deleted",
        description: "Promo code has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting promo code:", error);
      toast({
        title: "Error",
        description: "Failed to delete promo code",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (promo: PromoCode) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ active: !promo.active })
        .eq("id", promo.id);

      if (error) throw error;

      toast({
        title: promo.active ? "Promo Code Deactivated" : "Promo Code Activated",
        description: `Promo code ${promo.code} has been ${promo.active ? "deactivated" : "activated"}`,
      });
    } catch (error) {
      console.error("Error toggling promo code:", error);
      toast({
        title: "Error",
        description: "Failed to update promo code status",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `Code "${text}" copied to clipboard`,
    });
  };

  const getStatusBadge = (promo: PromoCode) => {
    if (!promo.active) {
      return <Badge variant="destructive">Inactive</Badge>;
    }

    const now = new Date();
    const validFrom = promo.valid_from ? new Date(promo.valid_from) : null;
    const validTo = promo.valid_to ? new Date(promo.valid_to) : null;

    if (validFrom && now < validFrom) {
      return <Badge variant="outline">Scheduled</Badge>;
    } else if (validTo && now > validTo) {
      return <Badge variant="secondary">Expired</Badge>;
    } else {
      return <Badge className="bg-success text-success-foreground">Active</Badge>;
    }
  };

  const getDiscountText = (promo: PromoCode) => {
    if (promo.discount_percent) {
      return `${promo.discount_percent}% off`;
    } else if (promo.discount_flat) {
      return `₹${promo.discount_flat} off`;
    }
    return "No discount";
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
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Promo Code Manager
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Create Promo Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPromo ? "Edit Promo Code" : "Create Promo Code"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="PROMO2024"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateRandomCode}
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Discount Type *</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="percent"
                        checked={discountType === "percent"}
                        onChange={(e) => setDiscountType(e.target.value as "percent")}
                      />
                      <Percent className="w-4 h-4" />
                      Percentage
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="flat"
                        checked={discountType === "flat"}
                        onChange={(e) => setDiscountType(e.target.value as "flat")}
                      />
                      <IndianRupee className="w-4 h-4" />
                      Fixed Amount
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">
                    Discount Value * {discountType === "percent" ? "(%)" : "(₹)"}
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percent" ? "10" : "100"}
                    min="1"
                    max={discountType === "percent" ? "100" : undefined}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valid From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {validFrom ? format(validFrom, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={validFrom}
                          onSelect={setValidFrom}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Valid To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {validTo ? format(validTo, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={validTo}
                          onSelect={setValidTo}
                          disabled={(date) => validFrom ? date < validFrom : false}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage">Usage Limit</Label>
                  <Input
                    id="usage"
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="0 = unlimited"
                    min="0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingPromo ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {promoCodes.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Promo Codes</h3>
            <p className="text-muted-foreground mb-4">
              Create promotional codes to offer discounts to your customers
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {promoCodes.map((promo) => (
              <Card key={promo.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-mono font-bold text-lg">{promo.code}</h3>
                      {getStatusBadge(promo)}
                      <Badge variant="outline">{getDiscountText(promo)}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Valid:</span>{" "}
                        {promo.valid_from && promo.valid_to
                          ? `${format(new Date(promo.valid_from), "MMM dd")} - ${format(new Date(promo.valid_to), "MMM dd, yyyy")}`
                          : "No expiry"}
                      </div>
                      <div>
                        <span className="font-medium">Usage:</span>{" "}
                        {promo.usage_limit ? `Limited to ${promo.usage_limit}` : "Unlimited"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(promo.code)}
                      title="Copy code"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={promo.active ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleActive(promo)}
                    >
                      {promo.active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(promo)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(promo.id)}
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