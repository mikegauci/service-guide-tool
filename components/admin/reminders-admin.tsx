'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useVehicle } from '@/lib/vehicle-context';
import { ServiceReminder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type SortColumn = 'service_type' | 'vehicle' | 'mileage_interval' | 'time_interval_months' | 'last_service_mileage';
type SortDirection = 'asc' | 'desc' | null;

export default function RemindersAdmin() {
  const { vehicles } = useVehicle();
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceReminder | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: '',
    mileage_interval: 10000,
    last_service_mileage: 0,
    time_interval_months: 0,
  });

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_reminders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.service_type || !formData.vehicle_id) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('service_reminders')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Reminder updated successfully');
      } else {
        const { error } = await supabase.from('service_reminders').insert([formData]);

        if (error) throw error;
        toast.success('Reminder added successfully');
      }

      resetForm();
      loadReminders();
    } catch (error) {
      toast.error('Failed to save reminder');
    }
  };

  const handleEdit = (item: ServiceReminder) => {
    setEditingItem(item);
    setFormData({
      vehicle_id: item.vehicle_id,
      service_type: item.service_type,
      mileage_interval: item.mileage_interval,
      last_service_mileage: item.last_service_mileage,
      time_interval_months: item.time_interval_months || 0,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const { error } = await supabase.from('service_reminders').delete().eq('id', id);

      if (error) throw error;
      toast.success('Reminder deleted successfully');
      loadReminders();
    } catch (error) {
      toast.error('Failed to delete reminder');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      service_type: '',
      mileage_interval: 10000,
      last_service_mileage: 0,
      time_interval_months: 0,
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

  const formatTimeInterval = (months: number | null) => {
    if (!months) return '-';
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
    const years = months / 12;
    if (years === 1) return '1 year';
    return `${years} years`;
  };

  const getSortedReminders = () => {
    if (!sortColumn || !sortDirection) return reminders;

    return [...reminders].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'service_type':
          aValue = a.service_type.toLowerCase();
          bValue = b.service_type.toLowerCase();
          break;
        case 'vehicle':
          aValue = getVehicleName(a.vehicle_id).toLowerCase();
          bValue = getVehicleName(b.vehicle_id).toLowerCase();
          break;
        case 'mileage_interval':
          aValue = a.mileage_interval;
          bValue = b.mileage_interval;
          break;
        case 'time_interval_months':
          aValue = a.time_interval_months || 0;
          bValue = b.time_interval_months || 0;
          break;
        case 'last_service_mileage':
          aValue = a.last_service_mileage;
          bValue = b.last_service_mileage;
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
    return <div className="text-white">Loading reminders...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Service Reminders</h2>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Reminder
        </Button>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('service_type')}
              >
                <div className="flex items-center">
                  Service Type
                  <SortIcon column="service_type" />
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
                onClick={() => handleSort('mileage_interval')}
              >
                <div className="flex items-center">
                  Interval (km)
                  <SortIcon column="mileage_interval" />
                </div>
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('time_interval_months')}
              >
                <div className="flex items-center">
                  Time Interval
                  <SortIcon column="time_interval_months" />
                </div>
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('last_service_mileage')}
              >
                <div className="flex items-center">
                  Last Service (km)
                  <SortIcon column="last_service_mileage" />
                </div>
              </TableHead>
              <TableHead className="text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedReminders().length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No reminders found
                </TableCell>
              </TableRow>
            ) : (
              getSortedReminders().map((item) => (
                <TableRow key={item.id} className="border-border">
                  <TableCell className="text-white font-medium">
                    {item.service_type}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getVehicleName(item.vehicle_id)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.mileage_interval.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatTimeInterval(item.time_interval_months)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.last_service_mileage.toLocaleString()}
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
              {editingItem ? 'Edit Reminder' : 'Add New Reminder'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingItem
                ? 'Update reminder information'
                : 'Add a new service reminder'}
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
              <Label className="text-foreground">Service Type *</Label>
              <Input
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                placeholder="e.g., Oil Change, Tire Rotation"
                className="bg-muted border-border text-white mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Mileage Interval (km) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.mileage_interval}
                  onChange={(e) =>
                    setFormData({ ...formData, mileage_interval: parseInt(e.target.value) })
                  }
                  placeholder="e.g., 10000"
                  className="bg-muted border-border text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-foreground">Time Interval (months)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.time_interval_months}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      time_interval_months: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g., 6, 12, 24"
                  className="bg-muted border-border text-white mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Service due after X months
                </p>
              </div>
            </div>

            <div>
              <Label className="text-foreground">Last Service Mileage (km)</Label>
              <Input
                type="number"
                min="0"
                value={formData.last_service_mileage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    last_service_mileage: parseInt(e.target.value),
                  })
                }
                placeholder="e.g., 50000"
                className="bg-muted border-border text-white mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
              >
                {editingItem ? 'Update' : 'Add Reminder'}
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

