import { Outlet } from 'react-router-dom'
import { TabBar } from '../components/TabBar'
import './AppShell.css'

export function AppShell() {
  return (
    <div className="app-shell">
      <main className="app-shell__content">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
