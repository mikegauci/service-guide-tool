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
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([]);
  const [currentMileage, setCurrentMileage] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState<string | null>(null);

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
          .order('service_date', { ascending: false }),
        supabase
          .from('vehicles')
          .select('current_mileage, purchase_date')
          .eq('id', vehicleId)
          .single(),
      ]);

      if (remindersRes.data) {
        setReminders(remindersRes.data);
      }
      if (serviceRes.data) {
        setServiceHistory(serviceRes.data);
      }
      if (vehicleRes.data) {
        setCurrentMileage(vehicleRes.data.current_mileage);
        setPurchaseDate(vehicleRes.data.purchase_date);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const getServicesDue = () => {
    const now = new Date();
    
    return reminders
      .map((reminder) => {
        // Find the last service record for THIS specific service type
        const lastServiceForType = serviceHistory.find(
          (service) => service.service_type.toLowerCase() === reminder.service_type.toLowerCase()
        );

        // If there's no service record for this type, it's due for checking
        const hasNoServiceRecord = !lastServiceForType;

        // Check mileage-based interval
        const lastMileage = lastServiceForType?.mileage_at_service || 0;
        const nextDueMileage = lastMileage + reminder.mileage_interval;
        const isDueByMileage = hasNoServiceRecord || currentMileage >= nextDueMileage;
        const milesUntilDue = nextDueMileage - currentMileage;

        // Check time-based interval
        let isDueByTime = false;
        let monthsUntilDue: number | null = null;
        let dueDate: Date | null = null;
        let lastServiceDate: Date | null = null;
        
        if (reminder.time_interval_months) {
          // Use either the last service date for this type, or the purchase date
          const startDate = lastServiceForType?.service_date 
            ? new Date(lastServiceForType.service_date) 
            : purchaseDate 
            ? new Date(purchaseDate) 
            : null;

          if (startDate) {
            lastServiceDate = startDate;
            // Calculate the next due date
            dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + reminder.time_interval_months);
            
            isDueByTime = hasNoServiceRecord || now >= dueDate;
            
            // Calculate months until due
            const monthsDiff = (dueDate.getFullYear() - now.getFullYear()) * 12 + 
                              (dueDate.getMonth() - now.getMonth());
            monthsUntilDue = monthsDiff;
          }
        }

        // Service is due if:
        // 1. There's no service record for this type, OR
        // 2. Either the mileage OR time condition is met
        const isDue = hasNoServiceRecord || isDueByMileage || isDueByTime;

        return {
          ...reminder,
          nextDueMileage,
          isDue,
          isDueByMileage,
          isDueByTime,
          hasNoServiceRecord,
          milesUntilDue,
          monthsUntilDue,
          dueDate,
          lastServiceDate,
        };
      })
      .sort((a, b) => {
        // Services with no records come first
        if (a.hasNoServiceRecord !== b.hasNoServiceRecord) {
          return a.hasNoServiceRecord ? -1 : 1;
        }
        // Then sort by due status
        if (a.isDue !== b.isDue) return a.isDue ? -1 : 1;
        // Sort by whichever comes first (mileage or time)
        const aSoonest = Math.min(
          a.milesUntilDue > 0 ? a.milesUntilDue : Infinity,
          a.monthsUntilDue !== null && a.monthsUntilDue > 0 ? a.monthsUntilDue * 1000 : Infinity
        );
        const bSoonest = Math.min(
          b.milesUntilDue > 0 ? b.milesUntilDue : Infinity,
          b.monthsUntilDue !== null && b.monthsUntilDue > 0 ? b.monthsUntilDue * 1000 : Infinity
        );
        return aSoonest - bSoonest;
      });
  };

  const servicesDue = getServicesDue();
  const hasOverduServices = servicesDue.some((s) => s.isDue);
  const servicesWithNoRecord = servicesDue.filter((s) => s.hasNoServiceRecord).length;
  const overdueCount = servicesDue.filter((s) => s.isDue).length;

  if (servicesDue.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {hasOverduServices && (
        <Card className="bg-red-500/10 border-red-500/50 p-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-400">Overdue Service</p>
              <p className="text-sm text-red-300">
                {overdueCount} service(s) overdue for maintenance
                {servicesWithNoRecord > 0 && (
                  <span className="block mt-1">
                    ⚠️ {servicesWithNoRecord} service(s) have no records and need inspection
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {servicesDue.map((service) => (
          <Card
            key={service.id}
            className={`p-3 ${
              service.isDue
                ? 'bg-red-500/10 border-red-500/50'
                : 'bg-btn-blue/10 border-btn-blue/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-white text-sm">{service.service_type}</p>
                {service.hasNoServiceRecord ? (
                  <div className="text-xs text-red-400 mt-1">
                    ⚠️ No service record - needs inspection
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <p>
                      {service.isDueByMileage ? '🔴 ' : ''}
                      Due at {service.nextDueMileage.toLocaleString()} km
                    </p>
                    {service.time_interval_months && service.dueDate && (
                      <p>
                        {service.isDueByTime ? '🔴 ' : ''}
                        Or by {service.dueDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {service.isDue ? (
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              ) : (
                <div className="text-right">
                  {service.milesUntilDue > 0 && (
                    <span className="text-xs font-semibold text-btn-blue block">
                      {service.milesUntilDue.toLocaleString()} km
                    </span>
                  )}
                  {service.monthsUntilDue !== null && service.monthsUntilDue > 0 && (
                    <span className="text-xs font-semibold text-btn-green block">
                      {service.monthsUntilDue} mo
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
