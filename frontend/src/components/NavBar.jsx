import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const links = [
    ["Home", "/"],
    ["Menu", "/meals"],
    ["Dashboard", "/dashboard"],
    ["History", "/history"],
    ["Cart", "/cart"],
  ];

  return (
    <header className="sticky top-0 z-50 py-4 border-b-4 border-black bg-[var(--surface)] shadow-neo">
      <nav className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between gap-5">
        <Link
          to="/"
          className="font-sans font-black text-2xl md:text-3xl theme-text flex items-center gap-3 hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
        >
          <span className="tracking-tighter">Mealchemy Ai</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 font-sans font-bold theme-text">
          {links.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? "theme-accent underline decoration-4 underline-offset-4"
                  : "hover:opacity-80 transition-opacity"
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden sm:flex items-center gap-2 border-brutal border-black px-3 py-1.5 rounded-md theme-muted shadow-neo-sm font-sans">
            <span className="text-sm font-black">2212662</span>
            <span className="text-xs" aria-hidden>📞</span>
          </div>

          <div 
            className="theme-switch" 
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <div className="theme-switch-thumb">
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>

          {user && (
            <button
              className="theme-text text-xs font-black uppercase tracking-widest border-brutal border-black px-3 py-1.5 rounded-md bg-[var(--surface-raised)] shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              onClick={logout}
            >
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
