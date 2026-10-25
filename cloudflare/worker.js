// Cloudflare entry. The Worker is stateless: static files come from the assets binding, everything else goes to ONE Durable Object
// that holds the database (SQLite) and runs the same app.js as the local server. Files go to R2, timers become a cron trigger.
import { DurableObject } from 'cloudflare:workers';
import { PDFDocument, registerStdFonts } from 'pdfkit';
import Helvetica from 'pdfkit/standard-fonts/Helvetica';
import HelveticaBold from 'pdfkit/standard-fonts/HelveticaBold';
import HelveticaOblique from 'pdfkit/standard-fonts/HelveticaOblique';
import { toBytes } from 'pdfkit/output';
import RT from '../core/runtime.js';
import makeDriver from '../core/driver-do.js';
import makeR2 from '../core/storage-r2.js';
registerStdFonts(Helvetica, HelveticaBold, HelveticaOblique);

const SEC = { 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'same-origin', 'Permissions-Policy': 'camera=(self), geolocation=(self), microphone=()',
  'Content-Security-Policy': "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'", 'Strict-Transport-Security': 'max-age=15552000' };
const same = async (a, b) => { const h = async s => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)))); const [x, y] = [await h(a), await h(b)]; let d = 0; for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i]; return d === 0 };
const unb = v => (v && typeof v === 'object' && v.$b !== undefined) ? Uint8Array.from(atob(v.$b), c => c.charCodeAt(0)).buffer : v;

export class SchoolDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ready = ctx.blockConcurrencyWhile(async () => {
      for (const [k, v] of Object.entries(env)) if (typeof v === 'string') process.env[k] = v;   // secrets and vars, as on the Node server
      const G = globalThis;
      if (G.__school) { G.__school.driver.rebind(ctx); }   // the isolate outlived the previous object: keep the loaded app, point it at the new storage context
      else {
        const driver = makeDriver(ctx);
        RT.driver = driver; RT.storage = makeR2(env.FILES); RT.timers = false; RT.pdfkit = { PDFDocument, toBytes }; RT.env = env;
        const { default: app } = await import('../app.js');
        app.readStatic = async rel => {
          let p = String(rel).split('?')[0]; if (!p.startsWith('/')) p = '/' + p; if (p === '/') p = '/index.html';
          const r = await G.__school.env.ASSETS.fetch('https://assets.invalid' + p); if (!r.ok) return null;
          return { body: Buffer.from(await r.arrayBuffer()), type: r.headers.get('content-type'), mtime: null };
        };
        G.__school = { app, driver, env, jobs: (await import('../core/jobs.js')).default };
      }
      this.db = G.__school.driver; this.app = G.__school.app; this.jobs = G.__school.jobs;
    });
  }
  async fetch(request) { await this.ready; const ip = request.headers.get('x-client-ip') || ''; return this.app.fetch(request, { ip, secure: true }); }
  // point-in-time recovery: 30 days, whole database. Returns the bookmark that undoes the restore. Not available in local dev.
  async restoreTo(at, bookmark) {
    await this.ready; const st = this.ctx.storage;
    if (typeof st.getBookmarkForTime !== 'function') return { error: 'unsupported' };
    try {
      let bm = bookmark; if (!bm) { const t = Date.parse(at); if (!(t > Date.now() - 30 * 864e5 + 6e4 && t <= Date.now())) return { error: 'time must be within the last 30 days' }; bm = await st.getBookmarkForTime(t); }
      const undo = await st.onNextSessionRestoreBookmark(bm); return { ok: 1, restored_to: bm, undo };
    } catch (e) { return { error: String(e.message || e) }; }
  }
  async restartNow() { this.ctx.abort('restore'); }
  async usage(reset) { await this.ready; const st = this.db.stats, out = { ...st, db_bytes: this.db.size() }; if (reset) { st.read = 0; st.written = 0; st.statements = 0; } return out; }
  async cron() { await this.ready; return this.jobs.runDue(); }
  // moving data in from a local database (cloudflare/move-data.js): one table chunk per call, all inside a transaction
  async importChunk(c) {
    await this.ready; const db = this.db;
    if (c.reset) db.exec('PRAGMA defer_foreign_keys=ON'), this.ctx.storage.transactionSync(() => { for (const t of c.reset) db.exec('DELETE FROM "' + t + '"'); });
    if (c.table) this.ctx.storage.transactionSync(() => {
      db.exec('PRAGMA defer_foreign_keys=ON');
      const q = 'INSERT OR REPLACE INTO "' + c.table + '"(' + c.cols.map(x => '"' + x + '"').join(',') + ') VALUES(' + c.cols.map(() => '?').join(',') + ')', st = db.prepare(q);
      for (const r of c.rows) st.run(...r.map(unb));
    });
    return { ok: 1, n: c.rows ? c.rows.length : 0 };
  }
  async tables() { await this.ready; return this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all().map(r => r.name); }
}

const stub = env => env.SCHOOLS.get(env.SCHOOLS.idFromName('main'));
export default {
  async fetch(request, env) {
    const u = new URL(request.url), p = u.pathname;
    if (p.startsWith('/__admin/')) {   // data move-in, protected by the ADMIN_KEY secret
      if (!env.ADMIN_KEY || request.method !== 'POST' || !(await same(request.headers.get('x-admin-key') || '', env.ADMIN_KEY))) return new Response('Not found', { status: 404 });
      const s = stub(env);
      if (p === '/__admin/put') {   // exam PDFs moved in from the local exams-data folder
        const key = u.searchParams.get('key') || '';
        if (!/^exams\/\d+\/\d+\.pdf$/.test(key)) return Response.json({ error: 'bad key' }, { status: 400 });
        await env.FILES.put(key, await request.arrayBuffer()); return Response.json({ ok: 1 });
      }
      const body = await request.json();
      if (p === '/__admin/tables') return Response.json(await s.tables());
      if (p === '/__admin/restore') {   // roll the whole database back to a moment within the last 30 days (see CLOUDFLARE.md)
        const r = await s.restoreTo(body.at || null, body.bookmark || null);
        if (r.error) return Response.json(r, { status: 400 });
        try { await s.restartNow(); } catch (e) { /* the object resets itself to finish the restore: an error here is expected */ }
        return Response.json(r);
      }
      if (p === '/__admin/stats') return Response.json(await s.usage(body.reset));   // rows read/written since the object started (what Cloudflare bills)
      if (p === '/__admin/cron') return Response.json(await s.cron());   // run the due jobs now (same as the scheduled trigger)
      if (p === '/__admin/import') return Response.json(await s.importChunk(body));
      return new Response('Not found', { status: 404 });
    }
    if (/^(GET|HEAD)$/.test(request.method) && !p.startsWith('/api/')) {   // an exact static file wins, as with express.static
      const r = await env.ASSETS.fetch(new Request(new URL(p === '/' ? '/index.html' : p, u), request));
      if (r.status !== 404) { const h = new Headers(r.headers); for (const k in SEC) h.set(k, SEC[k]); return new Response(r.body, { status: r.status, headers: h }); }
    }
    const h = new Headers(request.headers); h.set('x-client-ip', request.headers.get('cf-connecting-ip') || '');
    return stub(env).fetch(new Request(request, { headers: h }));
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(stub(env).cron()); },
};
