'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useVehicle } from '@/lib/vehicle-context';
import { InspectionTemplate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

type SortColumn = 'title' | 'category' | 'vehicle' | 'is_priority';
type SortDirection = 'asc' | 'desc' | null;

export default function InspectionAdmin() {
  const { vehicles } = useVehicle();
  const [inspections, setInspections] = useState<InspectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionTemplate | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    title: '',
    description: '',
    category: 'General',
    is_priority: false,
    specifications: '',
  });

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inspection_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInspections(data || []);
    } catch (error) {
      console.error('Error loading inspections:', error);
      toast.error('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.vehicle_id) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('inspection_templates')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Inspection updated successfully');
      } else {
        const { error } = await supabase.from('inspection_templates').insert([formData]);

        if (error) throw error;
        toast.success('Inspection added successfully');
      }

      resetForm();
      loadInspections();
    } catch (error) {
      toast.error('Failed to save inspection');
    }
  };

  const handleEdit = (item: InspectionTemplate) => {
    setEditingItem(item);
    setFormData({
      vehicle_id: item.vehicle_id,
      title: item.title,
      description: item.description,
      category: item.category,
      is_priority: item.is_priority,
      specifications: item.specifications,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this inspection?')) return;

    try {
      const { error } = await supabase.from('inspection_templates').delete().eq('id', id);

      if (error) throw error;
      toast.success('Inspection deleted successfully');
      loadInspections();
    } catch (error) {
      toast.error('Failed to delete inspection');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      title: '',
      description: '',
      category: 'General',
      is_priority: false,
      specifications: '',
    });
    setEditingItem(null);
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

  const getSortedInspections = () => {
    if (!sortColumn || !sortDirection) return inspections;

    return [...inspections].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'vehicle':
          aValue = getVehicleName(a.vehicle_id).toLowerCase();
          bValue = getVehicleName(b.vehicle_id).toLowerCase();
          break;
        case 'is_priority':
          aValue = a.is_priority ? 1 : 0;
          bValue = b.is_priority ? 1 : 0;
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
    return <div className="text-white">Loading inspections...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Inspection Templates</h2>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Inspection
        </Button>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  Title
                  <SortIcon column="title" />
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
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('is_priority')}
              >
                <div className="flex items-center">
                  Priority
                  <SortIcon column="is_priority" />
                </div>
              </TableHead>
              <TableHead className="text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedInspections().length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No inspections found
                </TableCell>
              </TableRow>
            ) : (
              getSortedInspections().map((item) => (
                <TableRow key={item.id} className="border-border">
                  <TableCell className="text-white font-medium">{item.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {getVehicleName(item.vehicle_id)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.category}</TableCell>
                  <TableCell>
                    {item.is_priority && (
                      <span className="text-red-400 text-xs">Priority</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(item)}
                        variant="ghost"
                        size="sm"
                        className="text-btn-blue hover:text-btn-blue/80"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(item.id)}
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
              {editingItem ? 'Edit Inspection' : 'Add New Inspection'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingItem ? 'Update inspection information' : 'Add a new inspection template'}
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

            <div>
              <Label className="text-foreground">Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Check brake pads"
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
                <option value="General">General</option>
                <option value="Engine">Engine</option>
                <option value="Brakes">Brakes</option>
                <option value="Suspension">Suspension</option>
                <option value="Electrical">Electrical</option>
                <option value="Tires">Tires</option>
                <option value="Fluids">Fluids</option>
                <option value="Lights">Lights</option>
                <option value="Interior">Interior</option>
              </select>
            </div>

            <div>
              <Label className="text-foreground">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what to inspect"
                className="bg-muted border-border text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-foreground">Specifications</Label>
              <Textarea
                value={formData.specifications}
                onChange={(e) =>
                  setFormData({ ...formData, specifications: e.target.value })
                }
                placeholder="Technical specs or measurements"
                className="bg-muted border-border text-white mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="priority"
                checked={formData.is_priority}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_priority: checked as boolean })
                }
              />
              <Label htmlFor="priority" className="text-foreground cursor-pointer">
                Mark as priority item
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
              >
                {editingItem ? 'Update' : 'Add Inspection'}
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

