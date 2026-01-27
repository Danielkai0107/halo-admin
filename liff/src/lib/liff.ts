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
    console.log('Initializing LIFF with ID:', liffId);
    console.log('Current URL:', window.location.href);
    
    await liff.init({ liffId });
    console.log('LIFF initialized successfully');
    console.log('Is logged in:', liff.isLoggedIn());
    console.log('Is in client:', liff.isInClient());
    console.log('OS:', liff.getOS());
    console.log('Language:', liff.getLanguage());
    console.log('LIFF Version:', liff.getVersion());
    
    // 如果未登入，進行登入
    if (!liff.isLoggedIn()) {
      console.log('User not logged in, redirecting to LINE login...');
      console.log('Login redirect URL will be:', window.location.href);
      
      // 設定登入後的返回 URL
      liff.login({
        redirectUri: window.location.href
      });
      
      // 注意：login() 會導致頁面重定向，後面的代碼不會執行
      return;
    }
    
    console.log('User is already logged in');
  } catch (error: any) {
    console.error('LIFF initialization failed:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
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
