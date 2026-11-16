import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { usePortal } from '../context/PortalContext';
import { auth } from '../services/googleWorkspace';
import {
  deletePrayerRequestInFirestore,
  sanitizeNewPrayerPayload,
  SubmitPrayerInput,
  submitPrayerRequestToFirestore,
  subscribePrayerRequests,
  testFirestoreConnection,
  updatePrayerRequestInFirestore,
} from '../services/prayerBoxService';
import { PrayerRequest, PrayerStatus } from '../types/church';

const MY_PRAYERS_STORAGE_KEY = 'gpi_getsemani_my_prayers_v1';

function loadMyLocalPrayers(): PrayerRequest[] {
  try {
    const raw = localStorage.getItem(MY_PRAYERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMyLocalPrayers(items: PrayerRequest[]) {
  try {
    localStorage.setItem(MY_PRAYERS_STORAGE_KEY, JSON.stringify(items.slice(0, 30)));
  } catch {
    // ignore quota errors
  }
}

export function usePrayerBox(enableAdminSubscription = false) {
  const { data, updateData, logActivity, currentUsername } = usePortal();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => auth.currentUser);
  const [cloudPrayers, setCloudPrayers] = useState<PrayerRequest[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [mySentPrayers, setMySentPrayers] = useState<PrayerRequest[]>(() => loadMyLocalPrayers());

  useEffect(() => {
    testFirestoreConnection();
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setCloudPrayers([]);
        setCloudError(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!enableAdminSubscription || !firebaseUser?.emailVerified) {
      return;
    }

    setIsLoadingCloud(true);
    setCloudError(null);

    const unsub = subscribePrayerRequests(
      (items) => {
        setCloudPrayers(items);
        setIsLoadingCloud(false);
        setCloudError(null);

        // Cache cloud items into portal state so offline view & Google Sheets sync stay updated
        updateData((prev) => {
          const existingLocalOnly = (prev.prayerRequests || []).filter(
            (p) => p.source !== 'firestore' && !items.some((c) => c.id === p.id)
          );
          const merged = [...items, ...existingLocalOnly].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          if (JSON.stringify(prev.prayerRequests) === JSON.stringify(merged)) {
            return prev;
          }
          return {
            ...prev,
            prayerRequests: merged,
          };
        });
      },
      (err) => {
        setIsLoadingCloud(false);
        const msg = err.message || '';
        if (msg.includes('Missing or insufficient permissions') || msg.includes('permission-denied')) {
          setCloudError(
            `Akun Google (${firebaseUser.email}) belum terdaftar sebagai Majelis Admin di Firestore. Gunakan akun gpigetsemanisorong@gmail.com.`
          );
        } else if (msg.includes('Quota exceeded')) {
          setCloudError('Kuota harian Firestore tercapai. Menampilkan data lokal tersimpan.');
        } else {
          setCloudError('Gagal memuat Kotak Doa dari Firestore. Menampilkan data lokal.');
        }
      }
    );

    return () => unsub();
  }, [enableAdminSubscription, firebaseUser, updateData]);

  const allPrayers = useMemo(() => {
    const map = new Map<string, PrayerRequest>();
    for (const p of data.prayerRequests || []) {
      map.set(p.id, p);
    }
    for (const c of cloudPrayers) {
      map.set(c.id, c);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [cloudPrayers, data.prayerRequests]);

  const submitPrayer = useCallback(
    async (
      input: SubmitPrayerInput
    ): Promise<{ prayer: PrayerRequest; savedToCloud: boolean; warning?: string }> => {
      const sanitized = sanitizeNewPrayerPayload(input);
      let prayer: PrayerRequest;
      let savedToCloud = false;
      let warning: string | undefined;

      try {
        prayer = await submitPrayerRequestToFirestore(sanitized);
        savedToCloud = true;
      } catch (err) {
        const nowIso = new Date().toISOString();
        prayer = {
          id: `doa-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ...sanitized,
          status: 'Menunggu',
          adminNote: '',
          handledBy: '',
          createdAt: nowIso,
          updatedAt: nowIso,
          source: 'local',
        };
        warning =
          err instanceof Error && err.message.includes('Quota exceeded')
            ? 'Kuota Firestore harian penuh; doa disimpan di perangkat.'
            : 'Koneksi cloud tidak tersedia; doa tersimpan di perangkat ini.';
      }

      updateData((prev) => ({
        ...prev,
        prayerRequests: [prayer, ...(prev.prayerRequests || [])],
      }));

      setMySentPrayers((prev) => {
        const next = [prayer, ...prev].slice(0, 30);
        saveMyLocalPrayers(next);
        return next;
      });

      logActivity({
        category: 'Kotak Doa',
        action: 'Kirim Permohonan Doa',
        detail: `${prayer.isAnonymous ? 'Anonim' : prayer.requesterName} (${prayer.category} · ${prayer.unit})`,
        actorOverride: prayer.isAnonymous ? 'Anonim' : prayer.requesterName,
        roleOverride: 'jemaat',
      });

      return { prayer, savedToCloud, warning };
    },
    [logActivity, updateData]
  );

  const updatePrayerStatusAndNote = useCallback(
    async (
      prayer: PrayerRequest,
      patch: { status: PrayerStatus; adminNote: string }
    ): Promise<{ syncedToCloud: boolean; errorMsg?: string }> => {
      const handler =
        firebaseUser?.displayName ||
        firebaseUser?.email ||
        currentUsername ||
        'Majelis Jemaat';
      const nowIso = new Date().toISOString();
      let syncedToCloud = false;
      let errorMsg: string | undefined;

      if (prayer.source === 'firestore' || firebaseUser?.emailVerified) {
        try {
          await updatePrayerRequestInFirestore(prayer.id, {
            status: patch.status,
            adminNote: patch.adminNote,
            handledBy: handler,
          });
          syncedToCloud = true;
        } catch (err) {
          errorMsg =
            err instanceof Error && err.message.includes('permission')
              ? 'Akun Google belum memiliki izin admin Firestore.'
              : 'Pembaruan disimpan lokal; gagal mengirim ke Firestore.';
        }
      }

      updateData((prev) => ({
        ...prev,
        prayerRequests: (prev.prayerRequests || []).map((item) =>
          item.id === prayer.id
            ? {
                ...item,
                status: patch.status,
                adminNote: patch.adminNote.trim(),
                handledBy: handler,
                updatedAt: nowIso,
              }
            : item
        ),
      }));

      logActivity({
        category: 'Kotak Doa',
        action: `Perbarui Status Doa (${patch.status})`,
        detail: `${prayer.requesterName} (${prayer.category})${patch.adminNote.trim() ? ` — Catatan: ${patch.adminNote.trim()}` : ''}`,
      });

      return { syncedToCloud, errorMsg };
    },
    [currentUsername, firebaseUser, logActivity, updateData]
  );

  const deletePrayer = useCallback(
    async (prayer: PrayerRequest): Promise<{ syncedToCloud: boolean }> => {
      let syncedToCloud = false;
      if (prayer.source === 'firestore' || firebaseUser?.emailVerified) {
        try {
          await deletePrayerRequestInFirestore(prayer.id);
          syncedToCloud = true;
        } catch {
          // fall back to local deletion
        }
      }

      updateData((prev) => ({
        ...prev,
        prayerRequests: (prev.prayerRequests || []).filter((item) => item.id !== prayer.id),
      }));

      logActivity({
        category: 'Kotak Doa',
        action: 'Hapus Permohonan Doa',
        detail: `${prayer.requesterName} (${prayer.category}) dihapus dari Kotak Doa.`,
      });

      return { syncedToCloud };
    },
    [firebaseUser, logActivity, updateData]
  );

  return {
    firebaseUser,
    isFirebaseReadyForAdmin: Boolean(firebaseUser?.emailVerified),
    isLoadingCloud,
    cloudError,
    cloudCount: cloudPrayers.length,
    allPrayers,
    mySentPrayers,
    submitPrayer,
    updatePrayerStatusAndNote,
    deletePrayer,
  };
}
