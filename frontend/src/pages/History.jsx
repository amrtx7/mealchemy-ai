import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useMeals } from "../context/MealContext";

export default function History() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setCart, setTotalCost, setMeals } = useMeals();

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/meals/history");
        setHistory(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load history");
      }
    }
    load();
  }, []);

  const viewCart = (entry) => {
    setCart(entry.cart || []);
    setTotalCost(entry.totalCost || 0);
    setMeals(entry.meals || []);
    navigate("/cart");
  };

  return (
    <section className="max-w-6xl mx-auto my-16 px-6">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-serif text-[#164E40] mb-4">Meal History ✨</h1>
        <p className="text-[#164E40] opacity-80 text-lg">Your past magical meal plans and grocery trips.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center border border-red-200 mb-6">{error}</div>}
      
      {history.length === 0 && !error ? (
        <div className="bg-[#FDFBF6] p-16 rounded-[2.5rem] border border-[#E8DDCA] text-center shadow-sm">
          <p className="text-[#164E40]/70 font-medium text-lg">No meal plans saved yet. Start planning!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((entry) => (
            <article key={entry._id} className="bg-[#FDFBF6] p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-start md:items-center border border-[#E8DDCA] shadow-sm hover:border-[#164E40]/20 transition-all group">
              <div className="mb-6 md:mb-0">
                <h3 className="text-2xl font-serif font-bold text-[#164E40] mb-2">{entry.query || "Generated Plan"}</h3>
                <p className="text-sm font-medium text-[#164E40]/60 mb-5">{new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                
                <div className="flex flex-wrap gap-2">
                  {(entry.meals || []).map((meal, idx) => (
                    <span key={`${entry._id}-${idx}`} className="px-4 py-1.5 bg-[#F4EFE5] text-[#164E40] rounded-full text-xs font-bold border border-[#E8DDCA] transition-colors group-hover:bg-[#eeae5c] group-hover:border-[#eeae5c] group-hover:text-[#164E40]">
                      {meal.meal}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-start md:items-end w-full md:w-auto md:min-w-[150px]">
                <p className="text-[#164E40]/60 text-xs font-bold uppercase tracking-widest mb-1">Total Cost</p>
                <p className="text-3xl font-serif font-bold text-[#E79B48] mb-5">₹{entry.totalCost || 0}</p>
                <button 
                  onClick={() => viewCart(entry)}
                  className="btn-secondary whitespace-nowrap w-full md:w-auto py-3 px-8 text-sm"
                >
                  View Cart 🛒
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
