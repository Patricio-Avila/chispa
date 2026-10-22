import './PlaceholderScreen.css'

type PlaceholderScreenProps = {
  title: string
  phase: number
}

export function PlaceholderScreen({ title, phase }: PlaceholderScreenProps) {
  return (
    <div className="placeholder-screen">
      <h1 className="text-title">{title}</h1>
      <p className="text-body placeholder-screen__note">
        Pantalla en construcción (Fase {phase}).
      </p>
    </div>
  )
}
