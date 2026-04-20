import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !user.onboardingCompleted && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}
