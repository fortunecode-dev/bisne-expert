import Link from 'next/link'

const PLANS = [
  {
    id: 'common', name: 'Común', icon: '🏪', price: 'Gratis',
    color: '#888888', bg: '#88888810',
    highlight: false,
    features: [
      { icon: '📦', text: 'Hasta 10 productos' },
      { icon: '🖼️', text: 'Hasta 3 fotos por producto' },
      { icon: '🎨', text: 'Temas estándar (40 paletas)' },
      { icon: '🏷️', text: 'Logo, portada y descripción' },
      { icon: '🕐', text: 'Horario de atención' },
      { icon: '💳', text: 'Métodos de pago' },
      { icon: '🛒', text: 'Carrito de WhatsApp' },
    ],
    cta: 'Empezar gratis',
    ctaHref: '/registrar',
  },
  {
    id: 'sponsored', name: 'Patrocinado', icon: '⭐', price: 'Contactar',
    color: '#eab308', bg: '#eab30810',
    highlight: true,
    features: [
      { icon: '📦', text: 'Hasta 20 productos' },
      { icon: '🖼️', text: 'Hasta 6 fotos por producto' },
      { icon: '🎨', text: 'Temas estándar + Festividades (20+ adicionales)' },
      { icon: '⭐', text: 'Badge Patrocinado' },
      { icon: '🔝', text: 'Aparece antes que negocios comunes' },
      { icon: '📢', text: 'Inclusión en el banner marquee' },
      { icon: '✅', text: 'Todo lo del plan Común' },
    ],
    cta: 'Contactar para activar',
    ctaHref: '/',
  },
  {
    id: 'premium', name: 'Premium', icon: '💎', price: 'Contactar',
    color: '#a855f7', bg: '#a855f710',
    highlight: false,
    features: [
      { icon: '♾️', text: 'Productos ilimitados' },
      { icon: '🖼️', text: 'Hasta 9 fotos por producto' },
      { icon: '🎞️', text: '4 portadas en slideshow automático' },
      { icon: '✨', text: 'Temas animados exclusivos (Gamer, Aurora, Neon Pulse, Cyber, Rainbow Flow)' },
      { icon: '💎', text: 'Badge Premium' },
      { icon: '🔝', text: 'Aparece primero en el catálogo' },
      { icon: '📢', text: 'Productos individuales en el marquee' },
      { icon: '🎟️', text: 'Códigos promocionales con descuento (% o fijo)' },
      { icon: '📣', text: 'Etiquetas por producto: Rebaja, Nuevo, Especial, Limitado' },
      { icon: '🔗', text: 'Links de código promo compartibles' },
      { icon: '✅', text: 'Todo lo del plan Patrocinado' },
    ],
    cta: 'Contactar para activar',
    ctaHref: '/',
  },
]

const ANIMATED_THEMES = [
  { name: '🎮 Gamer', key: 'gamer', bg: '#030609', accent: '#00ff88',
    css: 'background: linear-gradient(135deg, #030609, #040a12); box-shadow: 0 0 20px #00ff8830;',
    desc: 'Grilla neón verde · Resplandor dinámico',
  },
  { name: '🌌 Aurora', key: 'aurora', bg: '#02040a', accent: '#a855f7',
    css: 'background: radial-gradient(ellipse at 30% 40%, #a855f730, transparent 60%), radial-gradient(ellipse at 70% 70%, #06b6d430, transparent 60%), #02040a;',
    desc: 'Luces boreales · Gradientes en movimiento',
  },
  { name: '💜 Neon Pulse', key: 'neon-pulse', bg: '#040010', accent: '#ff00aa',
    css: 'background: linear-gradient(135deg, #040010, #0c0020); box-shadow: 0 0 30px #ff00aa30;',
    desc: 'Parpadeo neón · Escaneo de líneas',
  },
  { name: '🤖 Cyber', key: 'cyber', bg: '#000508', accent: '#ffee00',
    css: 'background: repeating-linear-gradient(0deg, #000508, #000508 3px, #020e18 3px, #020e18 4px);',
    desc: 'Grid cyberpunk · Glitch digital',
  },
  { name: '🌈 Rainbow Flow', key: 'rainbow', bg: '#04040a', accent: '#f97316',
    css: 'background: conic-gradient(from 0deg at 50% 50%, #f9731618, #eab30818, #22c55e18, #06b6d418, #6366f118, #ec489918, #f9731618), #04040a;',
    desc: 'Arcoíris giratorio · Color dinámico',
  },
]

const THEME_TIERS = [
  {
    label: '🎨 Estándar',
    desc: 'Común / Patrocinado / Premium',
    swatches: ['#f97316','#0ea5e9','#16a34a','#7c3aed','#e11d48','#eab308'],
    animated: false,
  },
  {
    label: '🎉 Festividades',
    desc: 'Patrocinado / Premium',
    swatches: ['#16a34a','#ea580c','#e11d48','#a855f7','#eab308','#dc2626'],
    animated: false,
  },
  {
    label: '✨ Animados',
    desc: 'Solo Premium',
    swatches: ['#00ff88','#a855f7','#ff00aa','#ffee00','#f97316'],
    animated: true,
  },
]

const COMPARE = [
  ['Productos', '10', '20', 'Ilimitados'],
  ['Fotos por producto', '3', '6', '9'],
  ['Portadas', '1', '1', '4 (slideshow)'],
  ['Temas estándar (40)', '✓', '✓', '✓'],
  ['Temas festividades (20+)', '—', '✓', '✓'],
  ['Temas animados (5)', '—', '—', '✓'],
  ['Badge', '—', '⭐', '💎'],
  ['Posición catálogo', 'Normal', 'Antes que Común', 'Primero'],
  ['Marquee', '—', 'Negocio', 'Negocio + Productos'],
  ['Códigos descuento', '—', '—', '✓'],
  ['Links de código', '—', '—', '✓'],
  ['Promos por producto', '—', '—', '✓'],
]

export default function PlanesPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <header className="border-b px-4 h-14 flex items-center gap-3 sticky top-0 z-10"
        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
        <Link href="/" className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>← Inicio</Link>
        <h1 className="font-black text-base" style={{ color: 'var(--color-text)' }}>💎 Planes</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-16">

        <div className="text-center">
          <h2 className="text-3xl font-black mb-3" style={{ color: 'var(--color-text)' }}>Elige tu plan</h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            Todos los planes incluyen catálogo digital, carrito de WhatsApp y perfil personalizable. Sin app — funciona desde el navegador.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.id} className="rounded-3xl p-6 border flex flex-col relative overflow-hidden"
              style={{
                background: plan.bg,
                borderColor: plan.color + '40',
                boxShadow: plan.highlight ? `0 4px 40px ${plan.color}25, 0 0 0 1px ${plan.color}30` : undefined,
              }}>
              {plan.highlight && (
                <div className="absolute top-4 right-4 text-[10px] font-black px-2 py-1 rounded-full"
                  style={{ background: plan.color, color: '#000' }}>MÁS POPULAR</div>
              )}
              <div className="text-4xl mb-3">{plan.icon}</div>
              <h3 className="text-xl font-black mb-1" style={{ color: 'var(--color-text)' }}>{plan.name}</h3>
              <p className="text-2xl font-black mb-5" style={{ color: plan.color }}>{plan.price}</p>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="flex-shrink-0 mt-0.5">{f.icon}</span>
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.ctaHref}
                className="block text-center py-2.5 rounded-xl font-black text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: plan.color, color: 'white' }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Animated Themes showcase */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>✨ Temas animados Premium</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#a855f720', color: '#c084fc' }}>Solo 💎</span>
          </div>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Efectos visuales exclusivos que se aplican al fondo del catálogo de tu negocio en tiempo real.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {ANIMATED_THEMES.map(theme => (
              <div key={theme.key} className="rounded-2xl overflow-hidden border relative group cursor-default"
                style={{ borderColor: theme.accent + '40', boxShadow: `0 0 16px ${theme.accent}20` }}>
                <div className="h-24 relative" style={{ background: theme.bg }}>
                  <div className="absolute inset-0" style={{ cssText: theme.css } as any} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-base"
                      style={{ borderColor: theme.accent, background: theme.accent + '30', color: theme.accent }}>
                      ✦
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                    style={{ background: theme.accent }} />
                </div>
                <div className="p-2.5" style={{ background: theme.bg + 'ee' }}>
                  <p className="text-xs font-black" style={{ color: theme.accent }}>{theme.name}</p>
                  <p className="text-[10px] mt-0.5 leading-tight" style={{ color: theme.accent + '90' }}>{theme.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black mb-2" style={{ color: 'var(--color-text)' }}>🎨 Temas por plan</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Cada plan desbloquea más opciones de personalización visual para tu catálogo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {THEME_TIERS.map(tier => (
              <div key={tier.label} className="rounded-2xl p-4 border"
                style={{
                  borderColor: tier.animated ? '#a855f740' : 'var(--color-border)',
                  background: tier.animated ? '#a855f708' : 'var(--color-surface)',
                  boxShadow: tier.animated ? '0 0 20px #a855f720' : undefined,
                }}>
                <p className="font-black text-sm mb-0.5" style={{ color: 'var(--color-text)' }}>{tier.label}</p>
                <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{tier.desc}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {tier.swatches.map((c, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2"
                      style={{ background: c, borderColor: 'var(--color-bg)' }} />
                  ))}
                  {tier.animated && (
                    <div className="w-7 h-7 rounded-full border-2"
                      style={{
                        background: 'conic-gradient(#f97316, #eab308, #22c55e, #06b6d4, #a855f7, #ec4899, #f97316)',
                        borderColor: 'var(--color-bg)',
                      }} />
                  )}
                </div>
                {tier.animated && (
                  <p className="text-[10px] font-bold mt-2" style={{ color: '#a855f7' }}>
                    ✨ Con efectos visuales animados en el catálogo
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black mb-6" style={{ color: 'var(--color-text)' }}>📋 Comparación</h3>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--color-surface-2)' }}>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Función</th>
                  <th className="text-center p-3 font-black" style={{ color: '#888' }}>🏪</th>
                  <th className="text-center p-3 font-black" style={{ color: '#eab308' }}>⭐</th>
                  <th className="text-center p-3 font-black" style={{ color: '#a855f7' }}>💎</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([feat, c, s, p]) => (
                  <tr key={feat} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-3" style={{ color: 'var(--color-text)' }}>{feat}</td>
                    {[c, s, p].map((v, i) => (
                      <td key={i} className="text-center p-3 text-xs font-semibold"
                        style={{ color: v === '—' ? 'var(--color-border)' : i === 0 ? '#999' : i === 1 ? '#eab308' : '#a855f7' }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center py-8">
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            ¿Listo para empezar? Regístrate gratis o contáctanos para un plan superior.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/registrar"
              className="px-6 py-3 rounded-2xl font-black text-sm hover:opacity-90 active:scale-95 transition-all"
              style={{ background: 'var(--color-accent)', color: 'white' }}>
              🏪 Registrarme gratis
            </Link>
            <Link href="/"
              className="px-6 py-3 rounded-2xl font-black text-sm border hover:opacity-80 transition-all"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              Ver catálogo
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
