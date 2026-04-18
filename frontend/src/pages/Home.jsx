import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useMeals } from "../context/MealContext";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { query, setQuery, setMeals, setCart, setConstraints, setTotalCost, setCartSummary } = useMeals();

  const [filters, setFilters] = useState({
    cuisine: "Indian",
    mealType: "Lunch",
    diet: "Veg",
    budget: "",
    protein: false
  });

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        query,
        cuisine: filters.cuisine,
        mealType: filters.mealType,
        diet: filters.diet,
        budget: filters.budget ? Number(filters.budget) : undefined,
        protein: filters.protein
      };
      const { data } = await api.post("/meals/generate", payload);
      setMeals(data.meals || []);
      setCart(data.cart || []);
      setConstraints(data.constraints || {});
      setTotalCost(data.totalCost || 0);
      setCartSummary(null);
      navigate("/meals");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate meals");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative -mx-4 w-[calc(100%+2rem)] max-w-none">
      {/* Bold decorative circles (neobrutal) */}
      <div className="abstract-circle w-96 h-96 -top-20 -left-20 animate-drift" />
      <div
        className="abstract-circle w-80 h-80 top-1/2 -right-20 animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="abstract-circle w-64 h-64 bottom-10 left-1/4 animate-drift"
        style={{ animationDelay: "4s" }}
      />

      {/* Floating Food Elements (Inspired by Indian Cuisine) */}
      <img
        src="saras.png"
        alt="Biryani"
        className="absolute top-20 right-[2%] w-60 h-60 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-float hidden xl:block pointer-events-none"
        style={{ animationDuration: '10s' }}
      />
      <img
        src="thali1.png"
        alt="saag"
        className="absolute top-[10%] left-[1%] w-56 h-56 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] animate-drift hidden xl:block pointer-events-none"
        style={{ animationDuration: '12s' }}
      />
      <img
        src="saras.png"
        alt="Salad/Saag"
        className="absolute bottom-20 left-[5%] w-60 h-60 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-float hidden xl:block pointer-events-none"
        style={{ animationDuration: '8s' }}
      />

      <section className="max-w-7xl mx-auto mt-16 px-6 text-center relative z-10 animate-fade-in-up">
        <h1 className="mx-auto max-w-5xl mb-12 text-[var(--text)]">
          <span className="block font-great text-[2.85rem] sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] text-[#b80000] dark:text-[#e02020] [text-shadow:3px_3px_0_#000] -rotate-1">
            Transforming
          </span>
          <span className="mt-3 block font-script text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-snug tracking-wide">
            how you plan meals and make{" "}
            <span
              className="inline-block font-elegant italic font-bold text-[1.05em] md:text-[1.08em] align-baseline text-[#d97070] dark:text-[#e88888] [-webkit-text-stroke:2px_#000000] [paint-order:stroke_fill]"
            >
              smarter
            </span>{" "}
            <span className="font-elegant italic font-semibold text-[0.98em] text-[var(--text)] md:text-[1.02em]">
              food decisions
            </span>
            <span className="font-great text-[var(--accent-warm)] [text-shadow:2px_2px_0_#000]">.</span>
          </span>
        </h1>

        <div className="mb-24">
          <a href="#planner" className="btn-primary inline-flex items-center gap-3 text-lg md:text-xl px-10 py-4 md:px-12 md:py-5">
            Start Your Journey
          </a>
        </div>

        <div className="w-full max-w-5xl mx-auto h-[400px] md:h-[600px] rounded-2xl overflow-hidden bg-[#E8DDCA] mb-20 relative border-brutal border-black shadow-neo-lg transition-transform hover:-translate-y-0.5 duration-300 group">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2000"
            alt="Delicious meal table"
            className="w-full h-full object-cover border-b-brutal border-black group-hover:brightness-105 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
        </div>
      </section>

      <section
        id="planner"
        className="relative w-full bg-[#ffb703] py-24 md:py-32 px-6 sm:px-8 overflow-hidden border-y-[3px] border-black"
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <h2 className="text-4xl md:text-6xl font-black text-[#164E40] leading-tight mb-8">
              A healthier way now has a seat at the table.
            </h2>
            <p className="text-[#164E40] font-semibold mb-12 text-lg md:text-xl leading-relaxed max-w-xl">
              Our AI understands your cravings, diet, and budget to create a list that's as smart as it is delicious.
            </p>

            <div className="space-y-8">
              {[
                { title: "Personalized", desc: "Customized to your exact taste buds." },
                { title: "Optimized", desc: "Smart cart sorting for the best prices." },
                { title: "Seamless", desc: "From prompt to pantry in minutes." }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-6 group">
                  <span className="w-12 h-12 flex-shrink-0 rounded-md bg-[#164E40] text-white flex items-center justify-center text-xl border-brutal border-black shadow-neo group-hover:-translate-y-0.5 transition-transform">✨</span>
                  <div>
                    <h4 className="text-xl font-black text-[#164E40] mb-1">{item.title}</h4>
                    <p className="text-[#164E40]/80 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#FDFBF6] p-6 md:p-8 rounded-2xl border-brutal border-black shadow-neo-lg">
            <h3 className="text-2xl md:text-3xl font-black text-[#164E40] mb-8 text-center">Your Custom Menu</h3>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-[#164E40]/80 uppercase tracking-widest mb-3">What are you craving?</label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. A comforting Sunday brunch with pancakes and fresh fruits..."
                  className="input-magic min-h-[100px] text-lg py-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#164E40]/60 uppercase tracking-widest">Cuisine Style</label>
                  <select name="cuisine" value={filters.cuisine} onChange={handleFilterChange} className="input-magic py-1.5 px-3 rounded-xl text-sm cursor-pointer hover:border-[#164E40]/40 transition-colors">
                    <option value="Indian">Indian</option>
                    <option value="Punjabi">Punjabi</option>
                    <option value="South Indian">South Indian</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Italian">Italian</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#164E40]/60 uppercase tracking-widest">Meal Setting</label>
                  <select name="mealType" value={filters.mealType} onChange={handleFilterChange} className="input-magic py-1.5 px-3 rounded-xl text-sm cursor-pointer hover:border-[#164E40]/40 transition-colors">
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#164E40]/60 uppercase tracking-widest">Dietary Focus</label>
                  <select name="diet" value={filters.diet} onChange={handleFilterChange} className="input-magic py-1.5 px-3 rounded-xl text-sm cursor-pointer hover:border-[#164E40]/40 transition-colors">
                    <option value="Veg">Pure Vegetarian</option>
                    <option value="Non-Veg">Non-Vegetarian</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#164E40]/60 uppercase tracking-widest">Expected Budget (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#164E40]/40 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      name="budget"
                      value={filters.budget}
                      onChange={handleFilterChange}
                      placeholder="500"
                      className="input-magic py-1.5 pl-7 pr-3 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>


              {error && (
                <div className="bg-[#ffe5e5] text-[#8b0000] p-4 rounded-lg text-center border-brutal border-black font-bold shadow-neo-sm">
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full btn-primary text-xl md:text-2xl flex items-center justify-center gap-3 py-5 md:py-6"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Crafting Menu...</span>
                  </>
                ) : "Generate"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
