/** Single funnel for diagnostics, so a reporting hook (e.g. Sentry) can be added in one place. */
export const logWarn = (msg: string, ...detail: unknown[]): void => console.warn(msg, ...detail);
export const logError = (msg: string, ...detail: unknown[]): void => console.error(msg, ...detail);
