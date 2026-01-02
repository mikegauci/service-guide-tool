'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import VehiclesAdmin from '@/components/admin/vehicles-admin';
import PartsAdmin from '@/components/admin/parts-admin';
import InspectionAdmin from '@/components/admin/inspection-admin';
import DiagnosticsAdmin from '@/components/admin/diagnostics-admin';
import VideosAdmin from '@/components/admin/videos-admin';
import RemindersAdmin from '@/components/admin/reminders-admin';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('vehicles');

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-btn-blue" />
                <div>
                  <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-muted-foreground mt-1">Manage database content</p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="border-border text-foreground hover:bg-muted"
              >
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to App
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-8">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Content Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6 bg-muted mb-8">
                  <TabsTrigger value="vehicles" className="text-xs md:text-sm">
                    Vehicles
                  </TabsTrigger>
                  <TabsTrigger value="parts" className="text-xs md:text-sm">
                    Parts
                  </TabsTrigger>
                  <TabsTrigger value="inspection" className="text-xs md:text-sm">
                    Inspections
                  </TabsTrigger>
                  <TabsTrigger value="diagnostics" className="text-xs md:text-sm">
                    Diagnostics
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="text-xs md:text-sm">
                    Videos
                  </TabsTrigger>
                  <TabsTrigger value="reminders" className="text-xs md:text-sm">
                    Reminders
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="vehicles">
                  <VehiclesAdmin />
                </TabsContent>

                <TabsContent value="parts">
                  <PartsAdmin />
                </TabsContent>

                <TabsContent value="inspection">
                  <InspectionAdmin />
                </TabsContent>

                <TabsContent value="diagnostics">
                  <DiagnosticsAdmin />
                </TabsContent>

                <TabsContent value="videos">
                  <VideosAdmin />
                </TabsContent>

                <TabsContent value="reminders">
                  <RemindersAdmin />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

