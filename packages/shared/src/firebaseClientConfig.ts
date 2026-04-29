type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
};

type EnvSource = Record<string, string | undefined>;

function readEnvValue(
  env: EnvSource,
  keys: readonly string[],
  label: string
): string {
  for (const key of keys) {
    const value = env[key];
    if (value && value.trim().length > 0) return value;
  }
  throw new Error(`Firebase設定が不足しています: ${label}`);
}

export function resolveFirebaseClientConfig(env: EnvSource): FirebaseClientConfig {
  return {
    apiKey: readEnvValue(
      env,
      ["NEXT_PUBLIC_FIREBASE_API_KEY", "EXPO_PUBLIC_FIREBASE_API_KEY"],
      "apiKey"
    ),
    authDomain: readEnvValue(
      env,
      ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"],
      "authDomain"
    ),
    projectId: readEnvValue(
      env,
      ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", "EXPO_PUBLIC_FIREBASE_PROJECT_ID"],
      "projectId"
    ),
    storageBucket: readEnvValue(
      env,
      ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"],
      "storageBucket"
    ),
  };
}
