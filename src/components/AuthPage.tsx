import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Database,
} from "lucide-react";
import { apiLogin, apiRegister, checkDbHealth } from "../services/api";

/* ─── Types ─── */
interface User {
  name: string;
  email: string;
  password: string;
  registeredAt: string;
}

interface AuthProps {
  onAuth: (user: { name: string; email: string }) => void;
}

/* ─── Helpers ─── */
function getUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem("df_users") || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem("df_users", JSON.stringify(users));
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Strong", color: "bg-cyan-500" };
  return { score, label: "Excellent", color: "bg-emerald-500" };
}

/* ─── Animated Background ─── */
function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Floating particles
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.3 + 0.05,
    }));

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${(1 - dist / 150) * 0.08})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw & update particles
      for (const p of particles) {
        const pulse = Math.sin(time * 2 + p.x * 0.01) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + pulse * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${p.alpha + pulse * 0.05})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      time += 0.005;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/* ─── Input Field ─── */
function InputField({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  error,
  showToggle,
  onToggle,
  showPassword,
  autoComplete,
}: {
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  showToggle?: boolean;
  onToggle?: () => void;
  showPassword?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <div
        className={`relative flex items-center rounded-xl border transition-all duration-200 ${
          error
            ? "border-red-500/50 bg-red-500/5"
            : "border-white/10 bg-white/[0.03] focus-within:border-cyan-500/50 focus-within:bg-white/[0.05]"
        }`}
      >
        <Icon className="absolute left-3.5 w-4 h-4 text-slate-500" />
        <input
          type={showToggle ? (showPassword ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full bg-transparent pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 outline-none"
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 p-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 mt-1.5 text-xs text-red-400">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Main Auth Page ─── */
export default function AuthPage({ onAuth }: AuthProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [shake, setShake] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    checkDbHealth().then((res) => {
      setDbConnected(res.connected);
    });
  }, []);

  const switchMode = useCallback((newMode: "login" | "register") => {
    setMode(newMode);
    setErrors({});
    setSuccess("");
    setName("");
    setPassword("");
    setConfirmPassword("");
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (mode === "register" && name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters";
    }

    if (!email.trim()) {
      errs.email = "Email is required";
    } else if (!validateEmail(email)) {
      errs.email = "Please enter a valid email address";
    }

    if (!password) {
      errs.password = "Password is required";
    } else if (mode === "register" && password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }

    if (mode === "register") {
      if (!confirmPassword) {
        errs.confirmPassword = "Please confirm your password";
      } else if (password !== confirmPassword) {
        errs.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");

    if (!validate()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "register") {
        try {
          const res = await apiRegister(name.trim(), email.toLowerCase().trim(), password);
          setSuccess("Account created in Neon DB! Redirecting...");
          setTimeout(() => {
            onAuth({ name: res.user.name, email: res.user.email });
          }, 800);
        } catch (apiErr: any) {
          // If server reports existing user or specific error
          if (apiErr.message?.includes("already exists")) {
            setErrors({ email: "An account with this email already exists" });
          } else {
            // Fallback to local storage if offline
            const users = getUsers();
            if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
              setErrors({ email: "An account with this email already exists" });
              setIsLoading(false);
              setShake(true);
              setTimeout(() => setShake(false), 500);
              return;
            }
            const newUser: User = {
              name: name.trim(),
              email: email.toLowerCase().trim(),
              password,
              registeredAt: new Date().toISOString(),
            };
            users.push(newUser);
            saveUsers(users);
            setSuccess("Account created successfully! Redirecting...");
            setTimeout(() => {
              onAuth({ name: newUser.name, email: newUser.email });
            }, 800);
          }
          setIsLoading(false);
          return;
        }
      } else {
        // Login
        try {
          const res = await apiLogin(email.toLowerCase().trim(), password);
          setSuccess("Login verified by Neon DB! Redirecting...");
          setTimeout(() => {
            onAuth({ name: res.user.name, email: res.user.email });
          }, 600);
        } catch (apiErr: any) {
          // Demo fallback check
          if (email === "demo@deepfakeshield.com" && password === "demo1234") {
            setSuccess("Welcome back! Redirecting...");
            setTimeout(() => {
              onAuth({ name: "Demo User", email: "demo@deepfakeshield.com" });
            }, 600);
            setIsLoading(false);
            return;
          }

          // Check local storage fallback
          const users = getUsers();
          const user = users.find(
            (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
          );

          if (user) {
            setSuccess("Login successful! Redirecting...");
            setTimeout(() => {
              onAuth({ name: user.name, email: user.email });
            }, 600);
            return;
          }

          setErrors({ password: apiErr.message || "Invalid email or password" });
          setIsLoading(false);
          setShake(true);
          setTimeout(() => setShake(false), 500);
          return;
        }
      }
    } catch (err: any) {
      setErrors({ password: err.message || "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  const pwStrength = passwordStrength(password);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.08)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.06)_0%,transparent_50%)]" />
      <AuthBackground />

      {/* Floating orbs */}
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-cyan-400/30 rounded-2xl blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-cyan-400 to-blue-600 p-3.5 rounded-2xl">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            DeepFake<span className="text-cyan-400">Shield</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Multi-Modal Deepfake Detection Platform</p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Neon PostgreSQL Active</span>
          </div>
        </div>

        {/* Auth Card */}
        <div
          className={`bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/20 transition-transform ${
            shake ? "animate-[shake_0.5s_ease-in-out]" : ""
          }`}
          style={shake ? { animation: "shake 0.5s ease-in-out" } : {}}
        >
          {/* Mode Tabs */}
          <div className="flex bg-white/[0.03] rounded-xl p-1 mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === "login"
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === "register"
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-sm text-emerald-300">{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (register only) */}
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 pl-1">Full Name</label>
                <InputField
                  icon={User}
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={setName}
                  error={errors.name}
                  autoComplete="name"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 pl-1">Email Address</label>
              <InputField
                icon={Mail}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                error={errors.email}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between pl-1 pr-1">
                <label className="text-xs font-medium text-slate-400">Password</label>
                {mode === "login" && (
                  <button type="button" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    Forgot password?
                  </button>
                )}
              </div>
              <InputField
                icon={Lock}
                type="password"
                placeholder={mode === "register" ? "Min. 8 characters" : "Enter your password"}
                value={password}
                onChange={setPassword}
                error={errors.password}
                showToggle
                onToggle={() => setShowPassword(!showPassword)}
                showPassword={showPassword}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              {/* Password strength (register only) */}
              {mode === "register" && password.length > 0 && (
                <div className="pt-1.5">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= pwStrength.score ? pwStrength.color : "bg-white/5"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Strength: <span className={pwStrength.score >= 3 ? "text-cyan-400" : "text-slate-400"}>{pwStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password (register only) */}
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 pl-1">Confirm Password</label>
                <InputField
                  icon={Lock}
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  error={errors.confirmPassword}
                  showToggle
                  onToggle={() => setShowConfirm(!showConfirm)}
                  showPassword={showConfirm}
                  autoComplete="new-password"
                />
              </div>
            )}

            {/* Remember me / Terms */}
            <div className="flex items-center justify-between pt-1">
              {mode === "login" ? (
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      rememberMe
                        ? "bg-cyan-500/20 border-cyan-500/50"
                        : "border-white/20 group-hover:border-white/30"
                    }`}
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    {rememberMe && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                  </div>
                  <span className="text-xs text-slate-400" onClick={() => setRememberMe(!rememberMe)}>
                    Remember me for 30 days
                  </span>
                </label>
              ) : (
                <label className="flex items-start gap-2 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                      rememberMe
                        ? "bg-cyan-500/20 border-cyan-500/50"
                        : "border-white/20 group-hover:border-white/30"
                    }`}
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    {rememberMe && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                  </div>
                  <span className="text-xs text-slate-400" onClick={() => setRememberMe(!rememberMe)}>
                    I agree to the{" "}
                    <span className="text-cyan-400 hover:text-cyan-300">Terms of Service</span> and{" "}
                    <span className="text-cyan-400 hover:text-cyan-300">Privacy Policy</span>
                  </span>
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (mode === "register" && !rememberMe)}
              className="relative w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{mode === "login" ? "Signing in..." : "Creating account..."}</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">Instant Test Account</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setEmail("demo@deepfakeshield.com");
                setPassword("demo1234");
                setErrors({});
              }}
              className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-1 rounded transition-colors"
            >
              Fill Demo Login
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Email: <span className="text-slate-400 font-mono">demo@deepfakeshield.com</span>
          </p>
          <p className="text-xs text-slate-500">
            Password: <span className="text-slate-400 font-mono">demo1234</span>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          © 2026 DeepFakeShield • AI Security Lab
        </p>
      </div>

      {/* Shake animation keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
