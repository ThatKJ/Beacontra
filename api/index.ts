import app from '../src/index';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request, env?: any, ctx?: any) {
  const url = new URL(req.url);
  const matchedPath = req.headers.get('x-matched-path');
  let requestToFetch = req;

  if (matchedPath && matchedPath !== url.pathname && (matchedPath.startsWith('/api') || matchedPath === '/health')) {
    const parsed = new URL(matchedPath, url.origin);
    url.pathname = parsed.pathname;
    if (parsed.search && !url.search) {
      url.search = parsed.search;
    }
    requestToFetch = new Request(url.toString(), req);
  }

  const mergedEnv = {
    ...(typeof process !== 'undefined' ? process.env : {}),
    ...(env || {}),
  };

  return app.fetch(requestToFetch, mergedEnv, ctx);
}

