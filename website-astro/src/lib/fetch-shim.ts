// Shim for node-fetch — use the global fetch on Cloudflare Workers
export default globalThis.fetch;
export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;
