import { useState, useEffect } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface UseCurrentLocationResult {
  location: Location | null;
  error: string | null;
  isLoading: boolean;
}

export const useCurrentLocation = (): UseCurrentLocationResult => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('此裝置不支援定位功能');
      setIsLoading(false);
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setError(null);
      setIsLoading(false);
      console.log('已取得當前位置:', position.coords.latitude, position.coords.longitude);
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMessage = '無法取得位置';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = '使用者拒絕定位請求';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = '位置資訊無法取得';
          break;
        case error.TIMEOUT:
          errorMessage = '定位請求逾時';
          break;
      }
      
      console.error('定位錯誤:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    };

    // 獲取當前位置
    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }, []);

  return { location, error, isLoading };
};
