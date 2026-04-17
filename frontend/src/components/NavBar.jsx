import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const links = [
    ["Home", "/"],
    ["Menu", "/meals"],
    ["Dashboard", "/dashboard"],
    ["History", "/history"],
    ["Cart", "/cart"],
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FDFBF6]/80 backdrop-blur-xl py-6 transition-all border-b border-[#E8DDCA]/30">
      <nav className="max-w-7xl mx-auto px-8 flex items-center justify-between">
        <Link to="/" className="font-serif font-black text-3xl text-[#164E40] flex items-center gap-3 hover:opacity-90 transition-opacity">
          <span className="text-3xl filter drop-shadow-sm">🍲</span>
          <span className="tracking-tighter">Mealchemy</span>
        </Link>
        <div className="hidden md:flex items-center gap-10 font-serif text-[#164E40]">
          {links.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? "text-[#E79B48] font-bold" : "hover:text-[#E79B48] transition-colors"
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button className="hidden sm:flex border border-[#164E40] text-[#164E40] px-5 py-2 rounded-full font-serif text-sm font-medium hover:bg-[#164E40] hover:text-white transition-all items-center gap-2">
            (808) 555-0111 📞
          </button>
          {user && (
            <button className="text-[#164E40] text-sm font-medium opacity-70 hover:opacity-100 uppercase tracking-widest" onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
