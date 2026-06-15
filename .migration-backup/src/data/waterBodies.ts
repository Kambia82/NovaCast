export interface WaterBodyTag {
  label: string;
  color: 'green' | 'orange' | 'red' | 'blue';
}

export interface WaterBody {
  key: string;
  name: string;
  location: string;
  region: string;
  type: string;
  species: string[];
  tags: WaterBodyTag[];
  latitude?: number;
  longitude?: number;
  spots?: Spot[];
  specialRegs?: string;
}

export interface Spot {
  name: string;
  detail: string;
  shallow?: boolean;
  deep?: boolean;
  always?: boolean;
}

export const REGION_LABELS: Record<string, string> = {
  fenton: 'Fenton / South',
  westcounty: 'West County',
  southcounty: 'South County / Hwy 30',
  jeffco: 'Jefferson Co.',
  stcharles: 'St. Charles Co.',
  i70: 'I-70 / Hwy 70 Belt',
  rivers: 'Rivers',
  springfield: 'Springfield / Joplin',
  stockton: 'Stockton / Neosho',
  custom: 'Other',
};

export const TYPE_LABELS: Record<string, string> = {
  pond: 'Small Pond',
  lake: 'Lake',
  river: 'River / Creek',
  reservoir: 'Reservoir',
};
