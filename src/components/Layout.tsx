import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { InstallPrompt } from './InstallPrompt'

export function Layout() {
  const { pathname } = useLocation()
  const immersive = pathname.startsWith('/studio') || pathname.startsWith('/proof')

  if (immersive) {
    return (
      <div className="app-shell immersive-shell">
        <Outlet />
        <InstallPrompt />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topnav">
        <NavLink to="/" className="brand">
          <em>EmlakVR</em>
          <span>gör · yerleştir · fiyatla · kanıtla</span>
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Ana Sayfa
          </NavLink>
          <NavLink to="/studio" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Stüdyo
          </NavLink>
          <NavLink to="/proof" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Kanıt
          </NavLink>
        </nav>
        <NavLink to="/studio" className="btn btn-primary btn-sm">
          Eve gir
        </NavLink>
      </header>
      <Outlet />
      <InstallPrompt />
    </div>
  )
}
