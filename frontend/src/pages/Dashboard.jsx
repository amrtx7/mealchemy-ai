import { useEffect, useState } from "react";
import api from "../api/client";

export default function Dashboard() {
  const [data, setData] = useState({ todayMealPlan: null, recentMeals: [], totalSpending: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/meals/dashboard");
        const recent = res.data.recentMeals || [];
        const total = recent.reduce((sum, curr) => sum + (curr.totalCost || 0), 0);
        setData({ 
          todayMealPlan: res.data.todayMealPlan, 
          recentMeals: recent.slice(0, 3), 
          totalSpending: total 
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      }
    }
    load();
  }, []);

  return (
    <section className="max-w-6xl mx-auto my-16 px-6 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#FDFBF6] p-10 rounded-[2.5rem] border border-[#E8DDCA] shadow-sm">
        <div>
          <h1 className="text-5xl font-serif font-bold text-[#164E40] mb-2 tracking-tight">Dashboard ✨</h1>
          <p className="text-[#164E40]/70 font-medium text-lg">Welcome back to your magical kitchen.</p>
        </div>
        <div className="mt-8 md:mt-0 bg-[#F4EFE5] py-5 px-10 rounded-full border border-[#E8DDCA] text-center">
          <p className="text-[#164E40]/60 text-xs font-bold uppercase tracking-widest mb-1">Total Savings/Spending</p>
          <p className="text-3xl font-serif font-bold text-[#E79B48]">₹{data.totalSpending}</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center border border-red-200">{error}</div>}
      
      <div className="grid md:grid-cols-2 gap-10">
        <div className="bg-[#eeae5c] p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden">
          <h2 className="text-3xl font-serif font-bold text-[#164E40] mb-8 flex items-center gap-3">
            <span className="bg-[#FDFBF6] p-3 rounded-full shadow-sm text-xl">☀️</span> Today's Plan
          </h2>
          {data.todayMealPlan ? (
            <div className="bg-[#FDFBF6] p-8 rounded-3xl shadow-sm">
              <h3 className="font-serif font-bold text-2xl text-[#164E40] mb-5">{data.todayMealPlan.query || "Generated Plan"}</h3>
              <div className="space-y-4">
                {(data.todayMealPlan.meals || []).map((m, idx) => (
                  <div key={idx} className="p-4 bg-[#F4EFE5] rounded-xl border border-[#E8DDCA] text-[#164E40] font-medium flex justify-between shadow-sm">
                    <span>{m.meal}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#FDFBF6] p-10 rounded-3xl text-center border border-dashed border-[#E8DDCA]">
              <p className="text-[#164E40]/70 font-medium">No meals generated today.</p>
            </div>
          )}
        </div>

        <div className="bg-[#FDFBF6] p-10 rounded-[2.5rem] border border-[#E8DDCA] shadow-sm">
          <h2 className="text-3xl font-serif font-bold text-[#164E40] mb-8 flex items-center gap-3">
            <span className="bg-[#F4EFE5] p-3 rounded-full text-xl border border-[#E8DDCA]">🕒</span> Recent Plans
          </h2>
          {data.recentMeals.length > 0 ? (
            <ul className="space-y-5">
              {data.recentMeals.map((m) => (
                <li key={m._id} className="p-6 bg-[#F4EFE5] rounded-2xl border border-[#E8DDCA] flex justify-between items-center shadow-sm hover:border-[#164E40]/20 transition-all">
                  <div>
                    <p className="font-bold font-serif text-xl text-[#164E40] mb-1">{m.query || "Generated Plan"}</p>
                    <p className="text-sm font-medium text-[#164E40]/60">{new Date(m.createdAt).toLocaleString(undefined, { dateStyle: 'medium' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-serif text-2xl text-[#E79B48]">₹{m.totalCost || 0}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
             <div className="p-10 rounded-3xl text-center border-2 border-dashed border-[#E8DDCA] bg-[#F4EFE5]/50">
               <p className="text-[#164E40]/70 font-medium">No history found.</p>
             </div>
          )}
        </div>
      </div>
    </section>
  );
}
