'use client';

import { useState, useEffect } from 'react';
import { useVehicle } from '@/lib/vehicle-context';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Plus, Wrench, Calendar, Shield } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VehicleSelector from '@/components/vehicle-selector';
import VehicleManager from '@/components/vehicle-manager';
import PartsSection from '@/components/sections/parts-section';
import InspectionSection from '@/components/sections/inspection-section';
import DiagnosticsSection from '@/components/sections/diagnostics-section';
import VideoSection from '@/components/sections/video-section';
import ServiceHistorySection from '@/components/sections/service-history-section';
import MileageReminders from '@/components/mileage-reminders';

export default function Home() {
  const { selectedVehicle, vehicles, loading } = useVehicle();
  const [showVehicleManager, setShowVehicleManager] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [overdueCount, setOverdueCount] = useState(0);

  const handleOverdueClick = () => {
    setActiveTab('reminders');
    // Smooth scroll to tabs section
    setTimeout(() => {
      document.querySelector('[role="tablist"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  useEffect(() => {
    if (!selectedVehicle) return;

    const checkOverdueServices = async () => {
      try {
        const [remindersRes, serviceRes, vehicleRes] = await Promise.all([
          supabase
            .from('service_reminders')
            .select('*')
            .eq('vehicle_id', selectedVehicle.id),
          supabase
            .from('service_history')
            .select('*')
            .eq('vehicle_id', selectedVehicle.id)
            .order('service_date', { ascending: false }),
          supabase
            .from('vehicles')
            .select('current_mileage, purchase_date')
            .eq('id', selectedVehicle.id)
            .single(),
        ]);

        if (!remindersRes.data || !vehicleRes.data) return;

        const reminders = remindersRes.data;
        const serviceHistory = serviceRes.data || [];
        const currentMileage = vehicleRes.data.current_mileage;
        const purchaseDate = vehicleRes.data.purchase_date;
        const now = new Date();

        let overdue = 0;

        reminders.forEach((reminder) => {
          const lastServiceForType = serviceHistory.find(
            (service) => service.service_type?.toLowerCase() === reminder.service_type.toLowerCase()
          );

          const hasNoServiceRecord = !lastServiceForType;
          const lastMileage = lastServiceForType?.mileage_at_service || 0;
          const nextDueMileage = lastMileage + reminder.mileage_interval;
          const isDueByMileage = hasNoServiceRecord || currentMileage >= nextDueMileage;

          let isDueByTime = false;
          if (reminder.time_interval_months) {
            const startDate = lastServiceForType?.service_date 
              ? new Date(lastServiceForType.service_date) 
              : purchaseDate 
              ? new Date(purchaseDate) 
              : null;

            if (startDate) {
              const dueDate = new Date(startDate);
              dueDate.setMonth(dueDate.getMonth() + reminder.time_interval_months);
              isDueByTime = hasNoServiceRecord || now >= dueDate;
            }
          }

          if (hasNoServiceRecord || isDueByMileage || isDueByTime) {
            overdue++;
          }
        });

        setOverdueCount(overdue);
      } catch (error) {
        console.error('Error checking overdue services:', error);
      }
    };

    checkOverdueServices();
  }, [selectedVehicle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-4 py-4 md:py-6">
            <div className="flex items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6 flex-col md:flex-row">
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2">
                  <Wrench className="h-6 w-6 md:h-8 md:w-8 text-btn-blue" />
                  Mike's Service Guide Tool
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1">Personal vehicle maintenance tracker</p>
              </div>
              <div className="flex gap-2">
                {/* <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                >
                  <Link href="/admin">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                </Button> */}
                {/* <Button
                  onClick={() => setShowVehicleManager(true)}
                  size="lg"
                  className="bg-btn-blue hover:bg-btn-blue/80 text-btn-blue-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Button> */}
              </div>
            </div>

            <VehicleSelector />
          </div>
        </header>

        <main className="px-4 py-8">
          {vehicles.length === 0 ? (
            <Alert className="border-yellow-500/50 bg-yellow-500/10 mb-6">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-400">
                No vehicles added yet. Click "Add Vehicle" to get started.
              </AlertDescription>
            </Alert>
          ) : selectedVehicle ? (
            <>
              <div className="mb-6">
                <div className="flex gap-6 items-start flex-col md:flex-row">
                  {selectedVehicle.image_url && (
                    <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden border border-border bg-muted flex-shrink-0">
                      <img
                        src={selectedVehicle.image_url}
                        alt={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Engine: {selectedVehicle.engine} | Transmission: {selectedVehicle.transmission}
                    </p>
                    {overdueCount > 0 && (
                      <Alert 
                        className="border-red-500/50 bg-red-500/10 cursor-pointer hover:bg-red-500/20 transition-colors" 
                        onClick={handleOverdueClick}
                      >
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-400">
                          <span className="font-semibold">Overdue Service</span>
                          <br />
                          {overdueCount} service(s) overdue for maintenance - Click to view
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-card mb-8">
                  <TabsTrigger value="overview" className="text-xs md:text-sm">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="reminders" className="text-xs md:text-sm">
                    Reminders
                  </TabsTrigger>
                  <TabsTrigger value="parts" className="text-xs md:text-sm">
                    Parts
                  </TabsTrigger>
                  <TabsTrigger value="inspection" className="text-xs md:text-sm">
                    Inspection
                  </TabsTrigger>
                  {/* <TabsTrigger value="diagnostics" className="text-xs md:text-sm">
                    Diagnostics
                  </TabsTrigger> */}
                  <TabsTrigger value="videos" className="text-xs md:text-sm">
                    Videos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6" forceMount>
                  <div className={activeTab !== 'overview' ? 'hidden' : ''}>
                    <ServiceHistorySection vehicleId={selectedVehicle.id} />
                  </div>
                </TabsContent>

                <TabsContent value="reminders" className="space-y-6" forceMount>
                  <div className={activeTab !== 'reminders' ? 'hidden' : ''}>
                    <MileageReminders vehicleId={selectedVehicle.id} />
                  </div>
                </TabsContent>

                <TabsContent value="parts" className="space-y-6" forceMount>
                  <div className={activeTab !== 'parts' ? 'hidden' : ''}>
                    <PartsSection vehicleId={selectedVehicle.id} />
                  </div>
                </TabsContent>

                <TabsContent value="inspection" className="space-y-6" forceMount>
                  <div className={activeTab !== 'inspection' ? 'hidden' : ''}>
                    <InspectionSection vehicleId={selectedVehicle.id} />
                  </div>
                </TabsContent>

                <TabsContent value="diagnostics" className="space-y-6" forceMount>
                  <div className={activeTab !== 'diagnostics' ? 'hidden' : ''}>
                    <DiagnosticsSection vehicleId={selectedVehicle.id} />
                  </div>
                </TabsContent>

                <TabsContent value="videos" className="space-y-6" forceMount>
                  <div className={activeTab !== 'videos' ? 'hidden' : ''}>
                    <VideoSection vehicleId={selectedVehicle.id} />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : null}
        </main>
      </div>

      <VehicleManager
        isOpen={showVehicleManager}
        onClose={() => setShowVehicleManager(false)}
      />
    </div>
  );
}
