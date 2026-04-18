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
    <div className="relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="abstract-circle w-96 h-96 -top-20 -left-20 animate-drift"></div>
      <div className="abstract-circle w-80 h-80 top-1/2 -right-20 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="abstract-circle w-64 h-64 bottom-10 left-1/4 animate-drift" style={{ animationDelay: '4s' }}></div>

      {/* Floating Food Elements (Inspired by Indian Cuisine) */}
      <img
        src="saras.png"
        alt="Biryani"
        className="absolute top-20 right-[5%] w-60 h-60 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-float hidden xl:block pointer-events-none"
        style={{ animationDuration: '10s' }}
      />
      <img
        src="thali1.png"
        alt="saag"
        className="absolute top-[10%] left-[2%] w-56 h-56 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] animate-drift hidden xl:block pointer-events-none"
        style={{ animationDuration: '12s' }}
      />
      <img
        src="saras.png"
        alt="Salad/Saag"
        className="absolute bottom-20 left-[5%] w-60 h-60 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-float hidden xl:block pointer-events-none"
        style={{ animationDuration: '8s' }}
      />

      <section className="max-w-7xl mx-auto mt-16 px-6 text-center relative z-10 animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif text-[#164E40] max-w-5xl mx-auto leading-tight mb-12">
          Transforming how you plan meals and make smarter food decisions.
        </h1>

        <div className="mb-24">
          <a href="#planner" className="btn-primary inline-flex items-center gap-3 text-xl px-12 py-5">
            Start Your Journey
          </a>
        </div>

        <div className="w-full max-w-5xl mx-auto h-[400px] md:h-[600px] rounded-[4rem] overflow-hidden shadow-2xl bg-[#E8DDCA] mb-20 relative border-8 border-white transition-transform hover:scale-[1.01] duration-700 group">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2000"
            alt="Delicious meal table"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#164E40]/40 to-transparent"></div>
        </div>
      </section>

      <section id="planner" className="bg-[#eeae5c] py-32 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <h2 className="text-6xl font-serif text-[#164E40] leading-tight mb-8">
              A healthier way now has a seat at the table.
            </h2>
            <p className="text-[#164E40] font-medium mb-12 opacity-80 text-xl leading-relaxed">
              Our AI understands your cravings, diet, and budget to create a list that's as smart as it is delicious.
            </p>

            <div className="space-y-8">
              {[
                { title: "Personalized", desc: "Customized to your exact taste buds." },
                { title: "Optimized", desc: "Smart cart sorting for the best prices." },
                { title: "Seamless", desc: "From prompt to pantry in minutes." }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-6 group">
                  <span className="w-12 h-12 flex-shrink-0 rounded-full bg-[#164E40] text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">✨</span>
                  <div>
                    <h4 className="text-xl font-bold text-[#164E40] mb-1">{item.title}</h4>
                    <p className="text-[#164E40]/70 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#FDFBF6] p-8 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.1)] border border-white">
            <h3 className="text-3xl font-serif text-[#164E40] mb-8 text-center font-bold">Your Custom Menu</h3>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#164E40]/60 uppercase tracking-widest mb-3">What are you craving?</label>
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
                <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-center border border-red-100 font-medium">
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full btn-primary text-2xl flex items-center justify-center gap-3 py-6 shadow-[0_20px_50px_rgba(22,78,64,0.3)] hover:shadow-[0_25px_60px_rgba(22,78,64,0.4)]"
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
