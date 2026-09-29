import { useState, useCallback } from "react";
import AuthPage from "./components/AuthPage";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Architecture from "./components/Architecture";
import Demo from "./components/Demo";
import Results from "./components/Results";
import TechnicalDetails from "./components/TechnicalDetails";
import Footer from "./components/Footer";

interface AuthUser {
  name: string;
  email: string;
}

const AUTH_KEY = "df_auth_user";

function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleAuth = useCallback((authUser: AuthUser) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setUser(authUser);
      localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
      setIsTransitioning(false);
    }, 300);
  }, []);

  const handleLogout = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setUser(null);
      localStorage.removeItem(AUTH_KEY);
      setIsTransitioning(false);
      window.scrollTo(0, 0);
    }, 300);
  }, []);

  // If not authenticated, show auth page
  if (!user) {
    return (
      <div
        className={`transition-opacity duration-300 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <AuthPage onAuth={handleAuth} />
      </div>
    );
  }

  // Authenticated — show main app
  return (
    <div
      className={`min-h-screen bg-slate-950 text-white antialiased transition-opacity duration-300 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      <Navbar user={user} onLogout={handleLogout} />
      <Hero />
      <Architecture />
      <Demo user={user} />
      <Results />
      <TechnicalDetails />
      <Footer />
    </div>
  );
}
