import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const authCookie = req.cookies.get('ca_auth')?.value

  if (authCookie === 'granted') {
    return NextResponse.next()
  }

  // API routes return 401
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Serve login page for all other routes
  return new NextResponse(loginHTML(), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

export const config = {
  matcher: ['/', '/api/chat/:path*'],
}

function loginHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Carousel Agent</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#050505; color:#F5F5F5; font-family:'Inter',sans-serif; height:100vh; display:flex; align-items:center; justify-content:center; }
.card { width:360px; padding:40px; background:#0C0C0C; border:1px solid #1E1E1E; border-radius:16px; }
.logo { font-family:'JetBrains Mono',monospace; font-size:16px; font-weight:700; margin-bottom:8px; }
.logo span { color:#FF4800; }
.sub { font-size:13px; color:#555; margin-bottom:32px; }
label { display:block; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700; color:#A0A0A0; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:8px; }
input { width:100%; padding:12px 16px; background:#141414; border:1px solid #1E1E1E; border-radius:8px; color:#F5F5F5; font-size:14px; outline:none; margin-bottom:16px; }
input:focus { border-color:#FF4800; }
button { width:100%; padding:12px; background:#FF4800; border:none; border-radius:8px; color:#fff; font-size:14px; font-weight:700; cursor:pointer; }
button:hover { background:#FF5E1A; }
.err { font-size:12px; color:#cc3333; margin-bottom:12px; display:none; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">carousel<span>.agent</span></div>
  <div class="sub">Ingresa la clave de acceso</div>
  <label>Password</label>
  <input type="password" id="pw" placeholder="Clave de acceso" autofocus />
  <div class="err" id="err">Clave incorrecta</div>
  <button onclick="login()">Entrar</button>
</div>
<script>
async function login() {
  const pw = document.getElementById('pw').value;
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pw }),
  });
  if (res.ok) {
    window.location.reload();
  } else {
    document.getElementById('err').style.display = 'block';
  }
}
document.getElementById('pw').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
</script>
</body>
</html>`
}
