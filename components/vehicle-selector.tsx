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
        <label className="text-sm font-medium text-slate-300 mb-2 block">
          Select Vehicle
        </label>
        <Select
          value={selectedVehicle?.id || ''}
          onValueChange={(value) => {
            const vehicle = vehicles.find((v) => v.id === value);
            if (vehicle) setSelectedVehicle(vehicle);
          }}
        >
          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
            <SelectValue placeholder="Choose a vehicle" />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id} className="text-white">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedVehicle && (
        <Card className="bg-slate-700 border-slate-600 px-4 py-2 min-w-max">
          <p className="text-xs text-slate-400">Current Mileage</p>
          <p className="text-lg font-bold text-white">{selectedVehicle.current_mileage.toLocaleString()} km</p>
        </Card>
      )}
    </div>
  );
}
