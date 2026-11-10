export type NodeEnv = "development" | "test" | "production";

export interface AppEnv {
  readonly nodeEnv: NodeEnv;
  readonly host: string;
  readonly port: number;
  readonly webOrigin: string;
  readonly databaseUrl: string | undefined;
  readonly redisUrl: string | undefined;
}

function parseNodeEnv(value: string | undefined): NodeEnv {
  if (value === "production" || value === "test" || value === "development") {
    return value;
  }
  return "development";
}

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return 4000;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid PORT value: "${value}"`);
  }
  return parsed;
}

function parseWebOrigin(value: string | undefined): string {
  const origin = value ?? "http://localhost:3000";
  try {
    const parsed = new URL(origin);
    if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || parsed.origin !== origin) {
      throw new Error();
    }
    return origin;
  } catch {
    throw new Error("WEB_ORIGIN must be a canonical http(s) origin without a path");
  }
}

export function loadEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
  return {
    nodeEnv: parseNodeEnv(env.NODE_ENV),
    host: env.HOST ?? "127.0.0.1",
    port: parsePort(env.PORT),
    webOrigin: parseWebOrigin(env.WEB_ORIGIN),
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL
  };
}
