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
    <div className="flex gap-4 items-end flex-col md:flex-row">
      <div className="flex-1 w-full">
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
          <SelectTrigger className="bg-muted border-border text-white">
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
        <Card className="bg-card border-border px-4 py-2 min-w-max">
          <p className="text-xs text-muted-foreground">Current Mileage</p>
          <p className="text-lg font-bold text-white">{selectedVehicle.current_mileage.toLocaleString()} km</p>
        </Card>
      )}
    </div>
  );
}
