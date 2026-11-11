type Meta = Record<string, unknown>;

function emit(level: "info" | "warn" | "error", message: string, meta?: Meta) {
  const line = JSON.stringify({ level, message, ...meta, ts: new Date().toISOString() });
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}

export const logger = {
  info: (m: string, meta?: Meta) => emit("info", m, meta),
  warn: (m: string, meta?: Meta) => emit("warn", m, meta),
  error: (m: string, meta?: Meta) => emit("error", m, meta),
};

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
