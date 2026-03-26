import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DoubleConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
}

export function DoubleConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
}: DoubleConfirmModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleConfirm = () => {
    if (step === 1) {
      setStep(2);
    } else {
      onConfirm();
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground text-center font-medium">
            {step === 1 
              ? "Are you sure you want to delete?" 
              : "This action cannot be undone."}
          </p>
        </div>
        <DialogFooter className="flex sm:justify-between sm:space-x-2">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            variant={step === 1 ? "default" : "destructive"} 
            onClick={handleConfirm}
            className="w-full sm:w-auto"
          >
            {step === 1 ? "Yes" : "Confirm Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
