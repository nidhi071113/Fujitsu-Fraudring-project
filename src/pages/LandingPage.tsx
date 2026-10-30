import React, { useState, useEffect, useRef } from 'react';
import { Network, Shield, Eye, AlertTriangle, User, ChevronRight, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Persona chips ─────────────────────────────────────────────
const PERSONA_CHIPS = [
  { id: 'aiko',   label: 'Analyst',   name: 'Aiko Tanaka',  initials: 'AT',
    bg: 'linear-gradient(135deg,#1d4ed8,#2563eb)', accent: '#60a5fa' },
  { id: 'kenji',  label: 'Team Lead', name: 'Kenji Sato',   initials: 'KS',
    bg: 'linear-gradient(135deg,#92400e,#d97706)', accent: '#fb923c' },
  { id: 'mei',    label: 'Admin',     name: 'Mei Lin',      initials: 'ML',
    bg: 'linear-gradient(135deg,#5b21b6,#7c3aed)', accent: '#c084fc' },
  { id: 'daniel', label: 'Auditor',   name: 'Daniel Vance', initials: 'DV',
    bg: 'linear-gradient(135deg,#065f46,#059669)', accent: '#34d399' },
];

const FEATURES = [
  { icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,  title: 'Detect Fraud Rings',
    desc: 'Graph Neural Network identifies rings invisible to individual transaction scoring.' },
  { icon: <Network className="w-5 h-5 text-blue-400" />,        title: 'Visualize Networks',
    desc: 'Interactive account-device-IP graphs reveal hidden connections at a glance.' },
  { icon: <Eye className="w-5 h-5 text-violet-400" />,          title: 'Explain Risk',
    desc: 'Every ring score comes with plain-language reasoning and model attributions.' },
];

// ─── Galaxy Plexus Canvas ──────────────────────────────────────
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;          // radius
  opacity: number;
  pulse: number;      // phase offset for glow pulsing
}

const PlexusCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // ── Resize ────────────────────────────────────────────
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Spawn particles ────────────────────────────────────
    const COUNT = 110;
    const spawn = () => {
      particlesRef.current = Array.from({ length: COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 2 + 1.2,
        opacity: Math.random() * 0.5 + 0.25,
        pulse: Math.random() * Math.PI * 2,
      }));
    };
    spawn();

    // ── Mouse parallax ────────────────────────────────────
    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('mousemove', onMouse);

    // ── Draw loop ─────────────────────────────────────────
    let t = 0;
    const CONNECT_DIST  = 130;   // max px to draw a line
    const MOUSE_ATTRACT = 160;   // mouse influence radius

    const draw = () => {
      t += 0.008;
      const W = canvas.width, H = canvas.height;
      const ps = particlesRef.current;
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      ctx.clearRect(0, 0, W, H);

      // ── Move ──
      for (const p of ps) {
        // gentle mouse attraction
        const dx = mx - p.x, dy = my - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MOUSE_ATTRACT && dist > 0) {
          const force = (MOUSE_ATTRACT - dist) / MOUSE_ATTRACT * 0.012;
          p.vx += dx / dist * force;
          p.vy += dy / dist * force;
        }
        // damping + drift
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        // wrap edges
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      }

      // ── Lines ──
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const dx = ps[i].x - ps[j].x;
          const dy = ps[i].y - ps[j].y;
          const d  = Math.hypot(dx, dy);
          if (d < CONNECT_DIST) {
            const alpha = (1 - d / CONNECT_DIST) * 0.25;
            // subtle blue-white gradient line
            const grad = ctx.createLinearGradient(ps[i].x, ps[i].y, ps[j].x, ps[j].y);
            grad.addColorStop(0, `rgba(148,163,184,${alpha})`);
            grad.addColorStop(0.5, `rgba(99,179,237,${alpha * 1.4})`);
            grad.addColorStop(1, `rgba(148,163,184,${alpha})`);
            ctx.beginPath();
            ctx.moveTo(ps[i].x, ps[i].y);
            ctx.lineTo(ps[j].x, ps[j].y);
            ctx.strokeStyle = grad;
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }
      }

      // ── Dots ──
      for (const p of ps) {
        const pulse  = Math.sin(t + p.pulse) * 0.3 + 0.7;   // 0.4 – 1.0
        const op     = p.opacity * pulse;
        const glow   = p.r * 3.5 * pulse;

        // outer glow halo
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow);
        halo.addColorStop(0,   `rgba(147,197,253,${op * 0.55})`);
        halo.addColorStop(0.4, `rgba(99,179,237,${op * 0.25})`);
        halo.addColorStop(1,   `rgba(99,179,237,0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, glow, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        // core dot
        const core = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        core.addColorStop(0,   `rgba(255,255,255,${op})`);
        core.addColorStop(0.6, `rgba(147,197,253,${op * 0.8})`);
        core.addColorStop(1,   `rgba(99,179,237,0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();
      }

      // ── Bright hub nodes (larger glowing stars) ──
      const HUB_INDICES = [5, 18, 34, 52, 71, 88];
      for (const i of HUB_INDICES) {
        if (!ps[i]) continue;
        const p  = ps[i];
        const ph = Math.sin(t * 1.4 + p.pulse) * 0.4 + 0.8;
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18 * ph);
        gr.addColorStop(0,   `rgba(186,230,253,${0.9 * ph})`);
        gr.addColorStop(0.3, `rgba(99,179,237,${0.4 * ph})`);
        gr.addColorStop(1,   `rgba(59,130,246,0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 18 * ph, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
};

// ─── Landing Page ──────────────────────────────────────────────
export default function LandingPage() {
  const { login } = useAuth();
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('Please enter a username.'); return; }
    setIsLoading(true);
    setTimeout(() => { login('aiko'); setIsLoading(false); }, 600);
  };

  const handlePersonaLogin = (personaId: string) => {
    setIsLoading(true);
    setTimeout(() => { login(personaId); setIsLoading(false); }, 400);
  };

  return (
    <div
      className="relative min-h-screen flex overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #0a0f1e 40%, #050b1a 100%)' }}
    >
      {/* ── Galaxy plexus canvas ── */}
      <PlexusCanvas />

      {/* ── Radial glow overlays for depth ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 60% at 25% 50%, rgba(59,130,246,0.07) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 50% 50% at 75% 30%, rgba(139,92,246,0.06) 0%, transparent 70%)',
      }} />
      {/* vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 40%, rgba(2,6,23,0.7) 100%)',
      }} />

      {/* ── Content ── */}
      <div className="relative flex flex-col lg:flex-row w-full min-h-screen" style={{ zIndex: 2 }}>

        {/* LEFT PANEL */}
        <div className="flex flex-col justify-center px-10 py-16 lg:w-1/2 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(59,130,246,0.45)',
            }}>
              <Network style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                FraudRing<span style={{ color: '#60a5fa' }}>Graph</span>
              </div>
              <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.15em', fontWeight: 600 }}>
                GRAPH
              </div>
            </div>
          </div>

          {/* Tagline */}
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.05, color: '#fff', marginBottom: 20 }}>
            See the connections.<br />
            <span style={{
              background: 'linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Uncover the network.
            </span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.65, maxWidth: 420, marginBottom: 48 }}>
            Graph-native financial crime detection that reveals fraud rings invisible to
            traditional transaction-level scoring.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{f.title}</div>
                  <div style={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 52, color: '#1e293b', fontSize: '0.7rem' }}>
            All data is synthetic. No real PII is used in this demo environment.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4rem 2rem' }} className="lg:w-1/2 xl:px-16">
          <div style={{
            width: '100%', maxWidth: 440,
            background: 'rgba(10,15,30,0.82)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(51,65,85,0.5)',
            borderRadius: 20,
            padding: '2.2rem',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,179,237,0.04)',
          }}>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', marginBottom: 4 }}>Sign In</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 28 }}>
              Access your fraud investigation workspace.
            </p>

            {/* Form */}
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div style={{ background: 'rgba(153,27,27,0.3)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem' }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#475569' }} />
                  <input
                    type="text"
                    placeholder="analyst@fraudring"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="input-dark"
                    style={{ paddingLeft: 38, width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#475569' }} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-dark"
                    style={{ paddingLeft: 38, width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  id="rem" type="checkbox" checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: '#3b82f6', cursor: 'pointer' }}
                />
                <label htmlFor="rem" style={{ color: '#64748b', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Remember me on this device
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 4, fontSize: '0.95rem', padding: '10px 0',
                  background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}
              >
                {isLoading
                  ? <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  : <><span>Sign In</span> <ChevronRight style={{ width: 16, height: 16 }} /></>
                }
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(51,65,85,0.7)' }} />
              <span style={{ color: '#334155', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>or Demo Mode (Synthetic Data)</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(51,65,85,0.7)' }} />
            </div>

            {/* Persona chips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {PERSONA_CHIPS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePersonaLogin(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 12, textAlign: 'left',
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(51,65,85,0.5)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    outline: 'none',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = p.accent;
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 16px ${p.accent}22`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(51,65,85,0.5)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, background: p.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
                    boxShadow: `0 2px 10px ${p.accent}44`,
                  }}>
                    {p.initials}
                  </div>
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }}>{p.name}</div>
                    <div style={{ color: p.accent, fontSize: '0.7rem' }}>{p.label}</div>
                  </div>
                </button>
              ))}
            </div>

            <p style={{ textAlign: 'center', color: '#1e293b', fontSize: '0.7rem', marginTop: 16 }}>
              Demo personas use synthetic data only. No authentication required.
            </p>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
            {[
              { icon: <Shield style={{ width: 13, height: 13 }} />, label: 'SOC 2 Ready' },
              { icon: <Lock style={{ width: 13, height: 13 }} />,   label: 'AES-256 Encrypted' },
              { icon: <Eye style={{ width: 13, height: 13 }} />,    label: 'Full Audit Trail' },
            ].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#1e293b', fontSize: '0.72rem' }}>
                {b.icon} <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
