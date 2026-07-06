import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/home" className="navbar__brand">Music Recsys</Link>
      <div className="navbar__links">
        <Link
          to="/home"
          className={`navbar__link ${isActive('/home') ? 'active' : ''}`}
        >
          Home
        </Link>
        <Link
          to="/search"
          className={`navbar__link ${isActive('/search') ? 'active' : ''}`}
        >
          Search
        </Link>
        <Link
          to="/library"
          className={`navbar__link ${isActive('/library') ? 'active' : ''}`}
        >
          Library
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
