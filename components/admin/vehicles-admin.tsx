'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useVehicle } from '@/lib/vehicle-context';
import { Vehicle } from '@/lib/types';
import { uploadVehicleImage, deleteVehicleImage } from '@/lib/upload-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

type SortColumn = 'year' | 'make' | 'model' | 'current_mileage';
type SortDirection = 'asc' | 'desc' | null;

export default function VehiclesAdmin() {
  const { vehicles, addVehicle, deleteVehicle, loadVehicles } = useVehicle();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
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
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = formData.image_url;

      // Upload new image if selected
      if (imageFile) {
        // Delete old image if updating
        if (editingVehicle && editingVehicle.image_url) {
          await deleteVehicleImage(editingVehicle.image_url);
        }

        const uploadedUrl = await uploadVehicleImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          toast.error('Failed to upload image');
          setLoading(false);
          return;
        }
      }

      const dataToSave = { ...formData, image_url: imageUrl };

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(dataToSave)
          .eq('id', editingVehicle.id);

        if (error) throw error;
        toast.success('Vehicle updated successfully');
      } else {
        await addVehicle(dataToSave);
        toast.success('Vehicle added successfully');
      }

      resetForm();
      await loadVehicles();
    } catch (error) {
      toast.error(editingVehicle ? 'Failed to update vehicle' : 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      engine: vehicle.engine,
      transmission: vehicle.transmission,
      current_mileage: vehicle.current_mileage,
      notes: vehicle.notes,
      image_url: vehicle.image_url,
      purchase_date: vehicle.purchase_date || '',
    });
    setImagePreview(vehicle.image_url || '');
    setImageFile(null);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure? This will delete all associated data for this vehicle.')) return;

    try {
      await deleteVehicle(id);
      toast.success('Vehicle deleted successfully');
    } catch (error) {
      toast.error('Failed to delete vehicle');
    }
  };

  const resetForm = () => {
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
    setEditingVehicle(null);
    setIsOpen(false);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedVehicles = () => {
    if (!sortColumn || !sortDirection) return vehicles;

    return [...vehicles].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        case 'make':
          aValue = a.make.toLowerCase();
          bValue = b.make.toLowerCase();
          break;
        case 'model':
          aValue = a.model.toLowerCase();
          bValue = b.model.toLowerCase();
          break;
        case 'current_mileage':
          aValue = a.current_mileage;
          bValue = b.current_mileage;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-3 w-3 ml-1" />;
    return <ArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Vehicles Management</h2>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="text-foreground">Image</TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('year')}
              >
                <div className="flex items-center">
                  Year
                  <SortIcon column="year" />
                </div>
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('make')}
              >
                <div className="flex items-center">
                  Make
                  <SortIcon column="make" />
                </div>
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('model')}
              >
                <div className="flex items-center">
                  Model
                  <SortIcon column="model" />
                </div>
              </TableHead>
              <TableHead className="text-foreground">Engine</TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('current_mileage')}
              >
                <div className="flex items-center">
                  Mileage
                  <SortIcon column="current_mileage" />
                </div>
              </TableHead>
              <TableHead className="text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedVehicles().length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No vehicles found
                </TableCell>
              </TableRow>
            ) : (
              getSortedVehicles().map((vehicle) => (
                <TableRow key={vehicle.id} className="border-border">
                  <TableCell>
                    {vehicle.image_url ? (
                      <div className="w-16 h-16 rounded overflow-hidden bg-muted">
                        <img
                          src={vehicle.image_url}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">No image</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-white font-medium">{vehicle.year}</TableCell>
                  <TableCell className="text-white font-medium">{vehicle.make}</TableCell>
                  <TableCell className="text-white font-medium">{vehicle.model}</TableCell>
                  <TableCell className="text-muted-foreground">{vehicle.engine}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {vehicle.current_mileage.toLocaleString()} km
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(vehicle)}
                        variant="ghost"
                        size="sm"
                        className="text-btn-blue hover:text-btn-blue/80"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(vehicle.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={resetForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingVehicle ? 'Update vehicle information' : 'Add a new vehicle to the database'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Year *</Label>
                <Input
                  type="number"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  className="bg-muted border-border text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-foreground">Make *</Label>
                <Input
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="e.g., Honda"
                  className="bg-muted border-border text-white mt-1"
                  required
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
                  required
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
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about the vehicle"
                className="bg-muted border-border text-white mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
              >
                {loading ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
                className="border-border text-foreground"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

