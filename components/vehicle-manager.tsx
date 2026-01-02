'use client';

import { useState } from 'react';
import { useVehicle } from '@/lib/vehicle-context';
import { uploadVehicleImage } from '@/lib/upload-image';
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    make: '',
    model: '',
    engine: '',
    transmission: '',
    current_mileage: 0,
    notes: '',
    image_url: '',
    purchase_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.make || !formData.model) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = formData.image_url;

      // Upload image if selected
      if (imageFile) {
        const uploadedUrl = await uploadVehicleImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          toast.error('Failed to upload image');
          setIsSubmitting(false);
          return;
        }
      }

      await addVehicle({ ...formData, image_url: imageUrl });
      toast.success('Vehicle added successfully');
      setFormData({
        year: new Date().getFullYear(),
        make: '',
        model: '',
        engine: '',
        transmission: '',
        current_mileage: 0,
        notes: '',
        image_url: '',
        purchase_date: '',
      });
      setImageFile(null);
      setImagePreview('');
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
              <Label className="text-foreground">Purchase Date</Label>
              <Input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="bg-muted border-border text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-foreground">Vehicle Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="bg-muted border-border text-white mt-1 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-btn-blue file:text-btn-blue-foreground hover:file:bg-btn-blue/80"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Upload an image of your vehicle (max 5MB)
              </p>
              {imagePreview && (
                <div className="mt-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-xs h-48 object-cover rounded border border-border"
                  />
                </div>
              )}
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
                    <div className="flex items-center gap-3 flex-1">
                      {vehicle.image_url && (
                        <div className="w-12 h-12 rounded overflow-hidden bg-card flex-shrink-0">
                          <img
                            src={vehicle.image_url}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.current_mileage.toLocaleString()} km
                        </p>
                      </div>
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
