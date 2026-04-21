import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import PageDecor from "./components/PageDecor";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Meals from "./pages/Meals";
import LiveCheck from "./pages/LiveCheck";
import Cart from "./pages/Cart";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";

const DECOR_BOOST_PATHS = new Set(["/meals", "/live-check", "/cart", "/dashboard", "/history"]);
const NO_DECOR_PATHS = new Set(["/onboarding"]);

export default function App() {
  const { pathname } = useLocation();
  const decorBoost = DECOR_BOOST_PATHS.has(pathname);
  const hideDecor = NO_DECOR_PATHS.has(pathname);

  return (
    <div className="relative min-h-screen flex flex-col">
      {!hideDecor && <PageDecor boost={decorBoost} />}
      <NavBar />
      <main className="relative z-10 px-4 pb-10 overflow-x-hidden flex-grow">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/onboarding"
            element={
              <PrivateRoute>
                <Onboarding />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
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
            path="/live-check"
            element={
              <PrivateRoute>
                <LiveCheck />
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
      <Footer />
    </div>
  );
}
