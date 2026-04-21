import { createContext, useContext, useState } from "react";

const MealContext = createContext(null);

export function MealProvider({ children }) {
  const [query, setQuery] = useState("");
  const [meals, setMeals] = useState([]);
  const [cart, setCart] = useState([]);
  const [constraints, setConstraints] = useState({});
  const [totalCost, setTotalCost] = useState(0);
  const [cartSummary, setCartSummary] = useState(null);
  const [ingredients, setIngredients] = useState([]); // merged raw ingredients before cart
  const [liveCheck, setLiveCheck] = useState({
    results: [],
    priorityIngredients: [],
    hasLiveResults: false,
    cartPreview: null,
    pincode: "",
  });

  return (
    <MealContext.Provider
      value={{
        query,
        setQuery,
        meals,
        setMeals,
        cart,
        setCart,
        constraints,
        setConstraints,
        totalCost,
        setTotalCost,
        cartSummary,
        setCartSummary,
        ingredients,
        setIngredients,
        liveCheck,
        setLiveCheck,
      }}
    >
      {children}
    </MealContext.Provider>
  );
}

export function useMeals() {
  const ctx = useContext(MealContext);
  if (!ctx) throw new Error("useMeals must be used within MealProvider");
  return ctx;
}
