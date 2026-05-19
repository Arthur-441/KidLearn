import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../components/AuthProvider";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Navigation is handled by useEffect and getRedirectResult is unneeded since AuthProvider listens to onAuthStateChanged
    } catch (err: any) {
      if (
        err.code !== "auth/popup-closed-by-user" &&
        err.code !== "auth/cancelled-popup-request"
      ) {
        console.error(err);
      }
      setErrorMsg(getFriendlyMessage(err.code));
      setIsSubmitting(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation is handled by useEffect
    } catch (err: any) {
      if (err.code !== "auth/invalid-credential") {
        console.error(err);
      }
      setErrorMsg(getFriendlyMessage(err.code));
      setIsSubmitting(false);
    }
  };

  const getFriendlyMessage = (code: string) => {
    return (
      {
        "auth/popup-closed-by-user":
          "Login popup was closed. Please try again.",
        "auth/cancelled-popup-request": "Login popup. Please try again.",
        "auth/invalid-credential": "Email or password is incorrect. (Did you sign up with Google?)",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Email or password is incorrect.",
        "auth/operation-not-allowed": "Email/password login is not configured in this app.",
      }[code] || "Something went wrong. Please try again."
    );
  };

  return (
    <div className="min-h-screen font-['Nunito'] bg-gradient-to-br from-[#a8e6ff] via-[#d8f8ff] to-[#fff8e7] flex items-center justify-center p-6 relative overflow-hidden">
      <span className="fixed top-[6%] left-[5%] text-2xl opacity-55 animate-[bob_4s_ease-in-out_infinite]">
        ⭐
      </span>
      <span className="fixed top-[8%] right-[6%] text-2xl opacity-55 animate-[bob_4s_ease-in-out_infinite_0.7s]">
        🌈
      </span>
      <span className="fixed bottom-[8%] left-[5%] text-2xl opacity-55 animate-[bob_4s_ease-in-out_infinite_1.5s]">
        🎈
      </span>
      <span className="fixed bottom-[6%] right-[5%] text-2xl opacity-55 animate-[bob_4s_ease-in-out_infinite_2.2s]">
        🚀
      </span>

      <div className="w-full max-w-[400px] flex flex-col items-center gap-5 z-10">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="text-[28px] leading-none">🎈</span>
          <span className="font-['Baloo_2'] text-[22px] font-extrabold text-[#1aaee8]">
            Kid<em className="text-[#FF8C42] not-italic">Learn</em>
          </span>
        </Link>

        <div className="bg-white rounded-[20px] pt-9 px-9 pb-7 w-full shadow-[0_8px_40px_rgba(26,26,46,0.1),0_2px_8px_rgba(26,26,46,0.06)] animate-[cardIn_0.45s_ease-out_both] md:px-7 md:pt-7 md:pb-5">
          <h1 className="font-['Baloo_2'] text-[26px] font-extrabold text-[#1a1a2e] text-center mb-6">
            Welcome Back! 👋
          </h1>

          {errorMsg && (
            <div className="bg-[#fff1f1] border-2 border-[#ffcdd2] text-[#c62828] rounded-[10px] py-2.5 px-3 text-[13px] font-bold text-center mb-4 animate-[bannerIn_0.25s_ease_both]">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4 mb-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full py-3.5 px-4 bg-white text-[#4a4a6a] border-2 border-[#e4e4f0] rounded-xl text-[15px] font-bold outline-none transition-all focus:border-[#1aaee8]"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full py-3.5 px-4 bg-white text-[#4a4a6a] border-2 border-[#e4e4f0] rounded-xl text-[15px] font-bold outline-none transition-all focus:border-[#1aaee8] pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9999bb] hover:text-[#1aaee8] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#1aaee8] text-white rounded-xl text-[16px] font-extrabold cursor-pointer transition-all hover:bg-[#159bd4] active:scale-95 disabled:opacity-65"
            >
              {isSubmitting ? "Logging in…" : "Log In"}
            </button>
          </form>

          <div className="flex items-center gap-2.5 my-4 text-sm text-[#9999bb] before:content-[''] before:flex-1 before:h-px before:bg-[#e4e4f0] after:content-[''] after:flex-1 after:h-px after:bg-[#e4e4f0]">
            OR
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            type="button"
            className="w-full py-3.5 bg-white text-[#4a4a6a] border-2 border-[#e4e4f0] rounded-xl text-[16px] font-extrabold cursor-pointer flex items-center justify-center gap-3 transition-all hover:border-[#4ECAFC] active:scale-95 disabled:opacity-65"
          >
            <svg viewBox="0 0 48 48" className="w-5 h-5">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="mt-5 text-center text-[13.5px] text-[#4a4a6a]">
            New here?{" "}
            <Link
              to="/signup"
              className="text-[#FF8C42] font-extrabold no-underline hover:opacity-75"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
