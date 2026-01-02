'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Vehicle } from './types';
import { supabase } from './supabase-client';

interface VehicleContextType {
  selectedVehicle: Vehicle | null;
  vehicles: Vehicle[];
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  loadVehicles: () => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => Promise<Vehicle | null>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  loading: boolean;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVehicles(data || []);

      if (data && data.length > 0) {
        const saved = localStorage.getItem('selectedVehicleId');
        const vehicleToSelect = saved
          ? data.find((v) => v.id === saved) || data[0]
          : data[0];
        setSelectedVehicle(vehicleToSelect);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async (
    vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Vehicle | null> => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicle])
        .select()
        .single();

      if (error) throw error;

      setVehicles([data, ...vehicles]);
      setSelectedVehicle(data);
      localStorage.setItem('selectedVehicleId', data.id);
      return data;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      return null;
    }
  };

  const updateVehicle = async (
    id: string,
    updates: Partial<Vehicle>
  ): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setVehicles(vehicles.map((v) => (v.id === id ? data : v)));
      if (selectedVehicle?.id === id) {
        setSelectedVehicle(data);
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
    }
  };

  const deleteVehicle = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);

      if (error) throw error;

      const filtered = vehicles.filter((v) => v.id !== id);
      setVehicles(filtered);

      if (selectedVehicle?.id === id) {
        setSelectedVehicle(filtered.length > 0 ? filtered[0] : null);
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const handleSetSelectedVehicle = (vehicle: Vehicle | null) => {
    setSelectedVehicle(vehicle);
    if (vehicle) {
      localStorage.setItem('selectedVehicleId', vehicle.id);
    } else {
      localStorage.removeItem('selectedVehicleId');
    }
  };

  return (
    <VehicleContext.Provider
      value={{
        selectedVehicle,
        vehicles,
        setSelectedVehicle: handleSetSelectedVehicle,
        loadVehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        loading,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicle must be used within VehicleProvider');
  }
  return context;
}
