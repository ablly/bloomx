import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    query,
    where,
    orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SellerApplication {
    id: string;
    uid: string;
    name: string;
    email: string;
    provider: 'openai' | 'anthropic' | 'google' | 'mixed';
    capacity: number;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by: string | null;
    reviewed_at: Date | null;
    createdAt: Date;
}

export interface CreateSellerApplicationInput {
    uid: string;
    name: string;
    email: string;
    provider: 'openai' | 'anthropic' | 'google' | 'mixed';
    capacity: number;
}

// ─── Create Seller Application ──────────────────────────────────
export async function createSellerApplication(
    input: CreateSellerApplicationInput
): Promise<SellerApplication> {
    const colRef = collection(db, 'seller_applications');
    
    const docRef = await addDoc(colRef, {
        uid: input.uid,
        name: input.name,
        email: input.email,
        provider: input.provider,
        capacity: input.capacity,
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        createdAt: serverTimestamp(),
    });

    return {
        id: docRef.id,
        uid: input.uid,
        name: input.name,
        email: input.email,
        provider: input.provider,
        capacity: input.capacity,
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        createdAt: new Date(),
    };
}

// ─── Get User's Applications ────────────────────────────────────
export async function getUserApplications(uid: string): Promise<SellerApplication[]> {
    const colRef = collection(db, 'seller_applications');
    const q = query(colRef, where('uid', '==', uid), orderBy('createdAt', 'desc'));
    
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            uid: data.uid,
            name: data.name,
            email: data.email,
            provider: data.provider,
            capacity: data.capacity,
            status: data.status,
            reviewed_by: data.reviewed_by,
            reviewed_at: data.reviewed_at?.toDate?.() ?? null,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
    });
}

// ─── Get Application by ID ──────────────────────────────────────
export async function getApplicationById(appId: string): Promise<SellerApplication | null> {
    const docRef = doc(db, 'seller_applications', appId);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) return null;
    
    const data = snap.data();
    return {
        id: snap.id,
        uid: data.uid,
        name: data.name,
        email: data.email,
        provider: data.provider,
        capacity: data.capacity,
        status: data.status,
        reviewed_by: data.reviewed_by,
        reviewed_at: data.reviewed_at?.toDate?.() ?? null,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
    };
}

// ─── Update Application Status (Admin only) ─────────────────────
export async function updateApplicationStatus(
    appId: string,
    status: 'approved' | 'rejected',
    reviewedBy: string
): Promise<void> {
    const docRef = doc(db, 'seller_applications', appId);
    await updateDoc(docRef, {
        status,
        reviewed_by: reviewedBy,
        reviewed_at: serverTimestamp(),
    });
}
