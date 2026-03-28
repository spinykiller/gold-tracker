import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getAppName, DEFAULT_APP_NAME } from '../lib/db';

export function useAppName() {
  const [appName, setAppNameState] = useState(DEFAULT_APP_NAME);

  const setting = useLiveQuery(
    () => db.settings.get('appName'),
    []
  );

  useEffect(() => {
    if (setting?.value) {
      setAppNameState(setting.value);
    } else {
      setAppNameState(DEFAULT_APP_NAME);
    }
  }, [setting]);

  return appName;
}