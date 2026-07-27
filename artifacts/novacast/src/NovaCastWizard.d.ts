// NovaCastWizard.jsx is still plain JS (see TECH_DEBT.md) — this ambient
// declaration gives its one call site in App.tsx a typed boundary without
// requiring a full .jsx -> .tsx conversion, which is a larger, separately
// tracked piece of work (ROADMAP.md).
import type { WaterBodyRecord, CustomLakeRecord, AdminLakeRecord } from './services/database';

export interface NovaCastWizardWizardState {
  loc: string | null;
  locName: string | null;
  locLat: number | null;
  locLon: number | null;
  time: string | null;
  sky: string | null;
  water: string | null;
  temp: string | null;
  wind: string | null;
  pressure: string | null;
  fish: string | null;
  reel: string | null;
  recentWeather: string[];
}

export interface NovaCastWizardProps {
  onComplete: (state: NovaCastWizardWizardState) => void;
  waterBodies: WaterBodyRecord[];
  customLakes: CustomLakeRecord[];
  adminLakes: AdminLakeRecord[];
}

declare const NovaCastWizard: (props: NovaCastWizardProps) => JSX.Element;
export default NovaCastWizard;
