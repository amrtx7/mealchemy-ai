import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await signup(name, email, password);
      navigate(user.onboardingCompleted ? "/" : "/onboarding");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <section className="max-w-md mx-auto mt-12 card p-6">
      <h1 className="text-xl font-bold mb-4">Create your <span className="brand-text">Mealchemy</span> account ⚗️</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="input-magic" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input-magic" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          className="input-magic"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        <button className="w-full btn-primary">Sign up</button>
      </form>
      <p className="text-sm mt-4 theme-muted-text font-semibold">
        Already have an account?{" "}
        <Link className="font-black underline decoration-2 underline-offset-4 text-[var(--link)]" to="/login">
          Login
        </Link>
      </p>
    </section>
  );
}
