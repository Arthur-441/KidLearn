import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import confetti from "canvas-confetti";

export default function ParentDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [gameResults, setGameResults] = useState<any[]>([]);

  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newKidName, setNewKidName] = useState("");
  const [newKidAvatar, setNewKidAvatar] = useState("🧒");

  const [dailyMessage, setDailyMessage] = useState("");

  // Premium State
  const [subscription, setSubscription] = useState<any>(null);
  const [activationCodeInput, setActivationCodeInput] = useState("");
  const [activationError, setActivationError] = useState("");
  const [activationSuccess, setActivationSuccess] = useState("");
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "children"),
      (snap) => {
        const kids = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setChildren(kids);
        if (kids.length > 0 && !selectedChild) {
          setSelectedChild(kids[0]);
        }
      },
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchSub = async () => {
      // Check subscription
      const { doc, getDoc, updateDoc } = await import("firebase/firestore");
      const subRef = doc(db, "subscriptions", user.uid);
      const subSnap = await getDoc(subRef);
      if (subSnap.exists()) {
        const data = subSnap.data();
        if (data.subscriptionStatus === "active") {
          const expiresEnd = data.expiresAt?.toDate
            ? data.expiresAt.toDate()
            : new Date(0);
          const now = new Date();
          const diffTime = expiresEnd.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            // Expired
            await updateDoc(subRef, { subscriptionStatus: "expired" });
            data.subscriptionStatus = "expired";
            setDaysRemaining(0);
          } else {
            setDaysRemaining(diffDays);
          }
        }
        setSubscription(data);
      }
    };
    fetchSub();
  }, [user]);

  const handleActivatePremium = async () => {
    setActivationError("");
    setActivationSuccess("");
    if (!activationCodeInput.trim() || !user) return;

    try {
      const { doc, getDoc, setDoc, updateDoc, serverTimestamp } =
        await import("firebase/firestore");
      const codeRef = doc(db, "premiumCodes", activationCodeInput.trim());
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        setActivationError("This code is invalid.");
        return;
      }

      const codeData = codeSnap.data();
      if (codeData.status === "redeemed" || codeData.redeemed) {
        setActivationError("This code has already been used.");
        return;
      }
      if (codeData.status === "expired") {
        setActivationError("This code has expired.");
        return;
      }

      // Valid code, activate
      const duration = codeData.durationDays || 30;
      let expiryDate = new Date();

      if (
        subscription?.subscriptionStatus === "active" &&
        subscription?.expiresAt
      ) {
        const currentExpiry = subscription.expiresAt.toDate
          ? subscription.expiresAt.toDate()
          : new Date(0);
        if (currentExpiry.getTime() > new Date().getTime()) {
          expiryDate = currentExpiry;
        }
      }
      expiryDate.setDate(expiryDate.getDate() + duration);

      // Update code
      await updateDoc(codeRef, {
        status: "redeemed",
        redeemed: true,
        activatedBy: user.uid,
        activatedAt: serverTimestamp(),
      });

      // Update/Create Subscription
      const subRef = doc(db, "subscriptions", user.uid);
      await setDoc(
        subRef,
        {
          parentId: user.uid,
          activationCode: activationCodeInput.trim(),
          activatedAt: serverTimestamp(),
          expiresAt: expiryDate,
          subscriptionStatus: "active",
        },
        { merge: true },
      );

      setSubscription({
        parentId: user.uid,
        activationCode: activationCodeInput.trim(),
        activatedAt: new Date(),
        expiresAt: { toDate: () => expiryDate },
        subscriptionStatus: "active",
      });
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays);

      setActivationSuccess("Premium Activated Successfully!");
      setActivationCodeInput("");

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error(err);
      setActivationError("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    if (!user || !selectedChild) return;

    // Fetch game results
    const fetchResults = async () => {
      try {
        const q = query(
          collection(
            db,
            "users",
            user.uid,
            "children",
            selectedChild.id,
            "results",
          ),
          orderBy("createdAt", "asc"),
        );
        const snap = await getDocs(q);
        const results = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            dateStr: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleDateString()
              : "Recent",
          };
        });
        setGameResults(results);
      } catch (err) {
        console.error("Failed to load results", err);
      }
    };
    fetchResults();
  }, [user, selectedChild]);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKidName.trim()) return;
    if (!user) return;

    try {
      await addDoc(collection(db, "users", user.uid, "children"), {
        name: newKidName,
        avatar: newKidAvatar,
        stars: 0,
        badges: [],
        gamesPlayed: 0,
        dailyMessage: "I love you! Have fun playing today! ❤️",
        createdAt: serverTimestamp(),
      });
      setIsAddingMode(false);
      setNewKidName("");
    } catch (err) {
      console.error(err);
    }
  };

  const computeChartData = () => {
    // Group by subject
    const data: Record<string, any> = {};
    gameResults.forEach((r) => {
      if (!data[r.subject]) {
        data[r.subject] = { subject: r.subject, totalScore: 0, totalGames: 0 };
      }
      data[r.subject].totalScore += (r.score / r.total) * 100;
      data[r.subject].totalGames += 1;
    });
    return Object.values(data).map((d) => ({
      name: d.subject,
      avgScore: Math.round(d.totalScore / d.totalGames),
    }));
  };

  const computeInsights = () => {
    if (gameResults.length === 0) return null;

    // Group by subject for strong/weak
    const subjectStats: Record<string, { score: number; count: number }> = {};
    let totalTimeToday = 0;
    const today = new Date().toLocaleDateString();

    gameResults.forEach((r) => {
      if (!subjectStats[r.subject])
        subjectStats[r.subject] = { score: 0, count: 0 };
      subjectStats[r.subject].score += (r.score / r.total) * 100;
      subjectStats[r.subject].count += 1;

      const resDate = r.createdAt?.toDate
        ? r.createdAt.toDate().toLocaleDateString()
        : "Recent";
      if (resDate === today && r.timeTaken) {
        totalTimeToday += r.timeTaken;
      }
    });

    const subjectsArray = Object.entries(subjectStats)
      .map(([subj, stats]) => ({
        subject: subj,
        avg: stats.score / stats.count,
      }))
      .sort((a, b) => b.avg - a.avg);

    const strongest = subjectsArray[0]?.subject || "N/A";
    const weakest = subjectsArray[subjectsArray.length - 1]?.subject || "N/A";

    // Skill growth: Compare first half of results to second half
    let growth = "Steady";
    if (gameResults.length >= 4) {
      const mid = Math.floor(gameResults.length / 2);
      const firstHalf = gameResults.slice(0, mid);
      const secondHalf = gameResults.slice(mid);
      const avg1 =
        firstHalf.reduce((acc, r) => acc + r.score / r.total, 0) /
        firstHalf.length;
      const avg2 =
        secondHalf.reduce((acc, r) => acc + r.score / r.total, 0) /
        secondHalf.length;
      if (avg2 > avg1 + 0.1) growth = "Improving 🚀";
      else if (avg2 < avg1 - 0.1) growth = "Needs Review 📉";
    } else if (gameResults.length > 0) {
      growth = "Learning 🌟";
    }

    const focusLevel =
      subjectsArray.length > 0 && subjectsArray[0].avg > 70
        ? "High 🎯"
        : "Developing 🌱";

    return {
      strongest,
      weakest,
      dailyTime: Math.round(totalTimeToday / 60), // in minutes
      growth,
      focusLevel,
    };
  };

  const getRecommendations = (insights: any) => {
    const allOptions = [
      {
        id: "numbers",
        title: "⭐ Counting Stars",
        desc: "Practice numbers 1-10",
      },
      { id: "shapes", title: "⭐ Shape Match", desc: "Identify basic shapes" },
      {
        id: "animals",
        title: "⭐ Animal Sounds",
        desc: "Learn animal names and sounds",
      },
      { id: "letters", title: "⭐ Alphabet Fun", desc: "Trace and learn ABCs" },
      { id: "colors", title: "⭐ Color Splash", desc: "Mix and match colors" },
    ];

    if (!insights) return allOptions.slice(0, 3);

    // recommend the weakest subject if it exists
    let recs: any[] = [];
    if (insights.weakest && insights.weakest !== "N/A") {
      const weakRec = allOptions.find((o) => o.id === insights.weakest);
      if (weakRec) recs.push(weakRec);
    }

    // add randoms to fill up to 3
    const shuffled = allOptions
      .filter((o) => !recs.find((r) => r.id === o.id))
      .sort(() => 0.5 - Math.random());
    recs = [...recs, ...shuffled].slice(0, 3);

    return recs;
  };

  const insights = computeInsights();
  const recommendations = getRecommendations(insights);

  const getRecentIssues = () => {
    if (!gameResults || gameResults.length === 0) return [];
    // Get issues from last 5 games
    const recent = gameResults.slice(-5);
    const allIssues = recent.flatMap((r) => r.issues || []);
    // count frequencies
    const counts = allIssues.reduce((acc: any, val: string) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map((e) => e[0]);
  };

  const handleSaveMessage = async () => {
    if (!user || !selectedChild) return;
    try {
      const msg = dailyMessage || selectedChild.dailyMessage;
      await doc(db, "users", user.uid, "children", selectedChild.id);
      // We need updateDoc
      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(
        doc(db, "users", user.uid, "children", selectedChild.id),
        {
          dailyMessage: msg,
        },
      );
      alert("Note updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update.");
    }
  };

  if (loading) return null;

  return (
    <div className="bg-[#f9f9fd] min-h-screen text-[#1a1a2e] pt-[62px] font-['Nunito'] flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-[200] h-[62px] bg-white border-b-2 border-[#e8e8f4] flex items-center justify-between px-4 md:px-9 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="bg-[#f0f4ff] text-[#4a4a6a] px-3 py-1.5 rounded-full text-[13px] font-bold no-underline"
          >
            ← Back to Menu
          </Link>
          <span className="font-['Baloo_2'] text-xl font-extrabold text-[#1a1a2e]">
            Parents Dashboard
          </span>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row flex-1 overflow-auto md:overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-[280px] bg-white md:border-b-0 border-b-2 md:border-r-2 border-[#e8e8f4] p-4 md:p-6 flex flex-col shrink-0">
          <h2 className="text-xs font-bold text-[#9999bb] uppercase tracking-wider mb-4">
            Your Children
          </h2>

          <div className="flex flex-col gap-3 mb-6">
            {children.map((kid) => (
              <button
                key={kid.id}
                onClick={() => setSelectedChild(kid)}
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all border-2 ${selectedChild?.id === kid.id ? "border-[#1aaee8] bg-[#f0f9ff]" : "border-transparent hover:bg-[#f9f9fd]"}`}
              >
                <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-xl">
                  {kid.avatar}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-bold text-sm truncate">{kid.name}</div>
                  <div className="text-xs text-[#9999bb]">⭐ {kid.stars}</div>
                </div>
              </button>
            ))}
          </div>

          {!isAddingMode ? (
            <button
              onClick={() => setIsAddingMode(true)}
              className="w-full py-3 border-2 border-dashed border-[#ccc] text-[#99bb] font-bold rounded-xl hover:border-[#1aaee8] hover:text-[#1aaee8] transition-colors"
            >
              + Add Child
            </button>
          ) : (
            <form
              onSubmit={handleAddChild}
              className="bg-[#f9f9fd] p-4 rounded-xl border-2 border-[#e8e8f4]"
            >
              <input
                type="text"
                placeholder="Child's Name"
                className="w-full p-2 mb-2 border rounded-lg text-sm outline-none focus:border-[#1aaee8]"
                value={newKidName}
                onChange={(e) => setNewKidName(e.target.value)}
                required
              />
              <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
                {["🧒", "👧", "👦", "🦊", "🦁", "🐰"].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setNewKidAvatar(a)}
                    className={`p-1 rounded-md text-lg ${newKidAvatar === a ? "bg-[#1aaee8] text-white" : "bg-white"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#FF8C42] text-white py-2 flex items-center justify-center rounded-lg text-sm font-bold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingMode(false)}
                  className="px-3 bg-white border border-[#ccc] rounded-lg text-sm font-bold text-[#666]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-9 md:overflow-y-auto w-full max-w-full">
          <div className="w-full max-w-[900px] mx-auto mb-8">
            <div className="bg-gradient-to-r from-[#1a1a2e] to-[#2a2a4a] text-white p-6 rounded-2xl shadow-md border-2 border-[#FFD93D] relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between z-10 relative gap-4 md:gap-0">
                <div>
                  <h2 className="text-2xl font-black font-['Baloo_2'] mb-1 flex items-center gap-2">
                    <span className="text-3xl">👑</span> KidLearn Premium
                  </h2>
                  {subscription?.subscriptionStatus === "active" ? (
                    <p className="text-[#a4b1cd] font-bold text-sm md:text-base">
                      Your Premium Access is{" "}
                      <span className="text-[#4CAF50] uppercase">Active</span>{" "}
                      🌈
                      <br />
                      {daysRemaining !== null ? (
                        daysRemaining <= 7 && daysRemaining > 0 ? (
                          <span className="text-[#FF8C42]">
                            Your Premium Access expires in {daysRemaining} days
                            🌈.
                            {daysRemaining <= 3 &&
                              " Renew now to continue your child's learning adventure ⭐"}
                          </span>
                        ) : (
                          <span>{daysRemaining} days remaining.</span>
                        )
                      ) : (
                        ""
                      )}
                    </p>
                  ) : (
                    <p className="text-[#a4b1cd] font-bold text-sm md:text-base">
                      Unlock premium worlds, advanced games, and more!{" "}
                      {subscription?.subscriptionStatus === "expired" && (
                        <span className="text-[#FF8C42]">
                          Premium Access has expired.
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      className="p-2 rounded-lg text-black outline-none font-bold uppercase w-full sm:w-[200px]"
                      placeholder="Activation Code"
                      value={activationCodeInput}
                      onChange={(e) =>
                        setActivationCodeInput(e.target.value.toUpperCase())
                      }
                    />
                    <button
                      onClick={handleActivatePremium}
                      className="w-full sm:w-auto text-center bg-[#FFD93D] text-[#1a1a2e] font-black px-4 py-2 rounded-lg shadow-sm hover:scale-105 transition-transform"
                    >
                      {subscription?.subscriptionStatus === "active"
                        ? "Extend"
                        : "Activate"}
                    </button>
                  </div>
                  {activationError && (
                    <div className="text-red-400 text-sm font-bold">
                      {activationError}
                    </div>
                  )}
                  {activationSuccess && (
                    <div className="text-green-400 text-sm font-bold">
                      {activationSuccess}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!selectedChild ? (
            <div className="h-40 flex items-center justify-center text-[#9999bb] font-bold">
              Select or add a child to view details.
            </div>
          ) : (
            <div className="max-w-[900px] mx-auto">
              <div className="flex items-end justify-between mb-8 pb-4 border-b-2 border-[#e8e8f4]">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white border-4 border-[#FFD93D] rounded-full flex items-center justify-center text-4xl shadow-sm">
                    {selectedChild.avatar}
                  </div>
                  <div>
                    <h1 className="font-['Baloo_2'] text-3xl font-black">
                      {selectedChild.name}'s Progress
                    </h1>
                    <p className="text-sm text-[#9999bb] font-bold">
                      Joined:{" "}
                      {selectedChild.createdAt?.toDate
                        ? selectedChild.createdAt.toDate().toLocaleDateString()
                        : "Recently"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-[#e8e8f4]">
                  <h3 className="font-['Baloo_2'] text-xl font-bold mb-4">
                    Performance by Subject (%)
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={computeChartData()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip cursor={{ fill: "#f0f4ff" }} />
                        <Bar
                          dataKey="avgScore"
                          fill="#4ECAFC"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    {computeChartData().length === 0 && (
                      <div className="text-center text-sm text-[#999] mt-[-100px]">
                        No games played yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Stumbling Blocks */}
                <div className="bg-[#fffdfa] rounded-2xl p-6 shadow-sm border border-[#f5dbdb] flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">⚠️</span>
                    <h3 className="font-['Baloo_2'] text-xl font-bold text-[#b71c1c]">
                      Areas for Improvement
                    </h3>
                  </div>
                  <p className="text-xs text-[#d32f2f] mb-4 leading-relaxed font-semibold">
                    Your child struggled with the following questions recently.
                    Please help them review these specific topics as they are
                    finding them difficult:
                  </p>

                  <div className="flex-1 flex flex-col gap-2">
                    {getRecentIssues().length > 0 ? (
                      <ul className="list-disc pl-5 space-y-2">
                        {getRecentIssues().map((issue, idx) => (
                          <li
                            key={idx}
                            className="text-[#a41010] text-sm font-bold leading-snug"
                          >
                            {issue}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center text-sm text-[#ccc] font-bold my-auto">
                        Nothing to report! ✨
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Insights & Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Insights */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e8e8f4]">
                  <h3 className="font-['Baloo_2'] text-xl font-bold mb-4 flex items-center gap-2">
                    <span>📊</span> Personalized Insights
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#f0f9ff] p-4 rounded-xl border border-[#e0f2fe]">
                      <div className="text-xs text-[#666] font-bold uppercase mb-1">
                        Strongest Subject
                      </div>
                      <div className="text-lg font-black text-[#1aaee8] capitalize">
                        {insights?.strongest || "N/A"}
                      </div>
                    </div>
                    <div className="bg-[#fff0f0] p-4 rounded-xl border border-[#ffebee]">
                      <div className="text-xs text-[#666] font-bold uppercase mb-1">
                        Weakest Subject
                      </div>
                      <div className="text-lg font-black text-[#ef5350] capitalize">
                        {insights?.weakest || "N/A"}
                      </div>
                    </div>
                    <div className="bg-[#f3e5f5] p-4 rounded-xl border border-[#f3e5f5]">
                      <div className="text-xs text-[#666] font-bold uppercase mb-1">
                        Daily Learning Time
                      </div>
                      <div className="text-lg font-black text-[#8e24aa]">
                        {insights?.dailyTime || 0} min
                      </div>
                    </div>
                    <div className="bg-[#e8f5e9] p-4 rounded-xl border border-[#e8f5e9]">
                      <div className="text-xs text-[#666] font-bold uppercase mb-1">
                        Focus Level
                      </div>
                      <div className="text-lg font-black text-[#43a047]">
                        {insights?.focusLevel || "N/A"}
                      </div>
                    </div>
                    <div className="bg-[#fff8e1] p-4 rounded-xl col-span-2 border border-[#fff8e1] flex items-center justify-between">
                      <div>
                        <div className="text-xs text-[#666] font-bold uppercase mb-1">
                          Skill Growth
                        </div>
                        <div className="text-lg font-black text-[#fbc02d]">
                          {insights?.growth || "N/A"}
                        </div>
                      </div>
                      <div className="text-4xl">📈</div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e8e8f4]">
                  <h3 className="font-['Baloo_2'] text-xl font-bold mb-4 flex items-center gap-2">
                    <span>💡</span> Recommended Today
                  </h3>
                  <p className="text-sm font-semibold text-[#666] mb-4">
                    Smartly decided based on recent activity
                  </p>
                  <div className="flex flex-col gap-3">
                    {recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-[#f9f9fd] p-3 rounded-xl border-2 border-[#e4e4f0] hover:border-[#1aaee8] transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-[#1a1a2e] text-md">
                            {rec.title}
                          </div>
                          <div className="text-xs text-[#9999bb] font-bold">
                            {rec.desc}
                          </div>
                        </div>
                        <span className="text-xl text-[#000] opacity-30 rounded-full w-8 h-8 flex items-center justify-center">
                          ▶
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Daily Message */}
              <div className="bg-gradient-to-r from-[#f0ebff] to-[#e6f7ff] rounded-2xl p-6 shadow-sm border border-[#e8e8f4] mb-8">
                <h3 className="font-['Baloo_2'] text-xl font-bold mb-2 text-[#4a4a6a]">
                  Send a Daily Message 💌
                </h3>
                <p className="text-xs text-[#666] mb-4">
                  Leave a note of encouragement. {selectedChild.name} will see
                  it when they log in!
                </p>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={dailyMessage || selectedChild.dailyMessage}
                    onChange={(e) => setDailyMessage(e.target.value)}
                    className="flex-1 p-3 rounded-xl border border-[#e4e4f0] shadow-sm outline-none focus:border-[#9B5DE5]"
                    placeholder="e.g., Have fun learning numbers today!"
                  />
                  <button
                    onClick={handleSaveMessage}
                    className="bg-[#9B5DE5] text-white px-6 py-3 rounded-xl font-extrabold shadow-sm hover:bg-[#8338ec]"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
