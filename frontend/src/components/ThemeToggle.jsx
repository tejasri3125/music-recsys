import { useTheme } from '../ThemeContext';

/**
 * A small glassmorphic switch — drop it in your navbar.
 * Usage: <ThemeToggle />
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="glass theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      data-cursor-hover
    >
      <div className="theme-toggle__thumb" />
    </button>
  );
}
