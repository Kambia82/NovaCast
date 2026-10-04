// Ambient types for the untyped NovaCastWizard.jsx component so the strict
// workspace typecheck can resolve `import NovaCastWizard from './NovaCastWizard'`
// without an implicit-any error. Keep this in sync with the props the wizard
// actually reads (see NovaCastWizard.jsx).
import type { ComponentType } from 'react';
import type { WaterBodyRecord, AdminLakeRecord, CustomLakeRecord } from './services/database';

export interface WizardCompletionState {
  fish: string | null;
  reel: string | null;
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
  recentWeather: string[];
}

export interface NovaCastWizardProps {
  onComplete: (state: WizardCompletionState) => void;
  waterBodies?: WaterBodyRecord[];
  customLakes?: CustomLakeRecord[];
  adminLakes?: AdminLakeRecord[];
}

declare const NovaCastWizard: ComponentType<NovaCastWizardProps>;
export default NovaCastWizard;
