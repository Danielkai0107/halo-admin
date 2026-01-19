import liff from '@line/liff';

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  email?: string;
}

// 初始化 LIFF
export const initLiff = async (liffId: string): Promise<void> => {
  try {
    await liff.init({ liffId });
    
    // 如果未登入，進行登入
    if (!liff.isLoggedIn()) {
      liff.login();
    }
  } catch (error) {
    console.error('LIFF initialization failed:', error);
    throw error;
  }
};

// 獲取用戶資料
export const getProfile = async (): Promise<LiffProfile> => {
  try {
    const profile = await liff.getProfile();
    const idToken = liff.getDecodedIDToken();
    
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      email: idToken?.email,
    };
  } catch (error) {
    console.error('Failed to get profile:', error);
    throw error;
  }
};

// 登出
export const logout = (): void => {
  if (liff.isLoggedIn()) {
    liff.logout();
    window.location.reload();
  }
};

// 檢查是否在 LINE 應用程式中
export const isInClient = (): boolean => {
  return liff.isInClient();
};

// 關閉 LIFF 視窗
export const closeWindow = (): void => {
  if (liff.isInClient()) {
    liff.closeWindow();
  }
};

// 發送訊息到聊天室（僅在 LINE 應用中）
export const sendMessages = async (messages: any[]): Promise<void> => {
  if (liff.isInClient()) {
    await liff.sendMessages(messages);
  }
};

export default liff;
