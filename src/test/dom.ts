/** jsdom gaps the components lean on: matchMedia and layout (`offsetParent`). */
export function stubBrowserApis(): void {
  window.matchMedia = ((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  // jsdom has no layout, so `offsetParent` is always null — which the focus trap reads as "hidden".
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', { configurable: true, get() { return this.parentNode; } });
}
