'use client';

import { useState } from 'react';
import { useVehicle } from '@/lib/vehicle-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface VehicleManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VehicleManager({ isOpen, onClose }: VehicleManagerProps) {
  const { addVehicle, deleteVehicle, vehicles, updateVehicle } = useVehicle();
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    make: '',
    model: '',
    engine: '',
    transmission: '',
    current_mileage: 0,
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.make || !formData.model) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await addVehicle(formData);
      toast.success('Vehicle added successfully');
      setFormData({
        year: new Date().getFullYear(),
        make: '',
        model: '',
        engine: '',
        transmission: '',
        current_mileage: 0,
        notes: '',
      });
      onClose();
    } catch (error) {
      toast.error('Failed to add vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure? This will delete all associated data.')) {
      try {
        await deleteVehicle(id);
        toast.success('Vehicle deleted');
      } catch {
        toast.error('Failed to delete vehicle');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white">Vehicle Management</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new vehicle or manage existing ones
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Year *</Label>
                <Input
                  type="number"
                  min={1990}
                  max={new Date().getFullYear()}
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  className="bg-muted border-border text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-foreground">Make *</Label>
                <Input
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="e.g., Honda"
                  className="bg-muted border-border text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Model *</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., NSX"
                  className="bg-muted border-border text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-foreground">Engine</Label>
                <Input
                  value={formData.engine}
                  onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                  placeholder="e.g., 3.0L V6"
                  className="bg-muted border-border text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Transmission</Label>
                <Input
                  value={formData.transmission}
                  onChange={(e) =>
                    setFormData({ ...formData, transmission: e.target.value })
                  }
                  placeholder="e.g., Manual"
                  className="bg-muted border-border text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-foreground">Current Mileage (km)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.current_mileage}
                  onChange={(e) =>
                    setFormData({ ...formData, current_mileage: parseInt(e.target.value) })
                  }
                  className="bg-muted border-border text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-foreground">Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about the vehicle"
                className="bg-muted border-border text-white mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
            >
              {isSubmitting ? 'Adding...' : 'Add Vehicle'}
            </Button>
          </form>

          {vehicles.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Your Vehicles</h3>
              <div className="space-y-2">
                {vehicles.map((vehicle) => (
                  <Card
                    key={vehicle.id}
                    className="bg-muted border-border flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.current_mileage.toLocaleString()} km
                      </p>
                    </div>
                    <Button
                      onClick={() => handleDelete(vehicle.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
