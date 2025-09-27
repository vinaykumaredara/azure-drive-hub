// src/components/admin/car-management/DeleteCarDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Car as CarType } from '@/services/api/car.types';

interface DeleteCarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: CarType | null;
  onDelete: () => void;
  isDeleting: boolean;
}

const DeleteCarDialog = ({ open, onOpenChange, car, onDelete, isDeleting }: DeleteCarDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Are you sure you want to delete <span className="font-semibold">{car?.title}</span>?</p>
          <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCarDialog;