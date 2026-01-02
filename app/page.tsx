'use client';

import { useState, useEffect } from 'react';
import { useVehicle } from '@/lib/vehicle-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Plus, Wrench, Calendar } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto">
        <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between gap-4 mb-6 flex-col md:flex-row">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  <Wrench className="h-8 w-8 text-blue-400" />
                  Service Guide Pro
                </h1>
                <p className="text-slate-400 mt-1">Personal vehicle maintenance tracker</p>
              </div>
              <Button
                onClick={() => setShowVehicleManager(true)}
                variant="outline"
                size="lg"
                className="text-white border-slate-600 hover:bg-slate-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>

            <VehicleSelector />
          </div>
        </header>

        <main className="px-4 py-8">
          {vehicles.length === 0 ? (
            <Alert className="border-yellow-600 bg-yellow-500/10 mb-6">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-600">
                No vehicles added yet. Click "Add Vehicle" to get started.
              </AlertDescription>
            </Alert>
          ) : selectedVehicle ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </h2>
                <p className="text-slate-300 mb-4">
                  Engine: {selectedVehicle.engine} | Transmission: {selectedVehicle.transmission}
                </p>
                <MileageReminders vehicleId={selectedVehicle.id} />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-slate-700 mb-8">
                  <TabsTrigger value="overview" className="text-xs md:text-sm">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="parts" className="text-xs md:text-sm">
                    Parts
                  </TabsTrigger>
                  <TabsTrigger value="inspection" className="text-xs md:text-sm">
                    Inspection
                  </TabsTrigger>
                  <TabsTrigger value="diagnostics" className="text-xs md:text-sm">
                    Diagnostics
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="text-xs md:text-sm">
                    Videos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <ServiceHistorySection vehicleId={selectedVehicle.id} />
                </TabsContent>

                <TabsContent value="parts" className="space-y-6">
                  <PartsSection vehicleId={selectedVehicle.id} />
                </TabsContent>

                <TabsContent value="inspection" className="space-y-6">
                  <InspectionSection vehicleId={selectedVehicle.id} />
                </TabsContent>

                <TabsContent value="diagnostics" className="space-y-6">
                  <DiagnosticsSection vehicleId={selectedVehicle.id} />
                </TabsContent>

                <TabsContent value="videos" className="space-y-6">
                  <VideoSection vehicleId={selectedVehicle.id} />
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
