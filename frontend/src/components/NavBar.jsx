import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const linkClass = ({ isActive }) =>
  [
    "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-black transition-all border-[3px] border-black",
    isActive
      ? "bg-[var(--accent-warm)] shadow-neo-sm"
      : "bg-[var(--surface-raised)] hover:bg-[var(--surface-muted)] shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none",
  ].join(" ");

export default function NavBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const links = [
    ["Home", "/"],
    ["Menu", "/meals"],
    ["Dashboard", "/dashboard"],
    ["Cart", "/cart"],
  ];

  return (
    <header className="sticky top-0 z-50 bg-[var(--surface)] border-b-[3px] border-black">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-3 md:gap-4">
          <Link
            to="/"
            className="font-sans font-black text-xl sm:text-2xl theme-text shrink-0 tracking-tight hover:opacity-90 transition-opacity min-w-0"
          >
            Mealchemy Ai
          </Link>

          <div className="hidden md:flex flex-1 justify-center px-2">
            <div className="flex items-center gap-2 lg:gap-3">
              {links.map(([label, to]) => (
                <NavLink key={to} to={to} className={linkClass}>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              className="theme-switch theme-switch--compact shrink-0"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <div className="theme-switch-thumb">
                {theme === "dark" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
            {user && (
              <>
                <Link
                  to="/profile"
                  className="h-10 w-10 rounded-full border-[3px] border-black bg-[var(--accent-warm)] shadow-neo-sm flex items-center justify-center font-black"
                  title="Profile"
                >
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </Link>
                <button
                  type="button"
                  className="theme-text text-xs font-black uppercase tracking-widest border-[3px] border-black px-3 py-1.5 rounded-md bg-[var(--surface-raised)] shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>

        <div className="md:hidden flex gap-2 overflow-x-auto pb-3 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6 border-t-[3px] border-black [scrollbar-width:thin]">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} className={linkClass}>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
