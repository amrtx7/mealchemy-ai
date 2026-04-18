import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import PageDecor from "./components/PageDecor";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Meals from "./pages/Meals";
import IngredientSelection from "./pages/IngredientSelection";
import Cart from "./pages/Cart";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

const DECOR_BOOST_PATHS = new Set(["/meals", "/ingredients", "/cart", "/dashboard", "/history"]);

export default function App() {
  const { pathname } = useLocation();
  const decorBoost = DECOR_BOOST_PATHS.has(pathname);

  return (
    <div className="relative min-h-screen">
      <PageDecor boost={decorBoost} />
      <NavBar />
      <main className="relative z-10 px-4 pb-10 overflow-x-hidden">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/meals"
            element={
              <PrivateRoute>
                <Meals />
              </PrivateRoute>
            }
          />
          <Route
            path="/ingredients"
            element={
              <PrivateRoute>
                <IngredientSelection />
              </PrivateRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <PrivateRoute>
                <Cart />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute>
                <History />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
