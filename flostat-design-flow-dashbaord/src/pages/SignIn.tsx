import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import flostatLogo from "./images/flostat-logo.webp";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/firebase";
import { AppDispatch } from "@/store";
import { useDispatch } from "react-redux";
import { googleOuth } from "@/lib/operations/authApis";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { login } = useAuth();

  // Parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // dispatch(googleOuth(user.email,user,navigate));
      if (result) {
        dispatch(googleOuth(user.email, user, navigate));
      }
    } catch (error) {
      console.error("Error f ", error);
      throw error;
    }
    toast.success("Google Auth clicked (implement logic)");
  };
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password,navigate);
      if (success) {
        toast.success("Login successful!");
        // navigate("/organizations");
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--aqua)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--aqua)) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
            animation: "gridMove 20s linear infinite",
          }}
        />
      </div>

      {/* Animated Background Logos with Parallax */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          transition: "transform 0.3s ease-out",
        }}
      >
        {/* Center Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20">
          <div className="relative w-full h-full">
            <img
              src={flostatLogo}
              alt="Flostat Logo"
              className="w-full h-full object-contain animate-float"
            />
            <div
              className="absolute inset-0 bg-[hsl(var(--aqua))]/40 animate-float"
              style={{ mixBlendMode: "multiply" }}
            />
          </div>
        </div>

        {/* Left Side Logo */}
        <div className="absolute -left-20 top-1/4 w-[500px] h-[500px] opacity-20">
          <div
            className="relative w-full h-full"
            style={{ animationDelay: "1s" }}
          >
            <img
              src={flostatLogo}
              alt="Flostat Logo"
              className="w-full h-full object-contain animate-float"
              style={{ animationDelay: "1s" }}
            />
            <div
              className="absolute inset-0 bg-[hsl(var(--aqua))]/40 animate-float"
              style={{ mixBlendMode: "multiply", animationDelay: "1s" }}
            />
          </div>
        </div>

        {/* Right Side Logo */}
        <div className="absolute -right-20 bottom-1/4 w-[500px] h-[500px] opacity-20">
          <div
            className="relative w-full h-full"
            style={{ animationDelay: "2s" }}
          >
            <img
              src={flostatLogo}
              alt="Flostat Logo"
              className="w-full h-full object-contain animate-float"
              style={{ animationDelay: "2s" }}
            />
            <div
              className="absolute inset-0 bg-[hsl(var(--aqua))]/40 animate-float"
              style={{ mixBlendMode: "multiply", animationDelay: "2s" }}
            />
          </div>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/80 pointer-events-none" />

      {/* Enhanced Floating Particles with Ripple */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-[hsl(var(--aqua))]/20 rounded-full animate-ping"
          style={{ animationDuration: "3s" }}
        />
        <div
          className="absolute top-1/3 right-1/3 w-3 h-3 bg-[hsl(var(--aqua))]/10 rounded-full animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-[hsl(var(--aqua))]/15 rounded-full animate-ping"
          style={{ animationDuration: "5s" }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-4 h-4 bg-[hsl(var(--aqua))]/8 rounded-full animate-pulse"
          style={{ animationDuration: "6s" }}
        />
      </div>

      {/* Morphing Blob Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[hsl(var(--aqua))]/10 rounded-full blur-3xl animate-blob" />
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[hsl(var(--aqua))]/10 rounded-full blur-3xl animate-blob"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Card with Glow Effect */}
      <Card className="w-full max-w-md shadow-2xl border-border/50 backdrop-blur-sm bg-card/95 animate-fadeIn relative z-10 group">
        <div className="relative">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex justify-center mb-4">
              <img
                src={flostatLogo}
                alt="Flostat Logo"
                className="h-16 w-auto animate-float hover:scale-110 transition-transform duration-300 cursor-pointer"
              />
            </div>
            <CardTitle className="text-center text-2xl bg-gradient-to-r from-foreground via-[hsl(var(--aqua))] to-foreground bg-clip-text text-transparent font-bold">
              Welcome Back
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground animate-typewriter overflow-hidden whitespace-nowrap border-r-2 border-[hsl(var(--aqua))] mx-auto">
              Sign in to your account
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="space-y-2 animate-fadeIn"
              style={{ animationDelay: "0.2s" }}
            >
              <label className="text-sm font-medium">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[hsl(var(--aqua))] transition-colors" />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  className="pl-9 focus:ring-2 focus:ring-[hsl(var(--aqua))]/20 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>

            <div
              className="space-y-2 animate-fadeIn"
              style={{ animationDelay: "0.3s" }}
            >
              <label className="text-sm font-medium">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[hsl(var(--aqua))] transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9 focus:ring-2 focus:ring-[hsl(var(--aqua))]/20 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[hsl(var(--aqua))] transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div
              className="flex items-center justify-between animate-fadeIn"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-[hsl(var(--aqua))] hover:underline font-medium"
                onClick={() =>
                  toast.info("Password reset feature coming soon!")
                }
              >
                Forgot password?
              </button>
            </div>

            <Button
              className="w-full gap-2 bg-[hsl(var(--aqua))] hover:bg-[hsl(var(--aqua))]/90 text-white shadow-lg hover:shadow-xl hover:shadow-[hsl(var(--aqua))]/20 transition-all animate-fadeIn"
              style={{ animationDelay: "0.5s" }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              Sign In
            </Button>

            <div
              className="relative my-4 animate-fadeIn"
              style={{ animationDelay: "0.55s" }}
            >
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div
              className="w-full animate-fadeIn"
              style={{ animationDelay: "0.6s" }}
            >
              <Button
                variant="outline"
                className="w-full gap-2 hover:bg-[hsl(var(--aqua))]/10 hover:text-[hsl(var(--aqua))] hover:border-[hsl(var(--aqua))]/50 transition-all"
              >
                <button
                  onClick={handleGoogleAuth}
                  className="w-full bg-white border border-gray-300 text-black font-semibold py-2 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  Continue with Google
                </button>
              </Button>
            </div>

            <div
              className="text-center text-sm text-soft-muted animate-fadeIn mt-4"
              style={{ animationDelay: "0.65s" }}
            >
              Don't have an account?{" "}
              <button
                className="text-[hsl(var(--aqua))] hover:underline font-medium"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </button>
            </div>

            {/* Terms & Privacy */}
            <div
              className="text-center text-xs text-muted-foreground pt-2 animate-fadeIn"
              style={{ animationDelay: "0.7s" }}
            >
              By signing in, you agree to our{" "}
              <button
                className="text-[hsl(var(--aqua))] hover:underline"
                onClick={() => toast.info("Terms coming soon")}
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                className="text-[hsl(var(--aqua))] hover:underline"
                onClick={() => toast.info("Privacy Policy coming soon")}
              >
                Privacy Policy
              </button>
            </div>
          </CardContent>
        </div>
      </Card>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0px, 0px) rotate(0deg);
          }
          33% {
            transform: translate(10px, -15px) rotate(2deg);
          }
          66% {
            transform: translate(-10px, -5px) rotate(-1deg);
          }
        }
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-blob {
          animation: blob 7s ease-in-out infinite;
        }
        .animate-typewriter {
          width: 0;
          animation: typewriter 3s steps(30, end) forwards, blink .75s step-end infinite;
        }
        @keyframes typewriter {
          from { width: 0 }
          to { width: 100% }
        }
        @keyframes blink {
          from, to { border-color: transparent }
          50% { border-color: hsl(var(--aqua)) }
        }
      `}</style>
    </div>
  );
}
