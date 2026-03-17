// Shim for node-fetch and cross-fetch — use the global fetch on Cloudflare Workers
const _fetch = globalThis.fetch;
export default _fetch;
export { _fetch as fetch };
export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;
