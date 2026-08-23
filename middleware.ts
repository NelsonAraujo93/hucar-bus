// Phase 1 / T1 spike.
//
// Purpose: prove that Vercel Routing Middleware actually executes for this
// project, which produces a pure static Angular output with no framework
// server. Everything from T5 onward (Accept-Language negotiation, cookie
// override, the language switcher) depends on this working.
//
// This file is deliberately trivial and throwaway. If the spike passes it is
// replaced by real negotiation logic; if it fails we fall back to vercel.json
// redirects with `has` conditions on the accept-language header.
//
// Note: /es/ does not exist yet -- @angular/localize has not been configured.
// A 404 after the redirect is expected and fine. The only question this spike
// answers is whether the 307 fires at the edge at all.

export const config = {
  matcher: '/',
};

export default function middleware(request: Request): Response {
  return Response.redirect(new URL('/es/', request.url), 307);
}
