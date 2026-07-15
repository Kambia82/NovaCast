// This is the application's data-access API. Components import only from
// here, never from Firestore (or any future backend) directly — this barrel
// is the seam that keeps the backend an implementation detail.
export { fetchWaterBodies } from './waters';
export type { WaterBodyRecord } from './waters';

export { fetchAdminLakes, deleteAdminLake } from './admin';
export type { AdminLakeRecord } from './admin';

export { fetchCustomLakes } from './customLakes';
export type { CustomLakeRecord } from './customLakes';
