import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  QueryConstraint,
  type DocumentData,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  Query,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * 通用的 CRUD 操作工具函數
 */

// 獲取單個文檔
export const getDocument = async <T>(collectionName: string, id: string): Promise<T | null> => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
};

// 獲取所有文檔（不分頁）
export const getAllDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  let q: Query = collection(db, collectionName);
  
  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
};

// 新增文檔
export const createDocument = async <T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> => {
  const docData = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, collectionName), docData);
  return docRef.id;
};

// 更新文檔
export const updateDocument = async <T extends Partial<DocumentData>>(
  collectionName: string,
  id: string,
  data: T
): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// 刪除文檔
export const deleteDocument = async (collectionName: string, id: string): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};

// 訂閱集合變更（即時監聽）
export const subscribeToCollection = <T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  callback: (data: T[]) => void
) => {
  let q: Query = collection(db, collectionName);
  
  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
    callback(data);
  });
};

// 訂閱單個文檔變更
export const subscribeToDocument = <T>(
  collectionName: string,
  id: string,
  callback: (data: T | null) => void
) => {
  const docRef = doc(db, collectionName, id);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as T);
    } else {
      callback(null);
    }
  });
};

// Timestamp 轉換輔助函數
export const timestampToString = (timestamp: any): string | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};
