'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { ServiceReminder, ServiceHistory } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { AlertCircle, Check } from 'lucide-react';

interface MileageRemindersProps {
  vehicleId: string;
}

export default function MileageReminders({ vehicleId }: MileageRemindersProps) {
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [latestService, setLatestService] = useState<ServiceHistory | null>(null);
  const [currentMileage, setCurrentMileage] = useState(0);

  useEffect(() => {
    loadReminders();
  }, [vehicleId]);

  const loadReminders = async () => {
    try {
      const [remindersRes, serviceRes, vehicleRes] = await Promise.all([
        supabase
          .from('service_reminders')
          .select('*')
          .eq('vehicle_id', vehicleId),
        supabase
          .from('service_history')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .order('service_date', { ascending: false })
          .limit(1),
        supabase
          .from('vehicles')
          .select('current_mileage')
          .eq('id', vehicleId)
          .single(),
      ]);

      if (remindersRes.data) {
        setReminders(remindersRes.data);
      }
      if (serviceRes.data?.length) {
        setLatestService(serviceRes.data[0]);
      }
      if (vehicleRes.data) {
        setCurrentMileage(vehicleRes.data.current_mileage);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const getServicesDue = () => {
    return reminders
      .map((reminder) => {
        const lastMileage = latestService?.mileage_at_service || reminder.last_service_mileage;
        const nextDueMileage = lastMileage + reminder.mileage_interval;
        const isDue = currentMileage >= nextDueMileage;

        return {
          ...reminder,
          nextDueMileage,
          isDue,
          milesUntilDue: nextDueMileage - currentMileage,
        };
      })
      .sort((a, b) => {
        if (a.isDue !== b.isDue) return a.isDue ? -1 : 1;
        return a.milesUntilDue - b.milesUntilDue;
      });
  };

  const servicesDue = getServicesDue();
  const hasOverduServices = servicesDue.some((s) => s.isDue);

  if (servicesDue.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {hasOverduServices && (
        <Card className="bg-red-500/10 border-red-600 p-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-500">Overdue Service</p>
              <p className="text-sm text-red-400">
                {servicesDue.filter((s) => s.isDue).length} service(s) overdue for maintenance
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
        {servicesDue.slice(0, 4).map((service) => (
          <Card
            key={service.id}
            className={`p-3 ${
              service.isDue
                ? 'bg-red-500/10 border-red-600'
                : 'bg-blue-500/10 border-blue-600'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-white text-sm">{service.service_type}</p>
                <p className="text-xs text-slate-400">
                  Due at {service.nextDueMileage.toLocaleString()} km
                </p>
              </div>
              {service.isDue ? (
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              ) : (
                <span className="text-xs font-semibold text-blue-400">
                  {service.milesUntilDue.toLocaleString()} km
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
