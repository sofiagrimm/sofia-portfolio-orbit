// Serves the site behind a password. Visitors without the password only see an
// "under construction" page. No dependencies, just Node's built-ins.
//
// The password itself is never stored here, only its SHA-256 hash. To change it,
// set SITE_PASSWORD_SHA256 in Railway's variables (or replace the hash below).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const PASS_HASH = (process.env.SITE_PASSWORD_SHA256 ||
  '0129ebd36a54347011b5ef7521e5e55402331f7c0048e4f3efe7631761385f38').toLowerCase();
// the cookie proves you knew the password without containing it
const TOKEN = crypto.createHash('sha256').update(PASS_HASH + ':sg-site-session').digest('hex');
const COOKIE = 'sg_site';
const BLOCKED = new Set(['server.js', 'package.json', 'package-lock.json']);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.md': 'text/plain; charset=utf-8',
  '.heic': 'image/heic', '.txt': 'text/plain; charset=utf-8'
};

const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const safeEqual = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}

function gatePage(wrong) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>under construction | Sofia Grimm</title><meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&family=Courier+Prime&family=DM+Serif+Display:ital@1&display=swap">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  body{display:grid;place-items:center;padding:24px;color:#2b2620;font-family:'Courier Prime',monospace;
    background:radial-gradient(1px 1px at 12% 18%,#fff9 50%,transparent 51%),radial-gradient(1px 1px at 78% 12%,#fff8 50%,transparent 51%),
      radial-gradient(1.5px 1.5px at 33% 70%,#fff7 50%,transparent 51%),radial-gradient(1px 1px at 88% 60%,#fff8 50%,transparent 51%),
      radial-gradient(1px 1px at 60% 40%,#fff6 50%,transparent 51%),linear-gradient(180deg,#0a1530,#163566 70%,#1b4a6e)}
  .note{width:min(440px,100%);background:#f4efe1;padding:34px 30px 30px;transform:rotate(-1.5deg);box-shadow:0 24px 50px rgba(0,0,0,.5);position:relative;
    background-image:repeating-linear-gradient(to bottom,transparent 0 27px,#cdd6e6 27px 28px);background-position:0 70px}
  .note::before{content:"";position:absolute;top:-14px;left:50%;width:110px;height:28px;margin-left:-55px;background:rgba(236,226,198,.75);transform:rotate(-3deg)}
  h1{font-family:'DM Serif Display',Georgia,serif;font-style:italic;font-weight:400;font-size:40px;line-height:1;color:#24306b}
  p{font-family:'Nanum Pen Script',cursive;font-size:26px;line-height:28px;color:#24306b;margin-top:14px}
  form{margin-top:22px;display:flex;gap:8px;flex-wrap:wrap}
  input{flex:1;min-width:0;font:15px 'Courier Prime',monospace;padding:10px 12px;border:1px solid #b9b2a2;background:#fffdf7;border-radius:4px}
  button{font:15px 'Courier Prime',monospace;padding:10px 16px;border:0;border-radius:4px;background:#24306b;color:#fff;cursor:pointer}
  input:focus-visible,button:focus-visible{outline:3px solid #9cc0ff;outline-offset:2px}
  .wrong{font-family:'Courier Prime',monospace;font-size:13px;color:#a1243a;margin-top:10px;line-height:1.4}
  .sig{text-align:right;margin-top:18px}
</style></head><body>
<main class="note">
  <h1>under construction</h1>
  <p>sofia's site is getting a few finishing touches. check back soon!</p>
  <form method="post" action="/__login">
    <label for="pw" style="position:absolute;left:-9999px">password</label>
    <input id="pw" name="password" type="password" autocomplete="current-password" placeholder="password" required autofocus>
    <button type="submit">let me in</button>
  </form>
  ${wrong ? '<p class="wrong" role="alert">that\'s not quite it. try again?</p>' : ''}
  <p class="sig">sofia</p>
</main></body></html>`;
}

function send(res, code, body, headers = {}) {
  res.writeHead(code, Object.assign({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }, headers));
  res.end(body);
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');

  if (url.pathname === '/__login' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 4096) req.destroy(); });
    req.on('end', () => {
      const pw = new URLSearchParams(body).get('password') || '';
      if (safeEqual(sha256(pw), PASS_HASH)) {
        send(res, 303, '', { Location: '/', 'Set-Cookie': `${COOKIE}=${TOKEN}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}` });
      } else send(res, 401, gatePage(true), { 'Content-Type': 'text/html; charset=utf-8' });
    });
    return;
  }

  const ok = safeEqual(cookies(req)[COOKIE] || '', TOKEN);
  if (!ok) return send(res, 401, gatePage(false), { 'Content-Type': 'text/html; charset=utf-8' });

  // serve the site
  let p = decodeURIComponent(url.pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT) || BLOCKED.has(path.basename(file)) || path.basename(file).startsWith('.')) return send(res, 404, 'not found');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'not found', { 'Content-Type': 'text/plain' });
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'private, max-age=300', 'X-Robots-Tag': 'noindex' });
    fs.createReadStream(file).pipe(res);
  });
}).listen(PORT, () => console.log('listening on ' + PORT));
