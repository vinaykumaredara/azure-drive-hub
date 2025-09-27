import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PaymentOptionsProps {
  payMode: "full" | "hold";
  onPayModeChange: (mode: "full" | "hold") => void;
  totalAmount: number;
}

export const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  payMode,
  onPayModeChange,
  totalAmount
}) => {
  const holdAmount = Math.round(totalAmount * 0.10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={payMode} onValueChange={onPayModeChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="full" id="full" />
            <Label htmlFor="full" className="flex items-center justify-between w-full p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
              <span className="font-medium">Pay Full Amount Now</span>
              <span className="font-bold text-lg">₹{totalAmount.toLocaleString()}</span>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hold" id="hold" />
            <Label htmlFor="hold" className="flex items-center justify-between w-full p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
              <div>
                <span className="font-medium">Pay 10% Now to Hold Car</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Hold the car for 24 hours with ₹{holdAmount.toLocaleString()} advance
                </p>
              </div>
              <span className="font-bold text-lg">₹{holdAmount.toLocaleString()}</span>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};