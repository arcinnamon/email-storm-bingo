import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing server environment variable: ${name}`);
  }
  return value;
}

// Read lazily so builds and the public shell do not require provisioned services.
// Call only from server code; never serialize the result into client props.
export function getServerEnv() {
  return {
    SUPABASE_URL: required("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),
    ADMIN_PASSWORD_HASH: required("ADMIN_PASSWORD_HASH"),
    ADMIN_SESSION_SECRET: required("ADMIN_SESSION_SECRET"),
  };
}
