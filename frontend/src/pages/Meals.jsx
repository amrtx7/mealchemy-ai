import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useMeals } from "../context/MealContext";

export default function Meals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIndices, setSelectedIndices] = useState([]);
  const { meals, setMeals, setIngredients, constraints } = useMeals();

  const toggleSelection = (idx) => {
    setSelectedIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const proceedToIngredients = async () => {
    if (selectedIndices.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const selectedMeals = selectedIndices.map(idx => meals[idx]);
      // Extract dish names to send to the ingredient conversion API
      const dishes = selectedMeals.map(m => m.meal).filter(Boolean);

      const { data } = await api.post("/meal/ingredients", { dishes, constraints });
      setMeals(selectedMeals);
      setIngredients(data.ingredients || []);
      navigate("/ingredients");
    } catch (err) {
      setError("Failed to fetch ingredients. Please try again.");
      console.error("Ingredient fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto my-16 px-6">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-[#164E40] mb-4 drop-shadow-[2px_2px_0_#000]">Curate Your Menu</h1>
        <p className="text-[#164E40] font-semibold text-lg max-w-2xl mx-auto">Select the dishes that catch your eye to build your grocery cart.</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
        {meals.map((meal, idx) => {
          const isSelected = selectedIndices.includes(idx);
          return (
            <article 
              key={`${meal.meal}-${idx}`} 
              onClick={() => toggleSelection(idx)}
              className={`p-6 md:p-8 rounded-2xl border-brutal border-black transition-all cursor-pointer relative animate-fade-in-up shadow-neo hover:-translate-y-1 duration-200 ${
                isSelected
                  ? 'bg-[#FDFBF6] shadow-neo-lg -translate-y-1 ring-0 outline outline-[3px] outline-[#E79B48] -outline-offset-[3px]'
                  : 'bg-[#F4EFE5] hover:shadow-neo-lg'
              }`}
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-[#164E40] mb-3">{meal.meal}</h3>
                  <div className="flex flex-wrap gap-2">
                    {meal.cuisine && <span className="px-2.5 py-1 text-xs font-black bg-[#164E40] text-white rounded-md tracking-wide border-2 border-black shadow-neo-sm">{meal.cuisine}</span>}
                    {meal.mealType && <span className="px-2.5 py-1 text-xs font-black bg-[#E79B48] text-black rounded-md tracking-wide border-2 border-black shadow-neo-sm">{meal.mealType}</span>}
                  </div>
                </div>
                <div className={`w-9 h-9 rounded-md border-brutal border-black flex items-center justify-center transition-all shadow-neo-sm ${
                  isSelected ? 'bg-[#E79B48]' : 'bg-white'
                }`}>
                  {isSelected && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                </div>
              </div>
              
              <h4 className="text-sm font-bold text-[#164E40] mb-3 uppercase tracking-wider opacity-80">Key Ingredients</h4>
              <ul className="list-none space-y-2 text-[#164E40]/90 font-medium">
                {(meal.ingredients || []).map((it) => (
                  <li key={`${meal.meal}-${it}`} className="flex items-center gap-2">
                    <span className="text-[#E79B48] text-lg leading-none">•</span> {it}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
      
      <div className="mt-16 flex flex-col items-center gap-4">
        {error && (
          <p className="text-[#8b0000] font-bold bg-[#ffe5e5] px-6 py-3 rounded-lg border-brutal border-black shadow-neo-sm">
            {error}
          </p>
        )}
        <button
          className="btn-primary w-full md:w-auto px-12 py-4 text-lg"
          onClick={proceedToIngredients}
          disabled={loading || selectedIndices.length === 0}
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Analysing Dishes...
            </span>
          ) : (
            `Select Ingredients ✨ (${selectedIndices.length} dish${selectedIndices.length !== 1 ? "es" : ""} selected)`
          )}
        </button>
      </div>
    </section>
  );
}
