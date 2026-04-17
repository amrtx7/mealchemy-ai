import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useMeals } from "../context/MealContext";

export default function Cart() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const { cart, totalCost, meals, query, constraints } = useMeals();

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/meals/save", { query: query || "Generated Meal Plan", meals: meals.length ? meals : [{meal: "Custom Plan", ingredients: []}], cart, constraints, totalCost });
      navigate("/history");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAgain = () => {
    navigate("/");
  };

  const itemsByStore = cart.reduce((acc, item) => {
    const store = item.store || "Other";
    if (!acc[store]) acc[store] = [];
    acc[store].push(item);
    return acc;
  }, {});

  const totalItems = cart.length;

  return (
    <section className="max-w-6xl mx-auto my-16 px-6">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-serif text-[#164E40] mb-4">Optimized Grocery Cart</h1>
        <p className="text-[#164E40] opacity-80 text-lg">Smartly organized to save you time and money.</p>
      </div>

      {Object.keys(itemsByStore).length === 0 ? (
        <div className="text-center py-20 bg-[#F4EFE5] rounded-3xl border border-[#E8DDCA]">
          <p className="text-[#164E40] opacity-70 text-lg mb-6">Your cart is empty. Please select meals to generate a cart.</p>
          <button className="btn-primary" onClick={handleGenerateAgain}>Start Over ✨</button>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(itemsByStore).map(([store, items]) => (
            <div key={store} className="bg-[#eeae5c] p-8 md:p-10 rounded-[2.5rem] shadow-sm">
              <div className="bg-[#FDFBF6] rounded-full inline-flex px-6 py-2 items-center gap-3 mb-8 shadow-sm">
                <span className="text-[#E79B48] text-xl">🏪</span> 
                <h2 className="text-2xl font-serif font-bold text-[#164E40]">{store}</h2>
              </div>
              
              <div className="flex flex-wrap gap-5 justify-center md:justify-start">
                {items.map((item, idx) => (
                  <article
                    key={`${item.name}-${idx}`}
                    className="w-48 bg-[#FDFBF6] border-2 border-transparent hover:border-[#164E40]/20 p-5 rounded-3xl flex flex-col justify-between shadow-md transition-all text-center"
                  >
                    <div>
                      <div className="w-14 h-14 rounded-full bg-[#F4EFE5] flex items-center justify-center mx-auto mb-4 border border-[#E8DDCA]">
                        <span className="text-2xl">🥬</span>
                      </div>
                      <h3 className="font-bold text-[#164E40] text-lg capitalize leading-tight mb-1">{item.name}</h3>
                      <p className="text-sm text-[#164E40]/60 mb-4">{item.amount} {item.unit}</p>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-[#E8DDCA]">
                      <p className="text-[#164E40]/60 text-xs uppercase tracking-widest font-bold mb-1">Price</p>
                      <p className="text-2xl font-serif font-bold text-[#E79B48]">₹{item.price}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-16 bg-[#F4EFE5] p-8 md:p-10 rounded-[2.5rem] border border-[#E8DDCA] flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
            <div className="text-center md:text-left">
              <p className="text-[#164E40]/70 font-bold uppercase tracking-wider text-sm mb-2">Cart Summary</p>
              <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2 sm:gap-6">
                <p className="text-[#164E40] font-medium text-lg">Total Items: <span className="font-serif font-bold text-2xl">{totalItems}</span></p>
                <div className="hidden sm:block w-px h-6 bg-[#E8DDCA]"></div>
                <p className="text-[#164E40] font-medium text-lg">Total Cost: <span className="font-serif font-bold text-[#E79B48] text-4xl">₹{totalCost}</span></p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <button 
                className="btn-secondary whitespace-nowrap"
                onClick={handleGenerateAgain}
              >
                Start Over
              </button>
              <button 
                className="btn-primary whitespace-nowrap disabled:opacity-50"
                onClick={handleSave}
                disabled={saving || cart.length === 0}
              >
                {saving ? "Saving..." : "Save List ✨"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
