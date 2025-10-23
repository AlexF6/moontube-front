export type Plan = {
  id: string;
  name: string;
  price: string | number;
  max_profiles: number;
  max_devices: number;
  video_quality: string;
  created_at: string;
  updated_at: string;
};