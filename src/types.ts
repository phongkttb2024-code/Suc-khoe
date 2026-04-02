export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: string | null;
  blood_type: string | null;
  height: number | null;
  weight: number | null;
  updated_at: string;
}

export interface HealthRecord {
  id: string;
  user_id: string;
  date: string;
  diagnosis: string;
  notes: string | null;
  doctor: string | null;
  prescription_url: string | null;
  created_at: string;
}

export interface HealthStats {
  heart_rate: number;
  blood_pressure: string;
  sleep_hours: number;
  steps: number;
}
