import { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import {
  getAppVersionInfo,
  fetchServerAppInfo,
  subscribeToVersionChanges,
  AppVersionInfo,
} from '../utils/appVersion';

export function useAppVersion(userSettings?: UserSettings): AppVersionInfo {
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo>(() =>
    getAppVersionInfo(userSettings)
  );

  useEffect(() => {
    // Initial fetch from server
    fetchServerAppInfo().then((info) => {
      setVersionInfo(info);
    });

    // Listen to changes (e.g. from Settings or another component)
    const unsubscribe = subscribeToVersionChanges(() => {
      setVersionInfo(getAppVersionInfo(userSettings));
    });

    return () => {
      unsubscribe();
    };
  }, [userSettings]);

  return versionInfo;
}
