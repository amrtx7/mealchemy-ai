import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <section className="max-w-md mx-auto mt-12 card p-6 text-center">
      <h1 className="text-xl font-bold mb-4">
        Welcome to <span className="brand-text">Mealchemy AI</span>
      </h1>
      <form onSubmit={submit} className="space-y-3 text-left">
        <input
          className="input-magic"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input-magic"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        <button className="w-full btn-primary">Login</button>
      </form>
      <p className="text-sm mt-4 theme-muted-text font-semibold">
        New user?{" "}
        <Link className="font-black underline decoration-2 underline-offset-4 text-[var(--link)]" to="/signup">
          Create account
        </Link>
      </p>
    </section>
  );
}
