'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useVehicle } from '@/lib/vehicle-context';
import { Part } from '@/lib/types';
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

type SortColumn = 'name' | 'category' | 'vehicle' | 'price_eur';
type SortDirection = 'asc' | 'desc' | null;

export default function PartsAdmin() {
  const { vehicles } = useVehicle();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    name: '',
    specifications: '',
    supplier_name: '',
    purchase_link: '',
    price_eur: 0,
    compatibility_notes: '',
    category: 'Engine',
  });

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error('Error loading parts:', error);
      toast.error('Failed to load parts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.vehicle_id) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingPart) {
        const { error } = await supabase
          .from('parts')
          .update(formData)
          .eq('id', editingPart.id);

        if (error) throw error;
        toast.success('Part updated successfully');
      } else {
        const { error } = await supabase.from('parts').insert([formData]);

        if (error) throw error;
        toast.success('Part added successfully');
      }

      resetForm();
      loadParts();
    } catch (error) {
      toast.error(editingPart ? 'Failed to update part' : 'Failed to add part');
    }
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setFormData({
      vehicle_id: part.vehicle_id,
      name: part.name,
      specifications: part.specifications,
      supplier_name: part.supplier_name,
      purchase_link: part.purchase_link,
      price_eur: part.price_eur,
      compatibility_notes: part.compatibility_notes,
      category: part.category,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this part?')) return;

    try {
      const { error } = await supabase.from('parts').delete().eq('id', id);

      if (error) throw error;
      toast.success('Part deleted successfully');
      loadParts();
    } catch (error) {
      toast.error('Failed to delete part');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      name: '',
      specifications: '',
      supplier_name: '',
      purchase_link: '',
      price_eur: 0,
      compatibility_notes: '',
      category: 'Engine',
    });
    setEditingPart(null);
    setIsOpen(false);
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle
      ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      : 'Unknown Vehicle';
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

  const getSortedParts = () => {
    if (!sortColumn || !sortDirection) return parts;

    return [...parts].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'vehicle':
          aValue = getVehicleName(a.vehicle_id).toLowerCase();
          bValue = getVehicleName(b.vehicle_id).toLowerCase();
          break;
        case 'price_eur':
          aValue = a.price_eur;
          bValue = b.price_eur;
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

  if (loading) {
    return <div className="text-white">Loading parts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Parts Management</h2>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Part
        </Button>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Name
                  <SortIcon column="name" />
                </div>
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('vehicle')}
              >
                <div className="flex items-center">
                  Vehicle
                  <SortIcon column="vehicle" />
                </div>
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Category
                  <SortIcon column="category" />
                </div>
              </TableHead>
              <TableHead className="text-foreground">Supplier</TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('price_eur')}
              >
                <div className="flex items-center">
                  Price
                  <SortIcon column="price_eur" />
                </div>
              </TableHead>
              <TableHead className="text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedParts().length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No parts found
                </TableCell>
              </TableRow>
            ) : (
              getSortedParts().map((part) => (
                <TableRow key={part.id} className="border-border">
                  <TableCell className="text-white font-medium">{part.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {getVehicleName(part.vehicle_id)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{part.category}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {part.supplier_name}
                  </TableCell>
                  <TableCell className="text-btn-green">
                    €{part.price_eur.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(part)}
                        variant="ghost"
                        size="sm"
                        className="text-btn-blue hover:text-btn-blue/80"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(part.id)}
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
              {editingPart ? 'Edit Part' : 'Add New Part'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingPart ? 'Update part information' : 'Add a new part to the database'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-foreground">Vehicle *</Label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                className="w-full bg-muted border border-border text-white rounded-md px-3 py-2 mt-1"
                required
              >
                <option value="">Select a vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Part Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Oil Filter"
                  className="bg-muted border-border text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-foreground">Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-muted border border-border text-white rounded-md px-3 py-2 mt-1"
                >
                  <option value="Engine">Engine</option>
                  <option value="Transmission">Transmission</option>
                  <option value="Brakes">Brakes</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Cooling">Cooling</option>
                  <option value="Fuel System">Fuel System</option>
                  <option value="Exhaust">Exhaust</option>
                  <option value="Interior">Interior</option>
                  <option value="Exterior">Exterior</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-foreground">Specifications</Label>
              <Input
                value={formData.specifications}
                onChange={(e) =>
                  setFormData({ ...formData, specifications: e.target.value })
                }
                placeholder="e.g., OEM Part Number: 12345"
                className="bg-muted border-border text-white mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Supplier Name</Label>
                <Input
                  value={formData.supplier_name}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier_name: e.target.value })
                  }
                  placeholder="e.g., AutoZone"
                  className="bg-muted border-border text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-foreground">Price (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_eur}
                  onChange={(e) =>
                    setFormData({ ...formData, price_eur: parseFloat(e.target.value) })
                  }
                  className="bg-muted border-border text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-foreground">Purchase Link</Label>
              <Input
                value={formData.purchase_link}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_link: e.target.value })
                }
                placeholder="https://..."
                className="bg-muted border-border text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-foreground">Compatibility Notes</Label>
              <Textarea
                value={formData.compatibility_notes}
                onChange={(e) =>
                  setFormData({ ...formData, compatibility_notes: e.target.value })
                }
                placeholder="Any important compatibility information"
                className="bg-muted border-border text-white mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
              >
                {editingPart ? 'Update Part' : 'Add Part'}
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

