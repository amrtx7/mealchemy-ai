import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-20 border-t-[3px] border-black bg-[var(--surface-muted)] overflow-hidden">
      {/* Decorative stripe */}
      <div className="h-2 bg-[#ffb703] border-b-[3px] border-black"></div>
      
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
        <div className="space-y-6">
          <Link to="/" className="font-sans font-black text-3xl theme-text tracking-tight hover:opacity-90">
            Mealchemy Ai
          </Link>
          <p className="font-bold text-[var(--text-muted)] max-w-xs leading-relaxed">
            Crafting smarter, healthier, and more delicious meal plans with the power of AI. Your kitchen, optimized.
          </p>
          <div className="flex gap-4">
            {['Twitter', 'Instagram', 'Github'].map((social) => (
              <a 
                key={social} 
                href="#" 
                className="w-10 h-10 border-[3px] border-black bg-[var(--surface-raised)] rounded-md flex items-center justify-center shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                <span className="sr-only">{social}</span>
                <div className="w-5 h-5 bg-black rounded-sm"></div>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-black uppercase tracking-widest text-sm mb-6 theme-accent text-[#b80000] dark:text-[#e02020]">Product</h4>
          <ul className="space-y-4">
            {['Home', 'Generate Menu', 'Dashboard', 'Pricing'].map((item) => (
              <li key={item}>
                <Link to={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`} className="font-bold hover:underline decoration-[3px] underline-offset-4">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-black uppercase tracking-widest text-sm mb-6 theme-accent text-[#b80000] dark:text-[#e02020]">Resources</h4>
          <ul className="space-y-4">
            {['Recipe Guide', 'Community', 'Support', 'Legal'].map((item) => (
              <li key={item}>
                <a href="#" className="font-bold hover:underline decoration-[3px] underline-offset-4">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="font-black uppercase tracking-widest text-sm theme-accent text-[#b80000] dark:text-[#e02020]">Stay in the loop</h4>
          <div className="flex flex-col gap-3">
            <input 
              type="email" 
              placeholder="Hungry for updates?" 
              className="input-magic py-2 px-4 shadow-neo-sm"
            />
            <button className="btn-primary py-2 px-4 shadow-neo-sm text-sm">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="border-t-[3px] border-black py-8 px-6 bg-[#1A1A1A] text-[#FDFBF6]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-black text-sm tracking-tight italic opacity-90">
            &copy; {currentYear} MEALCHEMY AI. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-8 font-black text-xs uppercase tracking-widest">
            <a href="#" className="hover:text-[var(--accent-warm)] transition-colors">Terms</a>
            <a href="#" className="hover:text-[var(--accent-warm)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--accent-warm)] transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
