import "server-only";

const required = (name: string): string => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing server environment variable: ${name}`);
  }
  return value;
};

export type ServerEnv = {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly ADMIN_PASSWORD_HASH: string;
  readonly ADMIN_SESSION_SECRET: string;
};

export function getDatabaseEnv(): Pick<ServerEnv, "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"> {
  return {
    SUPABASE_URL: required("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

// Read lazily so builds and the public shell do not require provisioned services.
// Call only from server code; never serialize the result into client props.
export function getServerEnv(): ServerEnv {
  return {
    ...getDatabaseEnv(),
    ADMIN_PASSWORD_HASH: required("ADMIN_PASSWORD_HASH"),
    ADMIN_SESSION_SECRET: required("ADMIN_SESSION_SECRET"),
  };
}
