export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  transmission: string;
  current_mileage: number;
  notes: string;
  image_url: string;
  purchase_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Part {
  id: string;
  vehicle_id: string;
  name: string;
  specifications: string;
  supplier_name: string;
  purchase_link: string;
  price_eur: number;
  compatibility_notes: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionTemplate {
  id: string;
  vehicle_id: string;
  title: string;
  description: string;
  category: string;
  is_priority: boolean;
  specifications: string;
  created_at: string;
}

export interface ServiceHistory {
  id: string;
  vehicle_id: string;
  service_type: string;
  service_date: string;
  mileage_at_service: number;
  mechanic_name: string;
  notes: string;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceSessionItem {
  id: string;
  service_id: string;
  inspection_template_id?: string;
  part_id?: string;
  item_type: string;
  quantity: number;
  notes: string;
  created_at: string;
}

export interface DiagnosticProcedure {
  id: string;
  vehicle_id: string;
  title: string;
  system: string;
  description: string;
  steps: string;
  warnings: string;
  related_part_ids: string[];
  created_at: string;
}

export interface VideoLibrary {
  id: string;
  title: string;
  category: string;
  vehicle_id?: string;
  youtube_link: string;
  description: string;
  difficulty_level: string;
  created_at: string;
}

export interface ServiceReminder {
  id: string;
  vehicle_id: string;
  service_type: string;
  mileage_interval: number;
  last_service_mileage: number;
  time_interval_months: number | null;
  created_at: string;
  updated_at: string;
}
