'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useVehicle } from '@/lib/vehicle-context';
import { DiagnosticProcedure } from '@/lib/types';
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

type SortColumn = 'title' | 'system' | 'vehicle';
type SortDirection = 'asc' | 'desc' | null;

export default function DiagnosticsAdmin() {
  const { vehicles } = useVehicle();
  const [diagnostics, setDiagnostics] = useState<DiagnosticProcedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DiagnosticProcedure | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    title: '',
    system: 'Engine',
    description: '',
    steps: '',
    warnings: '',
  });

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diagnostic_procedures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiagnostics(data || []);
    } catch (error) {
      console.error('Error loading diagnostics:', error);
      toast.error('Failed to load diagnostics');
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
          .from('diagnostic_procedures')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Diagnostic updated successfully');
      } else {
        const { error } = await supabase.from('diagnostic_procedures').insert([formData]);

        if (error) throw error;
        toast.success('Diagnostic added successfully');
      }

      resetForm();
      loadDiagnostics();
    } catch (error) {
      toast.error('Failed to save diagnostic');
    }
  };

  const handleEdit = (item: DiagnosticProcedure) => {
    setEditingItem(item);
    setFormData({
      vehicle_id: item.vehicle_id,
      title: item.title,
      system: item.system,
      description: item.description,
      steps: item.steps,
      warnings: item.warnings,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this diagnostic?')) return;

    try {
      const { error } = await supabase.from('diagnostic_procedures').delete().eq('id', id);

      if (error) throw error;
      toast.success('Diagnostic deleted successfully');
      loadDiagnostics();
    } catch (error) {
      toast.error('Failed to delete diagnostic');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      title: '',
      system: 'Engine',
      description: '',
      steps: '',
      warnings: '',
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

  const getSortedDiagnostics = () => {
    if (!sortColumn || !sortDirection) return diagnostics;

    return [...diagnostics].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'system':
          aValue = a.system.toLowerCase();
          bValue = b.system.toLowerCase();
          break;
        case 'vehicle':
          aValue = getVehicleName(a.vehicle_id).toLowerCase();
          bValue = getVehicleName(b.vehicle_id).toLowerCase();
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
    return <div className="text-white">Loading diagnostics...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Diagnostic Procedures</h2>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Diagnostic
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
                onClick={() => handleSort('system')}
              >
                <div className="flex items-center">
                  System
                  <SortIcon column="system" />
                </div>
              </TableHead>
              <TableHead className="text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedDiagnostics().length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No diagnostics found
                </TableCell>
              </TableRow>
            ) : (
              getSortedDiagnostics().map((item) => (
                <TableRow key={item.id} className="border-border">
                  <TableCell className="text-white font-medium">{item.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {getVehicleName(item.vehicle_id)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.system}</TableCell>
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
              {editingItem ? 'Edit Diagnostic' : 'Add New Diagnostic'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingItem ? 'Update diagnostic information' : 'Add a new diagnostic procedure'}
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
                <Label className="text-foreground">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Check Engine Light Diagnosis"
                  className="bg-muted border-border text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-foreground">System</Label>
                <select
                  value={formData.system}
                  onChange={(e) => setFormData({ ...formData, system: e.target.value })}
                  className="w-full bg-muted border border-border text-white rounded-md px-3 py-2 mt-1"
                >
                  <option value="Engine">Engine</option>
                  <option value="Transmission">Transmission</option>
                  <option value="Brakes">Brakes</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Cooling">Cooling</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Exhaust">Exhaust</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-foreground">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the diagnostic"
                className="bg-muted border-border text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-foreground">Steps</Label>
              <Textarea
                value={formData.steps}
                onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                placeholder="Step-by-step instructions"
                className="bg-muted border-border text-white mt-1 min-h-[150px]"
              />
            </div>

            <div>
              <Label className="text-foreground">Warnings</Label>
              <Textarea
                value={formData.warnings}
                onChange={(e) => setFormData({ ...formData, warnings: e.target.value })}
                placeholder="Safety warnings or cautions"
                className="bg-muted border-border text-white mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
              >
                {editingItem ? 'Update' : 'Add Diagnostic'}
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

