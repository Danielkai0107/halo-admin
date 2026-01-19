import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  type DocumentData,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  Query,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PaginatedResponse } from '../types';

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

// 獲取所有文檔（帶分頁）
export const getDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  pageSize: number = 10,
  lastDoc?: DocumentSnapshot
): Promise<{ data: T[]; lastDoc?: DocumentSnapshot }> => {
  let q: Query = collection(db, collectionName);
  
  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }
  
  q = query(q, limit(pageSize));
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const querySnapshot = await getDocs(q);
  const data = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
  
  const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
  
  return { data, lastDoc: lastVisible };
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

// 計數查詢（簡化版本 - 實際應用中可能需要使用聚合查詢或維護計數器）
export const countDocuments = async (
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<number> => {
  const docs = await getAllDocuments(collectionName, constraints);
  return docs.length;
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

// 訂閱文檔變更（即時監聽）
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

// 分頁輔助函數 - 將結果轉換為 PaginatedResponse 格式
export const toPaginatedResponse = <T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): PaginatedResponse<T> => {
  return {
    data,
    meta: {
      total,
      page,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

// 查詢輔助函數
export const buildQuery = (
  collectionName: string,
  filters: { field: string; operator: any; value: any }[] = [],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'asc',
  limitCount?: number
): Query => {
  let q: Query = collection(db, collectionName);
  const constraints: QueryConstraint[] = [];
  
  // 添加 where 條件
  filters.forEach(filter => {
    if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
      constraints.push(where(filter.field, filter.operator, filter.value));
    }
  });
  
  // 添加排序
  if (orderByField) {
    constraints.push(orderBy(orderByField, orderDirection));
  }
  
  // 添加限制
  if (limitCount) {
    constraints.push(limit(limitCount));
  }
  
  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }
  
  return q;
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

// 將 Firestore 文檔轉換為應用格式（處理 Timestamp）
export const convertFirestoreDoc = <T>(doc: DocumentData): T => {
  const data = { ...doc };
  
  // 轉換所有 Timestamp 字段
  Object.keys(data).forEach(key => {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  });
  
  return data as T;
};
