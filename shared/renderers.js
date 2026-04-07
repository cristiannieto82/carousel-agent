import { ICONS } from './icons.js'

/* ── Helper: accent color → rgba with alpha ── */
function accentRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export const EXPORT_FORMATS = {
  instagram:  { label: 'Instagram',       w: 1080, h: 1350, icon: '📸' },
  tiktok:     { label: 'TikTok / Reels',  w: 1080, h: 1920, icon: '🎵' },
  linkedin:   { label: 'LinkedIn',         w: 1200, h: 1200, icon: '💼' },
  twitter:    { label: 'Twitter / X',      w: 1200, h: 675,  icon: '𝕏' },
  story:      { label: 'Story (9:16)',     w: 1080, h: 1920, icon: '📱' },
}

/* ── Slide CSS — parametrized by brand ── */
function slideCSS(b, dims) {
  const W = dims?.w || 1080
  const H = dims?.h || 1350
  const S = W / 1080 // scale factor for typography
  const ag = (a) => accentRGBA(b.accent, a)
  const ah = (a) => accentRGBA(b.accentHover, a)
  const fonts = [b.titleFont, b.bodyFont, b.monoFont].filter((v, i, a) => a.indexOf(v) === i)
  const googleFonts = fonts.filter(f => f !== 'Friends')
  const fontImport = googleFonts.map(f => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800;900`).join('&')
  const friendsFace = fonts.includes('Friends') ? `
    @font-face { font-family: 'Friends'; src: url('/fonts/Friends-Regular.ttf') format('truetype'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Friends'; src: url('/fonts/Friends-SemiBold.ttf') format('truetype'); font-weight: 600; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Friends'; src: url('/fonts/Friends-Black.ttf') format('truetype'); font-weight: 900; font-style: normal; font-display: swap; }
  ` : ''

  return `
  ${googleFonts.length ? `@import url('https://fonts.googleapis.com/css2?${fontImport}&display=swap');` : ''}
  ${friendsFace}
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${W}px; height: ${H}px;
    background: radial-gradient(ellipse 140% 55% at 50% 0%, ${b.bgGradientStart} 0%, ${b.bg} 55%);
    font-family: '${b.bodyFont}', system-ui, sans-serif; color: ${b.text}; overflow: hidden; position: relative;
  }
  .slide {
    width: 100%; height: 100%; padding: 80px 72px;
    display: flex; flex-direction: column; justify-content: center;
    position: relative; overflow: hidden;
  }
  .slide.centered { align-items: center; text-align: center; }
  .slide::before {
    content: ''; position: absolute; top: -18%; left: 50%; transform: translateX(-50%);
    width: 920px; height: 740px;
    background: radial-gradient(ellipse at center, ${ag(0.22)} 0%, ${ag(0.08)} 45%, transparent 70%);
    pointer-events: none; z-index: 0;
  }
  .glow-bottom::before { top: auto; bottom: -18%; }
  .glow-center::before {
    top: 50%; transform: translate(-50%, -50%);
    width: 980px; height: 980px;
    background: radial-gradient(ellipse at center, ${ag(0.20)} 0%, ${ag(0.07)} 40%, transparent 65%);
  }
  /* Background styles */
  .bg-grid::after {
    content: ''; position: absolute; inset: 0;
    background-image: linear-gradient(${b.mode === 'dark' ? 'rgba(42,42,42,0.35)' : 'rgba(200,200,200,0.25)'} 1px, transparent 1px), linear-gradient(90deg, ${b.mode === 'dark' ? 'rgba(42,42,42,0.35)' : 'rgba(200,200,200,0.25)'} 1px, transparent 1px);
    background-size: 48px 48px; opacity: 0.55; pointer-events: none; z-index: 0;
  }
  .bg-dots::after {
    content: ''; position: absolute; inset: 0;
    background-image: radial-gradient(circle, ${b.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'} 1.5px, transparent 1.5px);
    background-size: 32px 32px; pointer-events: none; z-index: 0;
  }
  .bg-gradient::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 30%, ${ag(0.12)}, transparent 70%);
    pointer-events: none; z-index: 0;
  }
  .bg-lines::after {
    content: ''; position: absolute; inset: 0;
    background-image: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 28px,
      ${b.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} 28px,
      ${b.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} 29px
    );
    pointer-events: none; z-index: 0;
  }
  .bg-noise::after {
    content: ''; position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='${b.mode === 'dark' ? '0.06' : '0.04'}'/%3E%3C/svg%3E");
    background-size: 256px 256px;
    pointer-events: none; z-index: 0;
  }
  .bg-waves::after {
    content: ''; position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='1080' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 100 Q270 40 540 100 T1080 100' fill='none' stroke='${encodeURIComponent(b.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')}' stroke-width='2'/%3E%3C/svg%3E");
    background-size: 1080px 200px;
    background-position: center;
    pointer-events: none; z-index: 0;
  }
  .bg-none::after { display: none; }
  .grid-bg::after { /* alias for bg-grid */
    content: ''; position: absolute; inset: 0;
    background-image: linear-gradient(${b.mode === 'dark' ? 'rgba(42,42,42,0.35)' : 'rgba(200,200,200,0.25)'} 1px, transparent 1px), linear-gradient(90deg, ${b.mode === 'dark' ? 'rgba(42,42,42,0.35)' : 'rgba(200,200,200,0.25)'} 1px, transparent 1px);
    background-size: 48px 48px; opacity: 0.55; pointer-events: none; z-index: 0;
  }
  .slide > * { position: relative; z-index: 1; }

  /* Typography */
  .slide-num { font-family: '${b.monoFont}', monospace; font-size: 18px; font-weight: 500; color: ${b.accent}; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 24px; }
  h1 { font-family: '${b.titleFont}', sans-serif; font-size: 84px; font-weight: ${b.titleWeight}; line-height: 1.04; letter-spacing: -0.04em; color: ${b.text}; margin-bottom: 28px; text-shadow: 0 2px 24px rgba(0,0,0,0.6); }
  h1.sm { font-size: 70px; }
  .slide.centered h1 { font-size: 96px; }
  .slide.centered h1.sm { font-size: 70px; }
  .accent { color: ${b.accent}; }
  .hook-accent {
    font-size: 48px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2;
    background: linear-gradient(135deg, ${b.accent} 0%, ${b.accentHover} 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 40px ${ag(0.35)});
  }
  .body { font-size: 27px; font-weight: 400; line-height: 1.65; color: ${b.text2}; max-width: 90%; }
  .body b { color: ${b.text}; font-weight: 700; }
  .big-num {
    font-family: '${b.monoFont}', monospace; font-size: 154px; font-weight: 900;
    line-height: 1; margin-bottom: 20px; letter-spacing: -0.04em;
    background: linear-gradient(135deg, ${b.accent} 0%, ${ah(1)} 50%, ${b.accent} 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 60px ${ag(0.55)}) drop-shadow(0 0 120px ${ag(0.2)});
  }

  /* Badge */
  .badge {
    display: inline-flex; align-items: center; gap: 10px; padding: 12px 26px; border-radius: 100px;
    border: 1px solid ${ag(0.45)};
    background: linear-gradient(135deg, ${ag(0.10)} 0%, ${ag(0.04)} 100%);
    color: ${b.accent}; font-size: 20px; font-weight: 600; margin-bottom: 40px;
    box-shadow: 0 0 20px ${ag(0.08)}, inset 0 1px 0 rgba(255,255,255,0.06);
  }
  .badge .dot { width: 8px; height: 8px; border-radius: 50%; background: ${b.accent}; box-shadow: 0 0 8px ${ag(0.9)}, 0 0 20px ${ag(0.4)}; }
  @keyframes badge-pulse { 0%,100% { box-shadow: 0 0 8px ${ag(0.9)}, 0 0 20px ${ag(0.4)}; } 50% { box-shadow: 0 0 12px ${ag(1)}, 0 0 30px ${ag(0.6)}; } }
  .badge .dot { animation: badge-pulse 2s ease-in-out infinite; }

  /* Divider */
  .divider {
    width: 64px; height: 3px;
    background: linear-gradient(90deg, ${b.accent}, ${b.accentHover});
    border-radius: 2px; margin: 28px 0;
    box-shadow: 0 0 12px ${ag(0.65)}, 0 0 28px ${ag(0.2)};
  }

  /* Cards — Glassmorphism */
  .card {
    background: ${b.mode === 'dark' ? `linear-gradient(160deg, rgba(24,24,24,0.85) 0%, rgba(17,17,17,0.9) 100%)` : `linear-gradient(160deg, rgba(255,255,255,0.85) 0%, rgba(245,245,245,0.9) 100%)`};
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid ${b.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
    border-radius: 16px; padding: 36px 40px;
    box-shadow: ${b.mode === 'dark' ? '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.8)' : '0 1px 0 rgba(255,255,255,0.8) inset, 0 8px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)'};
  }
  .card.al {
    border-left: 3px solid ${b.accent};
    box-shadow: ${b.mode === 'dark' ? `0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.5), -4px 0 24px ${ag(0.12)} inset` : `0 1px 0 rgba(255,255,255,0.8) inset, 0 8px 32px rgba(0,0,0,0.08), -4px 0 24px ${ag(0.05)} inset`};
  }
  .card-label { font-family: '${b.monoFont}', monospace; font-size: 14px; font-weight: 700; color: ${b.accent}; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 20px; }

  /* List */
  .list { list-style: none; display: flex; flex-direction: column; gap: 20px; }
  .list li { display: flex; align-items: flex-start; gap: 16px; font-size: 26px; font-weight: 500; line-height: 1.4; color: ${b.text}; }
  .arr { color: ${b.accent}; font-weight: 700; flex-shrink: 0; text-shadow: 0 0 8px ${ag(0.4)}; }

  /* Comparison */
  .cmp { display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; align-items: center; margin-bottom: 40px; }
  .cmp-box { border-radius: 16px; padding: 36px 32px; text-align: center; box-shadow: 0 4px 28px rgba(0,0,0,${b.mode === 'dark' ? '0.55' : '0.1'}); }
  .cmp-box.bef { background: ${b.mode === 'dark' ? 'linear-gradient(160deg, #160A0A 0%, #0D0505 100%)' : 'linear-gradient(160deg, #FAF0F0 0%, #F5EAEA 100%)'}; border: 1px solid ${b.mode === 'dark' ? '#2A1212' : '#E0C0C0'}; }
  .cmp-box.aft { background: ${b.mode === 'dark' ? `linear-gradient(160deg, #0A100A 0%, #060A04 100%)` : `linear-gradient(160deg, #F0FAF0 0%, #EAF5EA 100%)`}; border: 1px solid ${ag(0.28)}; box-shadow: 0 4px 28px rgba(0,0,0,${b.mode === 'dark' ? '0.55' : '0.1'}), 0 0 40px ${ag(0.06)}; }
  .cmp-lbl { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 14px; }
  .bef .cmp-lbl { color: ${b.mode === 'dark' ? '#663333' : '#CC6666'}; } .aft .cmp-lbl { color: ${b.accent}; }
  .cmp-amt { font-family: '${b.monoFont}', monospace; font-size: 70px; font-weight: 900; line-height: 1; margin-bottom: 10px; }
  .bef .cmp-amt { color: ${b.mode === 'dark' ? '#664444' : '#BB8888'}; } .aft .cmp-amt { color: ${b.accent}; text-shadow: 0 0 30px ${ag(0.45)}; }
  .cmp-per { font-size: 20px; font-weight: 500; color: ${b.text2}; margin-bottom: 8px; }
  .cmp-sub { font-size: 18px; color: ${b.muted}; } .aft .cmp-sub { color: ${b.text2}; }
  .arrow-col { display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .arrow-sym { font-size: 40px; color: ${b.accent}; text-shadow: 0 0 16px ${ag(0.55)}; }
  .tbadge { font-family: '${b.monoFont}', monospace; font-size: 14px; font-weight: 600; color: ${b.accent}; background: ${ag(0.08)}; border: 1px solid ${ag(0.25)}; border-radius: 6px; padding: 4px 10px; }

  /* CTA */
  .brand { font-size: 28px; font-weight: 900; letter-spacing: 0.02em; margin-bottom: 36px; }
  .brand .w { color: ${b.text}; } .brand .o { color: ${b.accent}; text-shadow: 0 0 20px ${ag(0.4)}; }
  .cta-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 12px; padding: 28px 64px;
    background: linear-gradient(135deg, ${b.accent} 0%, ${b.accentHover} 100%);
    color: #fff; font-size: 28px; font-weight: 800; border-radius: 14px; margin: 32px 0;
    box-shadow: 0 8px 40px ${ag(0.50)}, 0 2px 10px ${ag(0.3)}, inset 0 1px 0 rgba(255,255,255,0.22);
    position: relative; overflow: hidden;
  }
  .cta-btn::after {
    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%);
    transform: rotate(25deg);
  }

  /* Quote / Testimonial */
  .quote-text {
    font-family: '${b.titleFont}', sans-serif; font-size: 52px; font-weight: ${b.titleWeight}; line-height: 1.2;
    color: ${b.text}; margin-bottom: 40px; position: relative; padding-left: 0;
    text-shadow: 0 2px 24px rgba(0,0,0,0.4);
  }
  .quote-mark {
    font-size: 160px; color: ${b.accent}; opacity: 0.15; font-family: Georgia, serif;
    position: absolute; top: -60px; left: -10px; line-height: 1; pointer-events: none;
  }
  .quote-author { display: flex; align-items: center; gap: 20px; }
  .quote-avatar {
    width: 64px; height: 64px; border-radius: 50%; object-fit: cover;
    border: 3px solid ${ag(0.4)}; box-shadow: 0 0 20px ${ag(0.2)};
  }
  .quote-avatar-placeholder {
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(135deg, ${ag(0.3)}, ${ag(0.1)});
    border: 2px solid ${ag(0.3)};
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 800; color: ${b.accent};
  }
  .quote-name { font-size: 24px; font-weight: 700; color: ${b.text}; }
  .quote-role { font-size: 18px; color: ${b.text2}; margin-top: 4px; }

  /* Timeline */
  .tl { display: flex; flex-direction: column; gap: 0; margin-top: 32px; position: relative; }
  .tl::before {
    content: ''; position: absolute; left: 15px; top: 12px; bottom: 12px; width: 3px;
    background: linear-gradient(to bottom, ${b.accent}, ${ag(0.2)});
    border-radius: 2px;
  }
  .tl-step { display: flex; gap: 24px; align-items: flex-start; padding: 16px 0; position: relative; }
  .tl-dot {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    background: ${b.mode === 'dark' ? '#111' : '#f5f5f5'}; border: 3px solid ${b.accent};
    display: flex; align-items: center; justify-content: center;
    font-family: '${b.monoFont}', monospace; font-size: 12px; font-weight: 800; color: ${b.accent};
    box-shadow: 0 0 16px ${ag(0.3)};
    z-index: 1;
  }
  .tl-content { flex: 1; padding-top: 2px; }
  .tl-label { font-family: '${b.monoFont}', monospace; font-size: 15px; font-weight: 700; color: ${b.accent}; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px; }
  .tl-text { font-size: 24px; font-weight: 500; color: ${b.text}; line-height: 1.4; }

  /* Pricing */
  .pricing-grid { display: flex; gap: 20px; margin-top: 32px; }
  .pricing-card {
    flex: 1; border-radius: 16px; padding: 36px 28px; text-align: center;
    background: ${b.mode === 'dark' ? 'linear-gradient(160deg, rgba(24,24,24,0.85) 0%, rgba(17,17,17,0.9) 100%)' : 'linear-gradient(160deg, rgba(255,255,255,0.85) 0%, rgba(245,245,245,0.9) 100%)'};
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border: 1px solid ${b.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
    box-shadow: 0 4px 24px rgba(0,0,0,${b.mode === 'dark' ? '0.4' : '0.08'});
  }
  .pricing-card.hl {
    border: 2px solid ${b.accent};
    background: ${b.mode === 'dark' ? `linear-gradient(160deg, rgba(26,16,8,0.9) 0%, rgba(17,17,17,0.95) 100%)` : `linear-gradient(160deg, rgba(255,248,240,0.9) 0%, rgba(255,255,255,0.95) 100%)`};
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 4px 24px rgba(0,0,0,${b.mode === 'dark' ? '0.4' : '0.08'}), 0 0 40px ${ag(0.15)};
    transform: scale(1.04);
  }
  .pricing-name { font-family: '${b.monoFont}', monospace; font-size: 16px; font-weight: 700; color: ${b.accent}; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 16px; }
  .pricing-price { font-family: '${b.monoFont}', monospace; font-size: 56px; font-weight: 900; color: ${b.text}; line-height: 1; }
  .pricing-card.hl .pricing-price { color: ${b.accent}; text-shadow: 0 0 30px ${ag(0.3)}; }
  .pricing-period { font-size: 18px; color: ${b.text2}; margin-bottom: 20px; }
  .pricing-features { list-style: none; text-align: left; display: flex; flex-direction: column; gap: 10px; }
  .pricing-features li { font-size: 18px; color: ${b.text2}; display: flex; align-items: center; gap: 10px; }
  .pricing-features li::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: ${b.accent}; flex-shrink: 0; }
  .pricing-card.hl .pricing-features li { color: ${b.text}; }

  /* Footer — handle + progress bar */
  .handle { position: absolute; bottom: 44px; left: 72px; font-size: 18px; font-weight: 500; color: ${b.muted}; letter-spacing: 0.02em; }
  .handle span { color: ${b.accent}; text-shadow: 0 0 10px ${ag(0.45)}; }
  .progress { position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 72px 24px; display: flex; align-items: center; gap: 12px; z-index: 10; }
  .progress-track { flex: 1; height: 3px; border-radius: 2px; overflow: hidden; background: ${b.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}; }
  .progress-fill { height: 100%; border-radius: 2px; background: ${b.mode === 'dark' ? '#fff' : b.accent}; transition: width 0.3s; }
  .progress-label { font-family: '${b.monoFont}', monospace; font-size: 14px; font-weight: 500; color: ${b.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}; min-width: 32px; text-align: right; }

  /* Swipe arrow */
  .swipe-arrow { position: absolute; right: 0; top: 0; bottom: 0; width: 56px; z-index: 9; display: flex; align-items: center; justify-content: center; background: linear-gradient(to right, transparent, ${b.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}); }
  .swipe-arrow svg { opacity: ${b.mode === 'dark' ? '0.35' : '0.25'}; }
`
}

/* ── Custom images ── */
function customImagesHTML(images) {
  if (!images?.length) return ''
  return images.map(img =>
    `<img src="${img.src}" alt="" style="position:absolute;left:${img.x ?? 0}px;top:${img.y ?? 0}px;width:${img.width ?? 200}px;height:${img.height ?? 200}px;opacity:${(img.opacity ?? 100) / 100};object-fit:contain;pointer-events:none;z-index:${img.layer === 'back' ? '0' : '2'};" />`
  ).join('')
}

/* ── Deco icon ── */
function decoIconHTML(key, position, opacity, accentHex) {
  if (!key || !ICONS[key]) return ''
  const pos = {
    'top-right':    'top:40px;right:40px;',
    'top-left':     'top:40px;left:40px;',
    'bottom-right': 'bottom:40px;right:40px;',
    'bottom-left':  'bottom:40px;left:40px;',
  }[position] || 'bottom:40px;right:40px;'
  const op = opacity != null && opacity !== '' ? Number(opacity) / 100 : 0.08
  const hex = accentHex || '#FF4800'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 24 24" fill="none" stroke="rgba(${r},${g},${b},${op})" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;${pos}pointer-events:none;z-index:0;">${ICONS[key]}</svg>`
}

/* ── Brand icon rendering ── */
function brandIconHTML(brandIcon, brand) {
  if (!brandIcon) return ''
  // New format: object with { slug, svg, color }
  if (typeof brandIcon === 'object' && brandIcon.svg) {
    const isDark = brand?.mode !== 'light'
    const overlay = isDark ? '255,255,255' : '0,0,0'
    return `<div style="width:88px;height:88px;background:rgba(${overlay},0.06);border-radius:20px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:28px;box-shadow:0 0 0 1px rgba(${overlay},0.08)"><img src="${brandIcon.svg}" width="60" height="60" style="object-fit:contain" /></div>`
  }
  return ''
}

export function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function bgOverrideCSS(override, brand) {
  if (!override || override === brand.mode) return ''
  const isDark = override === 'dark'
  const ag = (a) => accentRGBA(brand.accent, a)
  if (isDark) {
    return `<style>
      body { background: radial-gradient(ellipse 140% 55% at 50% 0%, #0E0E0E 0%, #050505 55%) !important; color: #F5F5F5 !important; }
      h1 { color: #F5F5F5 !important; }
      .body { color: #A0A0A0 !important; }
      .body b { color: #F5F5F5 !important; }
      .list li { color: #F5F5F5 !important; }
      .handle { color: #555 !important; }
      .progress-track { background: rgba(255,255,255,0.12) !important; }
      .progress-fill { background: #fff !important; }
      .progress-label { color: rgba(255,255,255,0.4) !important; }
      .swipe-arrow { background: linear-gradient(to right, transparent, rgba(255,255,255,0.04)) !important; }
      .swipe-arrow svg path { stroke: #fff !important; }
      .card { background: linear-gradient(160deg, #181818 0%, #111111 100%) !important; border-color: rgba(255,255,255,0.06) !important; }
      .grid-bg::after { background-image: linear-gradient(rgba(42,42,42,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(42,42,42,0.35) 1px, transparent 1px) !important; }
      .cmp-per { color: #A0A0A0 !important; }
      .cmp-sub { color: #555 !important; }
      .cmp-box.bef { background: linear-gradient(160deg, #160A0A 0%, #0D0505 100%) !important; border-color: #2A1212 !important; }
      .cmp-box.aft { background: linear-gradient(160deg, #0A100A 0%, #060A04 100%) !important; border-color: ${ag(0.28)} !important; }
      .bef .cmp-lbl { color: #663333 !important; }
      .bef .cmp-amt { color: #664444 !important; }
    </style>`
  }
  // light override
  return `<style>
    body { background: radial-gradient(ellipse 140% 55% at 50% 0%, #F5F5F7 0%, #FFFFFF 55%) !important; color: #1D1D1F !important; }
    h1 { color: #1D1D1F !important; }
    .body { color: #86868B !important; }
    .body b { color: #1D1D1F !important; }
    .list li { color: #1D1D1F !important; }
    .handle { color: #D2D2D7 !important; }
    .progress-track { background: rgba(0,0,0,0.08) !important; }
    .progress-fill { background: ${brand.accent} !important; }
    .progress-label { color: rgba(0,0,0,0.3) !important; }
    .swipe-arrow { background: linear-gradient(to right, transparent, rgba(0,0,0,0.03)) !important; }
    .swipe-arrow svg path { stroke: #000 !important; }
    .card { background: linear-gradient(160deg, #FAFAFA 0%, #F0F0F0 100%) !important; border-color: rgba(0,0,0,0.08) !important; }
    .grid-bg::after { background-image: linear-gradient(rgba(200,200,200,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(200,200,200,0.25) 1px, transparent 1px) !important; }
    .cmp-per { color: #86868B !important; }
    .cmp-sub { color: #D2D2D7 !important; }
    .cmp-box.bef { background: linear-gradient(160deg, #FAF0F0 0%, #F5EAEA 100%) !important; border-color: #E0C0C0 !important; }
    .cmp-box.aft { background: linear-gradient(160deg, #F0FAF0 0%, #EAF5EA 100%) !important; border-color: ${ag(0.28)} !important; }
    .bef .cmp-lbl { color: #CC6666 !important; }
    .bef .cmp-amt { color: #BB8888 !important; }
  </style>`
}

function wrap(content, cls, idx, total, brand, bgOvr, dims, bgStyle) {
  const W = dims?.w || 1080
  const pct = total > 0 ? ((idx + 1) / total) * 100 : 100
  const isLast = idx >= total - 1
  const effectiveMode = bgOvr && bgOvr !== '' ? bgOvr : brand.mode
  const css = slideCSS(brand, dims)
  const overrideStyle = bgOverrideCSS(bgOvr, brand)
  const bgClass = bgStyle ? `bg-${bgStyle}` : 'bg-grid'
  const progressBar = `<div class="progress"><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><span class="progress-label">${idx + 1}/${total}</span></div>`
  const swipeArrow = isLast ? '' : `<div class="swipe-arrow"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="${effectiveMode === 'dark' ? '#fff' : '#000'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=${W}"><style>${css}</style>${overrideStyle}</head><body><div class="slide ${bgClass} ${cls}">${content}<div class="handle"><span>@</span>${esc(brand.handle)}</div>${progressBar}${swipeArrow}</div></body></html>`
}

function renderHook(f, i, t, b, d) {
  return wrap(`
    <div class="badge"><span class="dot"></span>${esc(f.badge)}</div>
    <h1>${esc(f.title)}</h1>
    ${f.accentLine ? `<p class="hook-accent">${esc(f.accentLine)}</p>` : ''}
    ${f.body ? `<p class="body" style="margin-top:28px">${esc(f.body)}</p>` : ''}
    ${decoIconHTML(f.icon, f.iconPos, f.iconOpacity, b.accent)}
    ${customImagesHTML(f.images)}
  `, 'centered', i, t, b, f.bgOverride, d, f.bgStyle)
}

function renderContent(f, i, t, b, d) {
  const icon = brandIconHTML(f.brandIcon, b)
  return wrap(`
    <span class="slide-num">${esc(f.slideNumber)} — ${esc(f.label)}</span>
    ${icon}
    <h1>${esc(f.title)}</h1>
    ${f.showDivider ? '<div class="divider"></div>' : ''}
    ${f.body ? `<p class="body">${esc(f.body)}</p>` : ''}
    ${decoIconHTML(f.icon, f.iconPos, f.iconOpacity, b.accent)}
    ${customImagesHTML(f.images)}
  `, '', i, t, b, f.bgOverride, d, f.bgStyle)
}

function renderBigNumber(f, i, t, b, d) {
  return wrap(`
    <div class="big-num">${esc(f.number)}</div>
    <h1 class="sm">${esc(f.title)}</h1>
    ${f.body ? `<div class="divider"></div><p class="body">${esc(f.body)}</p>` : ''}
    ${decoIconHTML(f.icon, f.iconPos, f.iconOpacity, b.accent)}
    ${customImagesHTML(f.images)}
  `, 'glow-bottom', i, t, b, f.bgOverride, d, f.bgStyle)
}

function renderList(f, i, t, b, d) {
  const items = (f.items || []).map(item =>
    `<li><span class="arr">→</span>${esc(item)}</li>`
  ).join('')
  return wrap(`
    <h1 class="sm" style="margin-bottom:36px">${esc(f.title)}</h1>
    <div class="card al">
      ${f.cardTitle ? `<div class="card-label">${esc(f.cardTitle)}</div>` : ''}
      <ul class="list">${items}</ul>
    </div>
    ${decoIconHTML(f.icon, f.iconPos, f.iconOpacity, b.accent)}
    ${customImagesHTML(f.images)}
  `, '', i, t, b, f.bgOverride, d, f.bgStyle)
}

function renderBeforeAfter(f, i, t, b, d) {
  return wrap(`
    <div class="cmp">
      <div class="cmp-box bef">
        <div class="cmp-lbl">Antes</div>
        <div class="cmp-amt">${esc(f.beforeAmount)}</div>
        <div class="cmp-per">${esc(f.beforePeriod)}</div>
        <div class="cmp-sub">${esc(f.beforeLabel)}</div>
      </div>
      <div class="arrow-col">
        <span class="arrow-sym">→</span>
        ${f.timeBadge ? `<span class="tbadge">${esc(f.timeBadge)}</span>` : ''}
      </div>
      <div class="cmp-box aft">
        <div class="cmp-lbl">Despues</div>
        <div class="cmp-amt">${esc(f.afterAmount)}</div>
        <div class="cmp-per">${esc(f.afterPeriod)}</div>
        <div class="cmp-sub">${esc(f.afterLabel)}</div>
      </div>
    </div>
    ${f.body ? `<div class="divider"></div><p class="body">${esc(f.body)}</p>` : ''}
    ${decoIconHTML(f.icon, f.iconPos, f.iconOpacity, b.accent)}
    ${customImagesHTML(f.images)}
  `, '', i, t, b, f.bgOverride, d, f.bgStyle)
}

function renderCTA(f, i, t, b, d) {
  return wrap(`
    <div class="brand"><span class="w">${esc(f.brandWhite)} </span><span class="o">${esc(f.brandOrange)}</span></div>
    <h1 class="sm">${esc(f.title)}</h1>
    ${f.body ? `<p class="body">${esc(f.body)}</p>` : ''}
    <div class="cta-btn">${esc(f.buttonText)}</div>
    ${decoIconHTML(f.icon, f.iconPos, f.iconOpacity, b.accent)}
    ${customImagesHTML(f.images)}
  `, 'centered glow-center', i, t, b, f.bgOverride, d, f.bgStyle)
}

function renderQuote(f, i, t, b, d) {
  const initials = (f.author || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const avatarHTML = f.avatar
    ? `<img class="quote-avatar" src="${f.avatar}" alt="" />`
    : `<div class="quote-avatar-placeholder">${esc(initials)}</div>`
  return wrap(`
    <div style="position:relative">
      <span class="quote-mark">"</span>
      <div class="quote-text">"${esc(f.quote)}"</div>
    </div>
    <div class="quote-author">
      ${avatarHTML}
      <div>
        <div class="quote-name">${esc(f.author)}</div>
        ${f.role ? `<div class="quote-role">${esc(f.role)}</div>` : ''}
      </div>
    </div>
    ${decoIconHTML(f.icon, f.iconPos, f.iconOpacity, b.accent)}
    ${customImagesHTML(f.images)}
  `, 'glow-center', i, t, b, f.bgOverride, d, f.bgStyle)
}

function renderTimeline(f, i, t, b, d) {
  const steps = (f.steps || []).map((step, idx) => `
    <div class="tl-step">
      <div class="tl-dot">${idx + 1}</div>
      <div class="tl-content">
        <div class="tl-label">${esc(step.label)}</div>
        <div class="tl-text">${esc(step.text)}</div>
      </div>
    </div>
  `).join('')
  return wrap(`
    <h1 class="sm" style="margin-bottom:8px">${esc(f.title)}</h1>
    <div class="tl">${steps}</div>
    ${decoIconHTML(f.icon, f.iconPos, f.iconOpacity, b.accent)}
    ${customImagesHTML(f.images)}
  `, '', i, t, b, f.bgOverride, d, f.bgStyle)
}

function renderPricing(f, i, t, b, d) {
  const plans = (f.plans || []).map(plan => {
    const features = (plan.features || []).map(ft => `<li>${esc(ft)}</li>`).join('')
    return `
      <div class="pricing-card ${plan.highlighted ? 'hl' : ''}">
        <div class="pricing-name">${esc(plan.name)}</div>
        <div class="pricing-price">${esc(plan.price)}</div>
        <div class="pricing-period">${esc(plan.period)}</div>
        <ul class="pricing-features">${features}</ul>
      </div>
    `
  }).join('')
  return wrap(`
    <h1 class="sm" style="margin-bottom:8px">${esc(f.title)}</h1>
    <div class="pricing-grid">${plans}</div>
    ${decoIconHTML(f.icon, f.iconPos, f.iconOpacity, b.accent)}
    ${customImagesHTML(f.images)}
  `, '', i, t, b, f.bgOverride, d, f.bgStyle)
}

export function renderSlideHTML(slide, idx, total, brand, dims) {
  const f = slide.fields
  switch (slide.type) {
    case 'hook':        return renderHook(f, idx, total, brand, dims)
    case 'content':     return renderContent(f, idx, total, brand, dims)
    case 'bigNumber':   return renderBigNumber(f, idx, total, brand, dims)
    case 'list':        return renderList(f, idx, total, brand, dims)
    case 'beforeAfter': return renderBeforeAfter(f, idx, total, brand, dims)
    case 'cta':         return renderCTA(f, idx, total, brand, dims)
    case 'quote':       return renderQuote(f, idx, total, brand, dims)
    case 'timeline':    return renderTimeline(f, idx, total, brand, dims)
    case 'pricing':     return renderPricing(f, idx, total, brand, dims)
    default:            return '<html><body></body></html>'
  }
}
