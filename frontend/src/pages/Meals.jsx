import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useMeals } from "../context/MealContext";

export default function Meals() {
  const navigate = useNavigate();
  const [loadingCart, setLoadingCart] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const { meals, setCart, setTotalCost, constraints, setMeals } = useMeals();

  const toggleSelection = (idx) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter(i => i !== idx));
    } else {
      setSelectedIndices([...selectedIndices, idx]);
    }
  };

  const proceedToCart = async () => {
    if (selectedIndices.length === 0) return;
    setLoadingCart(true);
    try {
      const selectedMeals = selectedIndices.map(idx => meals[idx]);
      const allIngredients = selectedMeals.flatMap(meal => meal.ingredients || []);
      
      const payload = {
        ingredients: allIngredients,
        constraints
      };
      
      const { data } = await api.post("/cart/optimize", payload);
      setMeals(selectedMeals);
      setCart(data.cartItems || []);
      setTotalCost(data.totalCost || 0);
      navigate("/cart");
    } catch (error) {
      console.error("Failed to optimize cart", error);
    } finally {
      setLoadingCart(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto my-16 px-6">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-serif text-[#164E40] mb-4">Curate Your Menu</h1>
        <p className="text-[#164E40] opacity-80 text-lg">Select the dishes that catch your eye to build your grocery cart.</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
        {meals.map((meal, idx) => {
          const isSelected = selectedIndices.includes(idx);
          return (
            <article 
              key={`${meal.meal}-${idx}`} 
              onClick={() => toggleSelection(idx)}
              className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer relative animate-fade-in-up shadow-sm hover:shadow-xl hover:-translate-y-2 duration-500 ${
                isSelected 
                  ? 'border-[#E79B48] bg-[#FDFBF6] shadow-[0_8px_30px_rgba(231,155,72,0.15)] ring-1 ring-[#E79B48]' 
                  : 'border-[#E8DDCA] bg-[#F4EFE5] hover:border-[#164E40]/30'
              }`}
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-[#164E40] mb-3">{meal.meal}</h3>
                  <div className="flex gap-2">
                    {meal.cuisine && <span className="px-3 py-1 text-xs font-semibold bg-[#164E40] text-white rounded-full tracking-wide">{meal.cuisine}</span>}
                    {meal.mealType && <span className="px-3 py-1 text-xs font-semibold bg-[#E79B48] text-white rounded-full tracking-wide">{meal.mealType}</span>}
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'border-[#E79B48] bg-[#E79B48]' : 'border-[#E8DDCA] bg-white'
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
      
      <div className="mt-16 flex justify-center">
        <button
          className="btn-primary w-full md:w-auto px-12 py-4 text-lg"
          onClick={proceedToCart}
          disabled={loadingCart || selectedIndices.length === 0}
        >
          {loadingCart ? "Calculating Totals..." : "Proceed to Cart ✨"}
        </button>
      </div>
    </section>
  );
}
