import { getDocs, type DocumentData, type Query } from 'firebase/firestore';

// Firestore denies writes (and, for customLakes, unauthenticated reads) on
// some collections for now (see firestore.rules) — treat permission-denied
// as an empty list, not a crash.
export async function safeGetDocs(q: Query<DocumentData>) {
  try {
    return await getDocs(q);
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'permission-denied') {
      return null;
    }
    throw err;
  }
}
