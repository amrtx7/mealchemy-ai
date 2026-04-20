import { useNavigate } from "react-router-dom";
import PersonalizationForm from "../components/PersonalizationForm";
import { useAuth } from "../context/AuthContext";

export default function Onboarding() {
  const { user, savePreferences } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-10">
      <PersonalizationForm
        initialUser={user}
        submitLabel="Finish Setup"
        onSubmit={async (payload) => {
          await savePreferences(payload);
          navigate("/");
        }}
      />
    </section>
  );
}
