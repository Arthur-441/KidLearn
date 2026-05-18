import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function LandingPage() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNoAdsNotice, setShowNoAdsNotice] = useState(true);

  useEffect(() => {
    if (showNoAdsNotice) {
      const timer = setTimeout(() => {
        setShowNoAdsNotice(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showNoAdsNotice]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="bg-white min-h-screen text-[#1a1a2e]">
      {/* NO ADS NOTICE */}
      {showNoAdsNotice && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-[slideUp_0.5s_ease-out] pointer-events-none">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t-4 border-[#0CDA91] p-4 md:p-6 pointer-events-auto flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🛡️</div>
              <div>
                <h3 className="font-['Baloo_2'] text-xl md:text-2xl font-extrabold text-[#1a1a2e]">
                  100% Ad-Free & Safe
                </h3>
                <p className="text-[#555] font-medium text-sm md:text-base">
                  We have a no ads policy, so the safety of your child on this website is guaranteed.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNoAdsNotice(false)}
              className="bg-[#0CDA91] hover:bg-[#00A86B] text-white font-extrabold py-3 px-8 rounded-full shadow-[0_4px_14px_rgba(12,218,145,0.4)] hover:-translate-y-1 transition-all w-full md:w-auto"
            >
              Ok
            </button>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center justify-between px-5 md:px-10 bg-white/95 backdrop-blur-md border-b-2 border-black/5 transition-shadow duration-300 ${scrolled ? "shadow-md" : ""}`}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-3xl leading-none">🐣</span>
          <span className="font-['Baloo_2'] text-xl md:text-2xl font-extrabold text-[#9B5DE5] tracking-tight">
            Kid<em className="text-[#FF6B35] not-italic">Learn</em>
          </span>
        </div>
        <ul className="hidden md:flex items-center gap-4 lg:gap-7">
          <li>
            <a
              href="#subjects"
              className="text-[15px] font-bold pb-1 border-b-2 border-transparent hover:text-[#9B5DE5] hover:border-[#9B5DE5] transition-colors"
            >
              Subjects
            </a>
          </li>
          <li>
            <a
              href="#game"
              className="text-[15px] font-bold pb-1 border-b-2 border-transparent hover:text-[#9B5DE5] hover:border-[#9B5DE5] transition-colors"
            >
              Play
            </a>
          </li>
          <li>
            <a
              href="#how"
              className="text-[15px] font-bold pb-1 border-b-2 border-transparent hover:text-[#9B5DE5] hover:border-[#9B5DE5] transition-colors"
            >
              How it Works
            </a>
          </li>
          <li>
            <a
              href="#progress"
              className="text-[15px] font-bold pb-1 border-b-2 border-transparent hover:text-[#9B5DE5] hover:border-[#9B5DE5] transition-colors"
            >
              Progress
            </a>
          </li>
        </ul>
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#9B5DE5] to-[#FF6FA8] text-white flex items-center justify-center font-black">
                  {(user.displayName || user.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <span className="font-extrabold text-[#555] text-[15px]">
                  {user.displayName?.split(" ")[0]}
                </span>
              </div>
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-full font-extrabold text-white text-[15px] bg-[#FF6B35] shadow-[0_4px_14px_rgba(255,107,53,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,107,53,0.55)] transition-all"
              >
                My Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2 rounded-full font-bold text-[#9B5DE5] border-2 border-[#9B5DE5] hover:bg-[#9B5DE5] hover:text-white transition-all text-[15px]"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2.5 rounded-full font-extrabold text-white text-[15px] bg-[#FF6B35] shadow-[0_4px_14px_rgba(255,107,53,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,107,53,0.55)] transition-all"
              >
                Start Free 🎉
              </Link>
            </>
          )}
        </div>
        <button
          className="flex md:hidden flex-col justify-center items-center gap-[5px] w-11 h-11 bg-transparent border-none rounded-lg p-2 hover:bg-[#9B5DE5]/10"
          onClick={toggleMenu}
        >
          <span
            className={`block w-5 h-0.5 bg-[#1a1a2e] rounded transition-transform ${isMenuOpen ? "translate-y-[7px] rotate-45" : ""}`}
          ></span>
          <span
            className={`block w-5 h-0.5 bg-[#1a1a2e] rounded transition-opacity ${isMenuOpen ? "opacity-0" : ""}`}
          ></span>
          <span
            className={`block w-5 h-0.5 bg-[#1a1a2e] rounded transition-transform ${isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
          ></span>
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div
        className={`fixed top-[68px] left-0 right-0 z-40 bg-white/95 backdrop-blur-md px-6 transition-all duration-300 border-b-2 border-black/5 overflow-hidden ${isMenuOpen ? "max-h-[420px] opacity-100 py-5 pb-7" : "max-h-0 opacity-0 py-0"}`}
      >
        <ul className="flex flex-col gap-1">
          <li>
            <a
              href="#subjects"
              onClick={toggleMenu}
              className="block px-4 py-3 rounded-xl text-[17px] font-bold text-[#1a1a2e] hover:bg-[#9B5DE5]/10 hover:text-[#9B5DE5]"
            >
              🗺️ Subjects
            </a>
          </li>
          <li>
            <a
              href="#game"
              onClick={toggleMenu}
              className="block px-4 py-3 rounded-xl text-[17px] font-bold text-[#1a1a2e] hover:bg-[#9B5DE5]/10 hover:text-[#9B5DE5]"
            >
              🎮 Play a Game
            </a>
          </li>
          <li>
            <a
              href="#how"
              onClick={toggleMenu}
              className="block px-4 py-3 rounded-xl text-[17px] font-bold text-[#1a1a2e] hover:bg-[#9B5DE5]/10 hover:text-[#9B5DE5]"
            >
              💡 How it Works
            </a>
          </li>
          <li>
            <a
              href="#progress"
              onClick={toggleMenu}
              className="block px-4 py-3 rounded-xl text-[17px] font-bold text-[#1a1a2e] hover:bg-[#9B5DE5]/10 hover:text-[#9B5DE5]"
            >
              📊 Progress
            </a>
          </li>
        </ul>
        <div className="flex gap-3 mt-4 pt-4 border-t-2 border-black/5">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="flex-1 text-center py-2.5 rounded-full font-extrabold text-white text-[15px] bg-[#FF6B35] shadow-[0_4px_14px_rgba(255,107,53,0.35)]"
              >
                My Dashboard
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className="flex-1 text-center py-2 rounded-full font-bold text-[#9B5DE5] border-2 border-[#9B5DE5]"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex-1 text-center py-2 rounded-full font-bold text-[#9B5DE5] border-2 border-[#9B5DE5]"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="flex-1 text-center py-2.5 rounded-full font-extrabold text-white text-[15px] bg-[#FF6B35] shadow-[0_4px_14px_rgba(255,107,53,0.35)]"
              >
                Start Free 🎉
              </Link>
            </>
          )}
        </div>
      </div>

      <main className="pt-[68px]">
        {" "}
        {/* Avoid nav overlap */}
        {/* HERO */}
        <section className="relative overflow-hidden py-16 px-5 lg:py-20 bg-gradient-to-br from-[#b8f0ff] via-[#d4f9ff] to-[#fffbe6]">
          <div className="absolute inset-0 pointer-events-none z-0">
            <span className="absolute text-3xl md:text-4xl animate-[floatBob_4s_ease-in-out_infinite] top-[18%] left-[8%]">
              ⭐
            </span>
            <span className="absolute text-xl md:text-2xl animate-[floatBob_4s_ease-in-out_infinite_0.8s] top-[60%] left-[5%]">
              🔵
            </span>
            <span className="absolute text-3xl md:text-4xl animate-[floatBob_4s_ease-in-out_infinite_1.4s] top-[22%] right-[10%]">
              🌈
            </span>
            <span className="absolute text-2xl md:text-3xl animate-[floatBob_4s_ease-in-out_infinite_2.1s] top-[70%] right-[8%]">
              🎈
            </span>
            <span className="absolute text-xl md:text-2xl animate-[floatBob_4s_ease-in-out_infinite_0.4s] top-[82%] left-[32%]">
              💫
            </span>
          </div>

          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16 z-10 relative">
            <div className="flex-1 max-w-[580px] text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 bg-[#9B5DE5]/10 text-[#9B5DE5] px-4 py-1.5 rounded-full text-sm font-bold border-2 border-[#9B5DE5]/20 mb-5">
                🏆 Trusted by families
              </div>
              <h1 className="font-['Baloo_2'] text-4xl md:text-5xl lg:text-7xl font-extrabold leading-tight text-[#1a1a2e] mb-4">
                Learning is <span className="text-[#FF6B35]">FUN</span>
                <br />
                for <span className="text-[#9B5DE5]">little ones!</span> 🎉
              </h1>
              <p className="text-[17px] text-[#555] leading-relaxed mb-8 max-w-[460px] mx-auto md:mx-0">
                Playful, screen-smart games for ages 3–6: shapes, letters,
                colors, animals & counting. Watch your child grow with stars and
                rewards!
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center bg-gradient-to-br from-[#FF6B35] to-[#ff4d8d] text-white rounded-full font-extrabold text-[16px] px-8 py-4 shadow-[0_6px_24px_rgba(255,107,53,0.4)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,107,53,0.5)] transition-all"
                >
                  🚀 Start Playing Free
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center bg-white text-[#1a1a2e] rounded-full font-bold text-[16px] px-7 border-2 border-black/10 hover:border-[#9B5DE5] hover:text-[#9B5DE5] hover:-translate-y-0.5 transition-all"
                >
                  How it Works
                </a>
              </div>
            </div>

            <div className="flex-shrink-0 relative w-[240px] h-[240px] md:w-[320px] md:h-[320px] lg:w-[360px] lg:h-[360px]">
              <svg
                viewBox="0 0 300 300"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full animate-[floatBob_5s_ease-in-out_infinite] drop-shadow-[0_20px_40px_rgba(255,152,0,0.35)]"
              >
                <ellipse cx="150" cy="200" rx="90" ry="70" fill="#FF9800" />
                <circle cx="150" cy="130" r="90" fill="#FFB74D" />
                <ellipse cx="72" cy="65" rx="28" ry="38" fill="#FF9800" />
                <ellipse cx="228" cy="65" rx="28" ry="38" fill="#FF9800" />
                <ellipse cx="72" cy="65" rx="16" ry="24" fill="#FF6F00" />
                <ellipse cx="228" cy="65" rx="16" ry="24" fill="#FF6F00" />
                <ellipse cx="150" cy="145" rx="60" ry="50" fill="#FFE0B2" />
                <circle cx="120" cy="118" r="14" fill="#fff" />
                <circle cx="180" cy="118" r="14" fill="#fff" />
                <circle cx="122" cy="120" r="9" fill="#1a1a2e" />
                <circle cx="182" cy="120" r="9" fill="#1a1a2e" />
                <circle cx="125" cy="117" r="3" fill="#fff" />
                <circle cx="185" cy="117" r="3" fill="#fff" />
                <ellipse cx="150" cy="140" rx="12" ry="8" fill="#BF360C" />
                <path
                  d="M130 155 Q150 172 170 155"
                  stroke="#BF360C"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
                <ellipse
                  cx="104"
                  cy="148"
                  rx="14"
                  ry="9"
                  fill="#FF8A65"
                  opacity=".5"
                />
                <ellipse
                  cx="196"
                  cy="148"
                  rx="14"
                  ry="9"
                  fill="#FF8A65"
                  opacity=".5"
                />
                <line
                  x1="60"
                  y1="140"
                  x2="110"
                  y2="145"
                  stroke="#8D6E63"
                  strokeWidth="2"
                  opacity=".5"
                />
                <line
                  x1="55"
                  y1="150"
                  x2="108"
                  y2="150"
                  stroke="#8D6E63"
                  strokeWidth="2"
                  opacity=".5"
                />
                <line
                  x1="190"
                  y1="145"
                  x2="240"
                  y2="140"
                  stroke="#8D6E63"
                  strokeWidth="2"
                  opacity=".5"
                />
                <line
                  x1="192"
                  y1="150"
                  x2="245"
                  y2="150"
                  stroke="#8D6E63"
                  strokeWidth="2"
                  opacity=".5"
                />
                <polygon points="150,30 120,90 180,90" fill="#9B5DE5" />
                <rect
                  x="110"
                  y="86"
                  width="80"
                  height="12"
                  rx="6"
                  fill="#7b1fa2"
                />
                <circle cx="150" cy="32" r="8" fill="#FFD93D" />
              </svg>
              <div className="absolute bottom-[5%] md:bottom-5 md:right-[-20px] bg-white border-4 border-[#FFD93D] rounded-t-2xl rounded-bl-sm rounded-br-2xl py-2 px-4 shadow-lg text-[14px] md:text-[16px] font-extrabold text-[#1a1a2e] animate-[floatBob_3.5s_ease-in-out_infinite_0.5s] whitespace-nowrap z-20">
                Hi! I'm Buddy! 🦊
              </div>
            </div>
          </div>
        </section>
        {/* SUBJECTS */}
        <section
          id="subjects"
          className="py-20 lg:py-28 px-5 bg-white relative"
        >
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="font-['Baloo_2'] text-4xl md:text-5xl font-extrabold text-[#1a1a2e] mb-4">
              Choose Your Adventure! 🗺️
            </h2>
            <p className="text-lg text-[#555] mb-12 max-w-[600px] mx-auto">
              6 fun worlds to explore, each packed with games and surprises
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {/* Shapes */}
              <div className="group relative bg-gradient-to-b from-[#4ECAFC] to-[#0295E3] rounded-[32px] p-6 text-white flex flex-col items-center justify-between shadow-lg hover:-translate-y-2 transition-all duration-300">
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform mt-4 filter drop-shadow-md">
                  🔷
                </div>
                <div>
                  <h3 className="font-['Baloo_2'] text-2xl font-extrabold mb-2 leading-none">
                    Shapes
                  </h3>
                  <p className="text-sm font-medium opacity-90 leading-snug mb-6 h-10">
                    Circles, squares & more!
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold border border-white/30 whitespace-nowrap">
                  12 games ✨
                </div>
              </div>

              {/* Letters */}
              <div className="group relative bg-gradient-to-b from-[#FFB03A] to-[#FF7B00] rounded-[32px] p-6 text-white flex flex-col items-center justify-between shadow-lg hover:-translate-y-2 transition-all duration-300">
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform mt-4 filter drop-shadow-md">
                  🔤
                </div>
                <div>
                  <h3 className="font-['Baloo_2'] text-2xl font-extrabold mb-2 leading-none">
                    Letters
                  </h3>
                  <p className="text-sm font-medium opacity-90 leading-snug mb-6 h-10">
                    A to Z adventures await you
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold border border-white/30 whitespace-nowrap">
                  26 games ✨
                </div>
              </div>

              {/* Colors */}
              <div className="group relative bg-gradient-to-b from-[#FF7B9C] to-[#E61B5A] rounded-[32px] p-6 text-white flex flex-col items-center justify-between shadow-lg hover:-translate-y-2 transition-all duration-300">
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform mt-4 filter drop-shadow-md">
                  🎨
                </div>
                <div>
                  <h3 className="font-['Baloo_2'] text-2xl font-extrabold mb-2 leading-none">
                    Colors
                  </h3>
                  <p className="text-sm font-medium opacity-90 leading-snug mb-6 h-10">
                    Paint the world with learning
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold border border-white/30 whitespace-nowrap">
                  10 games ✨
                </div>
              </div>

              {/* Numbers */}
              <div className="group relative bg-gradient-to-b from-[#81D95A] to-[#439C24] rounded-[32px] p-6 text-white flex flex-col items-center justify-between shadow-lg hover:-translate-y-2 transition-all duration-300">
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform mt-4 filter drop-shadow-md">
                  🔢
                </div>
                <div>
                  <h3 className="font-['Baloo_2'] text-2xl font-extrabold mb-2 leading-none">
                    Numbers
                  </h3>
                  <p className="text-sm font-medium opacity-90 leading-snug mb-6 h-10">
                    Count from 1 to 100 with fun
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold border border-white/30 whitespace-nowrap">
                  15 games ✨
                </div>
              </div>

              {/* Animals */}
              <div className="group relative bg-gradient-to-b from-[#C47BD7] to-[#8C2BA8] rounded-[32px] p-6 text-white flex flex-col items-center justify-between shadow-lg hover:-translate-y-2 transition-all duration-300">
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform mt-4 filter drop-shadow-md">
                  🦁
                </div>
                <div>
                  <h3 className="font-['Baloo_2'] text-2xl font-extrabold mb-2 leading-none">
                    Animals
                  </h3>
                  <p className="text-sm font-medium opacity-90 leading-snug mb-6 h-10">
                    Meet friends from the world
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold border border-white/30 whitespace-nowrap">
                  20 games ✨
                </div>
              </div>

              {/* Music */}
              <div className="group relative bg-gradient-to-b from-[#60CDD4] to-[#0A8894] rounded-[32px] p-6 text-white flex flex-col items-center justify-between shadow-lg hover:-translate-y-2 transition-all duration-300">
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform mt-4 filter drop-shadow-md">
                  🎵
                </div>
                <div>
                  <h3 className="font-['Baloo_2'] text-2xl font-extrabold mb-2 leading-none">
                    Music
                  </h3>
                  <p className="text-sm font-medium opacity-90 leading-snug mb-6 h-10">
                    Sing, clap & make noise!
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold border border-white/30 whitespace-nowrap">
                  8 games ✨
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* HOW IT WORKS */}
        <section id="how" className="py-20 lg:py-28 px-5 bg-[#f8f7ff] relative">
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="font-['Baloo_2'] text-4xl md:text-5xl font-extrabold text-[#1a1a2e] mb-4">
              How KidLearn Academy App Works 💡
            </h2>
            <p className="text-lg text-[#555] mb-12 max-w-[600px] mx-auto">
              Simple for parents, magical for kids
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-white rounded-[32px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#F26F3D] text-white flex items-center justify-center font-black text-2xl mb-6 shadow-md shadow-[#F26F3D]/20">
                  1
                </div>
                <h3 className="font-['Baloo_2'] text-2xl font-extrabold text-[#1a1a2e] mb-3">
                  Sign Up Free
                </h3>
                <p className="text-[#666] font-medium leading-relaxed">
                  Create your family account in 30 seconds — no credit card
                  needed
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-[32px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#9B5DE5] text-white flex items-center justify-center font-black text-2xl mb-6 shadow-md shadow-[#9B5DE5]/20">
                  2
                </div>
                <h3 className="font-['Baloo_2'] text-2xl font-extrabold text-[#1a1a2e] mb-3">
                  Pick a World
                </h3>
                <p className="text-[#666] font-medium leading-relaxed">
                  Your child chooses their favourite topic and Buddy guides the
                  way
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-[32px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#0CDA91] text-white flex items-center justify-center font-black text-2xl mb-6 shadow-md shadow-[#0CDA91]/20">
                  3
                </div>
                <h3 className="font-['Baloo_2'] text-2xl font-extrabold text-[#1a1a2e] mb-3">
                  Play & Learn
                </h3>
                <p className="text-[#666] font-medium leading-relaxed">
                  Adaptive games that grow with your child's skill and
                  confidence
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-[32px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#F15BB5] text-white flex items-center justify-center font-black text-2xl mb-6 shadow-md shadow-[#F15BB5]/20">
                  4
                </div>
                <h3 className="font-['Baloo_2'] text-2xl font-extrabold text-[#1a1a2e] mb-3">
                  Earn Stars ⭐
                </h3>
                <p className="text-[#666] font-medium leading-relaxed">
                  Track progress, collect badges, and celebrate every milestone
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#1a1a2e] text-white/70 py-10 md:py-14 px-5 text-center">
        <div className="flex items-center justify-center gap-2 text-3xl mb-3">
          <span>🐣</span>
          <span className="font-['Baloo_2'] font-extrabold text-white">
            Kid<span className="text-[#FFD93D]">Learn</span>
          </span>
        </div>
        <p className="text-sm mb-6">
          Making every child's learning journey magical ✨
        </p>
        <p className="text-xs opacity-40">
          © 2026 KidLearn Academy App. Made with 💛 for curious little minds.
        </p>
      </footer>
    </div>
  );
}
