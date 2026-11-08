export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
}

const SENSITIVE_KEY =
  /(password|passwd|secret|token|authorization|cookie|connection|database_url|redis_url|connectionstring)/i;

function redact(fields?: Record<string, unknown>): Record<string, unknown> {
  if (fields === undefined) {
    return {};
  }
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    output[key] = SENSITIVE_KEY.test(key) ? "[REDACTED]" : value;
  }
  return output;
}

function write(
  level: LogLevel,
  service: string,
  message: string,
  fields?: Record<string, unknown>
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...redact(fields)
  };
  process.stdout.write(`${JSON.stringify(entry)}\n`);
}

export function createLogger(service: string): Logger {
  return {
    debug: (message, fields) => write("debug", service, message, fields),
    info: (message, fields) => write("info", service, message, fields),
    warn: (message, fields) => write("warn", service, message, fields),
    error: (message, fields) => write("error", service, message, fields)
  };
}
