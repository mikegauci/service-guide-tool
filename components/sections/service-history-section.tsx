'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { ServiceHistory } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useVehicle } from '@/lib/vehicle-context';

interface ServiceHistorySectionProps {
  vehicleId: string;
}

export default function ServiceHistorySection({ vehicleId }: ServiceHistorySectionProps) {
  const { selectedVehicle, updateVehicle } = useVehicle();
  const [services, setServices] = useState<ServiceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    service_date: new Date().toISOString().split('T')[0],
    mileage_at_service: selectedVehicle?.current_mileage || 0,
    mechanic_name: '',
    notes: '',
    total_cost: 0,
  });

  useEffect(() => {
    loadServices();
  }, [vehicleId]);

  useEffect(() => {
    if (selectedVehicle) {
      setFormData((prev) => ({
        ...prev,
        mileage_at_service: selectedVehicle.current_mileage,
      }));
    }
  }, [selectedVehicle]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_history')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('service_date', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mechanic_name) {
      toast.error('Please enter mechanic name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('service_history')
        .insert([
          {
            vehicle_id: vehicleId,
            ...formData,
            total_cost: parseFloat(formData.total_cost.toString()),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setServices([data, ...services]);

      if (selectedVehicle) {
        await updateVehicle(vehicleId, {
          current_mileage: formData.mileage_at_service,
        });
      }

      toast.success('Service record created');
      setFormData({
        service_date: new Date().toISOString().split('T')[0],
        mileage_at_service: selectedVehicle?.current_mileage || 0,
        mechanic_name: '',
        notes: '',
        total_cost: 0,
      });
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to create service record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure? This will delete the service record.')) {
      try {
        const { error } = await supabase
          .from('service_history')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setServices(services.filter((s) => s.id !== id));
        toast.success('Service record deleted');
      } catch {
        toast.error('Failed to delete service record');
      }
    }
  };

  if (loading) {
    return <div className="text-white">Loading service history...</div>;
  }

  const totalSpent = services.reduce((sum, s) => sum + s.total_cost, 0);

  return (
    <div className="space-y-6">
      <Card className="bg-slate-700 border-slate-600">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Service History & Summary</CardTitle>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Record Service Appointment</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Document a completed service appointment
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Service Date</Label>
                    <Input
                      type="date"
                      value={formData.service_date}
                      onChange={(e) =>
                        setFormData({ ...formData, service_date: e.target.value })
                      }
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Mileage (km)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.mileage_at_service}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mileage_at_service: parseInt(e.target.value),
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Mechanic Name *</Label>
                  <Input
                    value={formData.mechanic_name}
                    onChange={(e) =>
                      setFormData({ ...formData, mechanic_name: e.target.value })
                    }
                    placeholder="Who performed the service?"
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Total Cost (€)</Label>
                  <Input
                    type="number"
                    step={0.01}
                    min={0}
                    value={formData.total_cost}
                    onChange={(e) =>
                      setFormData({ ...formData, total_cost: parseFloat(e.target.value) })
                    }
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Service Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Document what was done..."
                    className="bg-slate-700 border-slate-600 text-white mt-1 min-h-[100px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? 'Saving...' : 'Record Service'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {services.length > 0 && (
        <Card className="bg-blue-500/10 border-blue-600">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-400">Total Services</p>
                <p className="text-2xl font-bold text-white">{services.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Spent</p>
                <p className="text-2xl font-bold text-green-400">€{totalSpent.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Average Cost</p>
                <p className="text-2xl font-bold text-blue-400">
                  €{(totalSpent / services.length).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {services.length === 0 ? (
        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="pt-6 text-center text-slate-400">
            No service records yet. Start by recording a service appointment.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Card key={service.id} className="bg-slate-700 border-slate-600">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <p className="font-semibold text-white">
                        {new Date(service.service_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-400">•</p>
                      <p className="text-sm text-slate-400">
                        {service.mileage_at_service.toLocaleString()} km
                      </p>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      Mechanic: <span className="text-white">{service.mechanic_name}</span>
                    </p>
                    {service.notes && (
                      <p className="text-sm text-slate-300 bg-slate-800 rounded p-2 whitespace-pre-wrap">
                        {service.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end gap-2 flex-col">
                    <p className="text-lg font-bold text-green-400">€{service.total_cost.toFixed(2)}</p>
                    <Button
                      onClick={() => handleDelete(service.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
