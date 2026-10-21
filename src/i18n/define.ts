/** One domain's strings. `en` must carry exactly the keys of `es` — a missing or extra key is a type error. */
export function defineStrings<const ES extends Record<string, string>>(es: ES, en: { [K in keyof ES]: string }) {
  return { es, en };
}
