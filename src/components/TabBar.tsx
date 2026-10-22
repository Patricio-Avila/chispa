import { NavLink } from 'react-router-dom'
import { Cards, Heart, ChatCircle, User, type Icon } from '@phosphor-icons/react'
import './TabBar.css'

type Tab = {
  to: string
  label: string
  icon: Icon
  badge?: number
}

const TABS: Tab[] = [
  { to: '/descubrir', label: 'Descubrir', icon: Cards },
  { to: '/likes', label: 'Likes', icon: Heart },
  { to: '/conversaciones', label: 'Conversaciones', icon: ChatCircle },
  { to: '/perfil', label: 'Perfil', icon: User },
]

export function TabBar() {
  return (
    <nav className="tab-bar" aria-label="Navegación principal">
      {TABS.map(({ to, label, icon: IconComponent, badge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `tab-bar__item${isActive ? ' tab-bar__item--active' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <span className="tab-bar__icon">
                <IconComponent
                  size={24}
                  weight={isActive ? 'fill' : 'regular'}
                  aria-hidden="true"
                />
                {badge != null && badge > 0 && (
                  <span className="tab-bar__badge">{badge}</span>
                )}
              </span>
              <span className="tab-bar__label text-micro">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
