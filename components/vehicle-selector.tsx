'use client';

import { useVehicle } from '@/lib/vehicle-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export default function VehicleSelector() {
  const { selectedVehicle, vehicles, setSelectedVehicle } = useVehicle();

  return (
    <div className="space-y-3">
      <div className="flex gap-2 md:gap-4 items-end">
        <div className="flex-1 min-w-0">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Select Vehicle
          </label>
          <Select
            value={selectedVehicle?.id || ''}
            onValueChange={(value) => {
              const vehicle = vehicles.find((v) => v.id === value);
              if (vehicle) setSelectedVehicle(vehicle);
            }}
          >
            <SelectTrigger className="bg-muted border-border text-white h-11">
              <SelectValue placeholder="Choose a vehicle" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id} className="text-white">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedVehicle && (
          <div className="hidden md:flex flex-shrink-0">
            <Card className="bg-card border-border px-4 py-2">
              <p className="text-xs text-muted-foreground">Last Recorded Mileage</p>
              <p className="text-lg font-bold text-white whitespace-nowrap">
                {selectedVehicle.current_mileage.toLocaleString()} km
              </p>
            </Card>
          </div>
        )}
      </div>

      {selectedVehicle && (
        <div className="md:hidden">
          <Card className="bg-card border-border px-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Last Recorded Mileage</p>
              <p className="text-base font-bold text-white whitespace-nowrap">
                {selectedVehicle.current_mileage.toLocaleString()} km
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
