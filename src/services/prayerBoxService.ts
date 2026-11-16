import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './googleWorkspace';
import { PrayerCategory, PrayerRequest, PrayerStatus } from '../types/church';

export const PRAYER_CATEGORIES: PrayerCategory[] = [
  'Kesembuhan',
  'Keluarga & Rumah Tangga',
  'Pekerjaan & Usaha',
  'Pendidikan & Masa Depan',
  'Ucapan Syukur',
  'Pelayanan & Gereja',
  'Lainnya',
];

export const PRAYER_STATUSES: PrayerStatus[] = ['Menunggu', 'Didoakan', 'Selesai'];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let connectionTested = false;

export async function testFirestoreConnection(): Promise<void> {
  if (connectionTested) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export interface SubmitPrayerInput {
  requesterName: string;
  isAnonymous: boolean;
  phone?: string;
  category: PrayerCategory;
  unit: string;
  prayerText: string;
}

const VALID_CATEGORY_SET = new Set<string>(PRAYER_CATEGORIES);
const VALID_STATUS_SET = new Set<string>(PRAYER_STATUSES);

function sanitizeId(rawId: string): string {
  const clean = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  return clean.slice(0, 128) || `doa-${Date.now()}`;
}

export function sanitizeNewPrayerPayload(input: SubmitPrayerInput) {
  const isAnonymous = Boolean(input.isAnonymous);
  const rawName = isAnonymous ? 'Anonim' : input.requesterName.trim() || 'Warga Jemaat';
  const requesterName = rawName.slice(0, 100);
  const phone = (input.phone || '').trim().slice(0, 30);
  const category: PrayerCategory = VALID_CATEGORY_SET.has(input.category)
    ? input.category
    : 'Lainnya';
  const unit = (input.unit || 'Umum').trim().slice(0, 80);
  const prayerText = input.prayerText.trim().slice(0, 1500);

  if (prayerText.length < 5) {
    throw new Error('Isi permohonan doa minimal 5 karakter.');
  }

  return {
    requesterName,
    isAnonymous,
    phone,
    category,
    unit,
    prayerText,
  };
}

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export async function submitPrayerRequestToFirestore(
  input: SubmitPrayerInput
): Promise<PrayerRequest> {
  const sanitized = sanitizeNewPrayerPayload(input);
  const id = sanitizeId(`doa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const path = `prayerRequests/${id}`;
  const nowIso = new Date().toISOString();

  try {
    await setDoc(doc(db, 'prayerRequests', id), {
      ...sanitized,
      status: 'Menunggu' as PrayerStatus,
      adminNote: '',
      handledBy: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return {
    id,
    ...sanitized,
    status: 'Menunggu',
    adminNote: '',
    handledBy: '',
    createdAt: nowIso,
    updatedAt: nowIso,
    source: 'firestore',
  };
}

export function subscribePrayerRequests(
  onData: (items: PrayerRequest[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'prayerRequests';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: PrayerRequest[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          requesterName: String(d.requesterName || 'Warga Jemaat'),
          isAnonymous: Boolean(d.isAnonymous),
          phone: String(d.phone || ''),
          category: VALID_CATEGORY_SET.has(String(d.category))
            ? (d.category as PrayerCategory)
            : 'Lainnya',
          unit: String(d.unit || ''),
          prayerText: String(d.prayerText || ''),
          status: VALID_STATUS_SET.has(String(d.status))
            ? (d.status as PrayerStatus)
            : 'Menunggu',
          adminNote: String(d.adminNote || ''),
          handledBy: String(d.handledBy || ''),
          createdAt: toIsoString(d.createdAt),
          updatedAt: toIsoString(d.updatedAt),
          source: 'firestore',
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function updatePrayerRequestInFirestore(
  id: string,
  patch: {
    status: PrayerStatus;
    adminNote: string;
    handledBy: string;
  }
): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `prayerRequests/${safeId}`;
  const status: PrayerStatus = VALID_STATUS_SET.has(patch.status)
    ? patch.status
    : 'Didoakan';
  const adminNote = patch.adminNote.trim().slice(0, 600);
  const handledBy = patch.handledBy.trim().slice(0, 100);

  try {
    await updateDoc(doc(db, 'prayerRequests', safeId), {
      status,
      adminNote,
      handledBy,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePrayerRequestInFirestore(id: string): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `prayerRequests/${safeId}`;
  try {
    await deleteDoc(doc(db, 'prayerRequests', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
