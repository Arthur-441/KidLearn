import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { SOUND_URLS } from "../utils/sounds";
import FeatureGuide from "../components/FeatureGuide";

const BADGE_DEFS = [
  { id: "first_game", icon: "🎮", label: "First Game" },
  { id: "star_5", icon: "⭐", label: "5 Stars" },
  { id: "star_20", icon: "🌟", label: "20 Stars" },
  { id: "star_50", icon: "💫", label: "50 Stars" },
  { id: "games_5", icon: "🕹️", label: "5 Games" },
  { id: "color_wizard", icon: "🎨", label: "Color Wizard" },
  { id: "daily_hero", icon: "🦸", label: "Daily Hero" },
];

const SUBJECTS = [
  {
    id: "shapes",
    bg: "from-[#4ECAFC] to-[#0288d1]",
    icon: "🔷",
    title: "Shapes",
    label: "Learn Squares & Circles!",
  },
  {
    id: "letters",
    bg: "from-[#FFD93D] to-[#FF8C42]",
    icon: "🔤",
    title: "Letters",
    label: "A B C D...",
  },
  {
    id: "colors",
    bg: "from-[#ff8fa3] to-[#c9184a]",
    icon: "🎨",
    title: "Colors",
    label: "Red, Blue, Green!",
  },
  {
    id: "numbers",
    bg: "from-[#8DE365] to-[#388e3c]",
    icon: "🔢",
    title: "Numbers",
    label: "1 2 3 4...",
  },
  {
    id: "animals",
    bg: "from-[#ce93d8] to-[#7b1fa2]",
    icon: "🦁",
    title: "Animals",
    label: "Lions, Tigers, Bears!",
  },
  {
    id: "rhymes",
    bg: "from-[#80deea] to-[#00838f]",
    icon: "🎵",
    title: "Rhymes",
    label: "Baa Baa Black Sheep...",
  },
  {
    id: "stories",
    bg: "from-[#9fa8da] to-[#3949ab]",
    icon: "📖",
    title: "Stories",
    label: "Once upon a time...",
  },
];

export default function ChildDashboard() {
  const { childId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !childId) return;
    const fetchChild = async () => {
      try {
        const childRef = doc(db, "users", user.uid, "children", childId);
        const snap = await getDoc(childRef);
        if (snap.exists()) {
          const data = snap.data();
          const todayStr = new Date().toISOString().split("T")[0];

          let needsUpdate = false;
          let updateData: any = {};

          if (data.lastLoginDate !== todayStr) {
            needsUpdate = true;
            updateData.lastLoginDate = todayStr;

            if (!data.lastLoginDate) {
              updateData.streak = 1;
            } else {
              const lastDate = new Date(data.lastLoginDate);
              const today = new Date(todayStr);
              // Calculate difference in days safely
              const diffTime = Math.abs(today.getTime() - lastDate.getTime());
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays === 1) {
                updateData.streak = (data.streak || 0) + 1;
              } else if (diffDays > 1) {
                updateData.streak = 1;
              } // If < 1, do nothing to streak (though it shouldn't happen due to the !== check)
            }

            // reset daily quests
            updateData.dailyStars = 0;
            updateData.dailyGames = 0;
            updateData.dailyBadges = 0;
            updateData.quest1Claimed = false;
            updateData.quest2Claimed = false;
            updateData.quest3Claimed = false;
            updateData.questCompleted = false;
          }

          if (needsUpdate) {
            await updateDoc(childRef, updateData);
            setProfile({ ...data, ...updateData });
          } else {
            setProfile(data);
          }
        } else {
          // not found
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error fetching child", err);
      }
    };
    fetchChild();
  }, [user, childId, navigate]);

  const claimQuest = async (questId: number) => {
    if (!user || !childId) return;

    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
    const audio = new Audio(SOUND_URLS.quest);
    audio.play().catch(() => {});

    const updates: any = {};
    updates[`quest${questId}Claimed`] = true;

    let earnedStars = 0;
    if (questId === 1) earnedStars = 5;
    if (questId === 2) earnedStars = 5;
    if (questId === 3) earnedStars = 10;

    updates.stars = (profile.stars || 0) + earnedStars;

    const willCompleteAll =
      (questId === 1 || profile.quest1Claimed) &&
      (questId === 2 || profile.quest2Claimed) &&
      (questId === 3 || profile.quest3Claimed);

    if (willCompleteAll && !profile.questCompleted) {
      updates.questCompleted = true;
      const newBadges = [...(profile.badges || [])];
      if (!newBadges.includes("daily_hero")) {
        newBadges.push("daily_hero");
        updates.badges = newBadges;
      }
    }

    try {
      await updateDoc(doc(db, "users", user.uid, "children", childId), updates);
      setProfile({ ...profile, ...updates });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !profile)
    return <div className="min-h-screen bg-[#f0f4ff] pt-[62px]"></div>;

  return (
    <div className="bg-[#f0f4ff] min-h-screen text-[#1a1a2e] pt-[62px] font-['Nunito']">
      <nav className="fixed top-0 left-0 right-0 z-[200] h-[62px] bg-white border-b-2 border-[#e8e8f4] flex items-center justify-between px-4 md:px-9 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="bg-[#f0f4ff] text-[#4a4a6a] px-3 py-1.5 rounded-full text-[13px] font-bold no-underline"
          >
            ← Back
          </Link>
          <span className="text-[20px] font-extrabold font-['Baloo_2'] text-[#1aaee8]">
            🎈 Kid<em className="text-[#FF8C42] not-italic">Learn</em>
          </span>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#f9f9fd] border-2 border-[#e8e8f4] flex items-center justify-center text-lg">
          {profile.avatar}
        </div>
      </nav>

      <main className="max-w-[900px] mx-auto p-4 md:p-9 pt-8 overflow-x-hidden">
        {/* Postcard / Note from parent */}
        {profile.dailyMessage && (
          <div className="relative bg-[#fffedb] rounded-[20px] p-6 mb-10 shadow-[2px_4px_16px_rgba(0,0,0,0.06)] transform -rotate-1 mx-auto max-w-[600px] border border-[#f4eeb1] animate-[dropIn_0.6s_ease-out]">
            <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#ff7b54] opacity-80 shadow-sm border border-[#fff]"></div>
            <p className="font-['Baloo_2'] text-xl text-center text-[#5a5a5a] relative z-10">
              "{profile.dailyMessage}"
            </p>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <div className="bg-white rounded-[24px] p-5 text-center shadow-sm border-[4px] border-[#fbefd6]">
            <div className="text-4xl mb-1">⭐</div>
            <div className="font-['Baloo_2'] text-3xl font-black">
              {profile.stars || 0}
            </div>
          </div>
          <div className="bg-white rounded-[24px] p-5 text-center shadow-sm border-[4px] border-[#e1f5fe]">
            <div className="text-4xl mb-1">🎮</div>
            <div className="font-['Baloo_2'] text-3xl font-black">
              {profile.gamesPlayed || 0}
            </div>
          </div>
          <div className="bg-white rounded-[24px] p-5 text-center shadow-sm border-[4px] border-[#ffebee]">
            <div className="text-4xl mb-1">🔥</div>
            <div className="font-['Baloo_2'] text-3xl font-black">
              {profile.streak || 0}
            </div>
          </div>
          <div className="col-span-2 md:col-span-2 bg-white rounded-[24px] p-5 shadow-sm border-[4px] border-[#f3e5f5] flex flex-col justify-center">
            <h3 className="font-bold text-[#9999bb] text-center mb-2 text-sm uppercase tracking-wide">
              My Badges
            </h3>
            <div className="flex justify-center flex-wrap gap-2">
              {profile.badges?.length === 0 && (
                <span className="text-sm font-bold text-[#ccc]">
                  Play to earn!
                </span>
              )}
              {profile.badges?.map((bid: string) => {
                const b = BADGE_DEFS.find((d) => d.id === bid);
                return b ? (
                  <div
                    key={bid}
                    className="w-10 h-10 rounded-full bg-[#fff] shadow-sm flex items-center justify-center text-xl border border-[#eee]"
                    title={b.label}
                  >
                    {b.icon}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>

        {/* Daily Quests Section */}
        <div className="bg-white rounded-[32px] p-6 mb-10 shadow-sm border-[4px] border-[#e8e8f4]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-['Baloo_2'] text-2xl md:text-3xl font-black text-[#1a1a2e]">
              Daily Quests
            </h2>
            <button className="text-[#1aaee8] font-bold text-sm tracking-wide uppercase hover:underline">
              View All
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {/* Quest 1 */}
            <div
              className={`flex flex-col md:flex-row md:items-center gap-4 ${profile?.quest1Claimed ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 shrink-0 flex items-center justify-center text-5xl filter drop-shadow-sm">
                  ⚡
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[#4a4a6a] mb-2 text-lg">
                    Earn 10 Stars ⭐
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-5 bg-[#f0f4ff] rounded-full overflow-hidden relative border-2 border-[#e6ebf5]">
                      <div
                        className="absolute top-0 bottom-0 left-0 bg-[#FFD93D] rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min(100, (profile?.dailyStars || 0) * 10)}%`,
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#8c7414]">
                        {Math.min(10, profile?.dailyStars || 0)} / 10
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {(profile?.dailyStars || 0) >= 10 && !profile?.quest1Claimed && (
                <button
                  onClick={() => claimQuest(1)}
                  className="shrink-0 bg-[#FFD93D] hover:bg-[#facd1c] text-[#8c7414] font-black text-sm px-6 py-3 rounded-full shadow-md hover:-translate-y-0.5 transition-transform active:scale-95 uppercase tracking-wide"
                >
                  Claim 📦
                </button>
              )}
              {profile?.quest1Claimed && (
                <div className="shrink-0 font-bold text-[#4CAF50] text-lg">
                  Claimed ✅
                </div>
              )}
            </div>

            {/* Quest 2 */}
            <div
              className={`flex flex-col md:flex-row md:items-center gap-4 ${profile?.quest2Claimed ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 shrink-0 flex items-center justify-center text-5xl filter drop-shadow-sm">
                  🎯
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[#4a4a6a] mb-2 text-lg">
                    Play 3 Games 🎮
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-5 bg-[#f0f4ff] rounded-full overflow-hidden relative border-2 border-[#e6ebf5]">
                      <div
                        className="absolute top-0 bottom-0 left-0 bg-[#FF8C42] rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min(100, (profile?.dailyGames || 0) * 33.33)}%`,
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#fff]">
                        {Math.min(3, profile?.dailyGames || 0)} / 3
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {(profile?.dailyGames || 0) >= 3 && !profile?.quest2Claimed && (
                <button
                  onClick={() => claimQuest(2)}
                  className="shrink-0 bg-[#FF8C42] hover:bg-[#f67a2a] text-white font-black text-sm px-6 py-3 rounded-full shadow-md hover:-translate-y-0.5 transition-transform active:scale-95 uppercase tracking-wide"
                >
                  Claim 📦
                </button>
              )}
              {profile?.quest2Claimed && (
                <div className="shrink-0 font-bold text-[#4CAF50] text-lg">
                  Claimed ✅
                </div>
              )}
            </div>

            {/* Quest 3 */}
            <div
              className={`flex flex-col md:flex-row md:items-center gap-4 ${profile?.quest3Claimed ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 shrink-0 flex items-center justify-center text-5xl filter drop-shadow-sm">
                  🔥
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[#4a4a6a] mb-2 text-lg">
                    Earn a new badge 🏆
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-5 bg-[#f0f4ff] rounded-full overflow-hidden relative border-2 border-[#e6ebf5]">
                      <div
                        className="absolute top-0 bottom-0 left-0 bg-[#4ECAFC] rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min(100, (profile?.dailyBadges || 0) * 100)}%`,
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#8c7414]">
                        {Math.min(1, profile?.dailyBadges || 0)} / 1
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {(profile?.dailyBadges || 0) >= 1 && !profile?.quest3Claimed && (
                <button
                  onClick={() => claimQuest(3)}
                  className="shrink-0 bg-[#4ECAFC] hover:bg-[#2abcf6] text-white font-black text-sm px-6 py-3 rounded-full shadow-md hover:-translate-y-0.5 transition-transform active:scale-95 uppercase tracking-wide"
                >
                  Claim 🌟
                </button>
              )}
              {profile?.quest3Claimed && (
                <div className="shrink-0 font-bold text-[#4CAF50] text-lg">
                  Claimed ✅
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Games Section */}
        <h2 className="font-['Baloo_2'] text-3xl md:text-4xl font-black text-center mb-8">
          What do you want to learn? 🚀
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SUBJECTS.map((sub, i) => (
            <Link
              key={sub.id}
              to={`/subject/${childId}/${sub.id}`}
              className={`relative overflow-hidden group rounded-[32px] p-8 text-white no-underline transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_32px_rgba(0,0,0,0.15)] bg-gradient-to-br ${sub.bg}`}
              style={{ animation: `fadeUp 0.5s ease-out ${i * 0.1}s both` }}
            >
              <div className="absolute top-[-20%] right-[-10%] text-[140px] opacity-20 transform group-hover:scale-110 transition-transform duration-500 group-hover:rotate-12">
                {sub.icon}
              </div>
              <div className="relative z-10">
                <span className="text-6xl block mb-4 filter drop-shadow-md">
                  {sub.icon}
                </span>
                <h3 className="font-['Baloo_2'] text-4xl font-black mb-1">
                  {sub.title}
                </h3>
                <p className="font-bold opacity-90 text-lg">{sub.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <style>{`
        @keyframes dropIn {
          0% { transform: translateY(-30px) rotate(-5deg); opacity: 0; }
          60% { transform: translateY(10px) rotate(2deg); opacity: 1; }
          100% { transform: translateY(0) rotate(-1deg); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <FeatureGuide 
        featureId="child_dashboard" 
        title="Welcome to your Dashboard! 🚀" 
        description="Here you can see your daily message from mom/dad, track your stars and badges, and choose fun subjects to learn!"
        position="bottom-right"
      />
    </div>
  );
}
