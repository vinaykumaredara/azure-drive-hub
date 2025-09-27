
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Info } from "lucide-react";

interface HoldNoticeProps {
  holdExpiry: Date;
  totalAmount: number;
}

export const HoldNotice: React.FC<HoldNoticeProps> = ({ holdExpiry, totalAmount }) => {
  const holdAmount = Math.round(totalAmount * 0.10);
  const timeLeft = Math.max(0, Math.floor((holdExpiry.getTime() - Date.now()) / 1000));
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-orange-800">Booking Hold Active</h3>
            <p className="text-sm text-orange-700 mt-1">
              You've paid ₹{holdAmount.toLocaleString()} to hold this car. Complete the remaining payment within:
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-orange-800">
                  {hours.toString().padStart(2, '0')}:
                  {minutes.toString().padStart(2, '0')}:
                  {seconds.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="text-sm text-orange-700">
                <p>Remaining time to complete payment</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-orange-100 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-700">
                  After 24 hours, your hold will expire and the car will become available to others.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};