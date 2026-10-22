import { avatarSpecFromSeed, type Hairstyle } from '../sim/avatars'

type AvatarIllustrationProps = {
  seed: number
  /** Nombre para el aria-label; sin nombre el SVG es decorativo. */
  name?: string
  className?: string
}

function hairPath(style: Hairstyle): string | null {
  switch (style) {
    case 'corto':
      return 'M86 128 C88 92 112 80 134 80 C162 80 180 98 178 128 C168 108 150 98 128 100 C110 104 96 114 86 128 Z'
    case 'largo':
      return 'M84 132 C80 88 108 72 132 72 C158 72 184 88 180 132 L184 196 C168 180 160 160 158 136 C148 114 116 114 106 136 C104 160 96 180 80 196 Z'
    case 'chongo':
      return 'M86 126 C88 94 110 82 132 82 C156 82 178 94 178 126 C166 106 148 98 132 98 C116 98 98 106 86 126 Z M116 76 a16 16 0 1 1 32 0 a16 16 0 1 1 -32 0'
    case 'rizado':
      return 'M82 130 C76 92 104 70 132 70 C162 70 188 92 182 130 C184 118 176 108 168 110 C172 98 160 88 150 92 C148 82 136 78 128 84 C118 76 104 84 106 94 C94 92 86 102 92 112 C84 112 80 122 82 130 Z'
    case 'rapado':
      return null
  }
}

/** Avatar ilustrado por piezas, estilo plano del mockup (sin personas reales). */
export function AvatarIllustration({ seed, name, className }: AvatarIllustrationProps) {
  const spec = avatarSpecFromSeed(seed)
  const hair = hairPath(spec.hairstyle)

  return (
    <svg
      viewBox="0 0 264 276"
      preserveAspectRatio="xMidYMid slice"
      role={name ? 'img' : undefined}
      aria-label={name ? `Ilustración de ${name}` : undefined}
      aria-hidden={name ? undefined : true}
      className={className}
    >
      <rect width="264" height="276" fill={spec.background} />
      <circle cx={spec.blobX} cy={spec.blobY} r="70" fill={spec.accent1} />
      <circle cx="30" cy="240" r="56" fill={spec.accent2} opacity="0.25" />
      {/* Cuello y hombros */}
      <rect x="116" y="164" width="32" height="44" rx="14" fill={spec.skin} />
      <path
        d="M40 276 C46 220 90 200 132 200 C174 200 218 220 224 276 Z"
        fill={spec.clothes}
      />
      {/* Cara */}
      <ellipse cx="132" cy="134" rx="46" ry="52" fill={spec.skin} />
      {hair && <path d={hair} fill={spec.hairColor} />}
      <circle cx="116" cy="138" r="4" fill="#2A1A1F" />
      <circle cx="148" cy="138" r="4" fill="#2A1A1F" />
      <circle cx="106" cy="152" r="7" fill="#C2574A" opacity="0.5" />
      <circle cx="158" cy="152" r="7" fill="#C2574A" opacity="0.5" />
      <path
        d="M120 158 C127 166 137 166 144 158"
        fill="none"
        stroke="#2A1A1F"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
