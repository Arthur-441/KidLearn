import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { db, auth } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(
        collection(db, "users", user.uid, "children"),
        (snap) => {
          const kids = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setChildren(kids);
          setProfileLoading(false);
        },
        (err) => {
          console.error("Error fetching children", err);
          setProfileLoading(false);
        },
      );
      return () => unsub();
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (loading || profileLoading)
    return <div className="min-h-screen bg-[#f0f4ff] pt-[62px]"></div>;

  return (
    <div className="bg-[#f0f4ff] min-h-screen text-[#1a1a2e] pt-[62px] font-['Nunito'] flex flex-col items-center">
      <nav className="fixed top-0 left-0 right-0 z-[200] h-[62px] bg-white border-b-2 border-[#e8e8f4] flex items-center justify-between px-4 md:px-9 shadow-sm">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="text-[20px] font-extrabold font-['Baloo_2'] text-[#1aaee8]">
            🎈 Kid<em className="text-[#FF8C42] not-italic">Learn</em>
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="bg-transparent border-2 border-[#e8e8f4] text-[#4a4a6a] px-4 py-1.5 rounded-full text-[13px] font-bold transition-all hover:border-[#ef5350] hover:text-[#ef5350]"
        >
          ↩ Logout
        </button>
      </nav>

      <main className="max-w-[700px] w-full mx-auto p-6 md:p-9 mt-10">
        <h1 className="font-['Baloo_2'] text-3xl md:text-5xl font-black text-center mb-10">
          Who goes there? 👀
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          {/* Admin Tile */}
          {user?.role === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-[24px] shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all border-4 border-transparent hover:border-[#2ecc71] active:scale-95 group"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#27ae60] text-white font-black text-4xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                🛠️
              </div>
              <span className="font-['Baloo_2'] text-xl font-extrabold text-[#1a1a2e]">
                Admin
              </span>
              <span className="text-xs text-[#2ecc71] font-bold mt-1">
                Dashboard
              </span>
            </button>
          )}

          {/* Parent Tile */}
          <button
            onClick={() => navigate("/parent")}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-[24px] shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all border-4 border-transparent hover:border-[#9B5DE5] active:scale-95 group"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1aaee8] to-[#9B5DE5] text-white font-black text-4xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
              {(user?.displayName || user?.email || "P")
                ?.charAt(0)
                .toUpperCase()}
            </div>
            <span className="font-['Baloo_2'] text-xl font-extrabold text-[#1a1a2e]">
              Parents
            </span>
            <span className="text-xs text-[#9999bb] font-bold mt-1">
              Dashboard
            </span>
          </button>

          {/* Children Tiles */}
          {children.map((kid) => (
            <button
              key={kid.id}
              onClick={() => navigate(`/child/${kid.id}`)}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-[24px] shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all border-4 border-transparent hover:border-[#FF8C42] active:scale-95 group"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFD93D] to-[#FF8C42] text-white font-black text-4xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                {kid.avatar || "👦"}
              </div>
              <span className="font-['Baloo_2'] text-xl font-extrabold text-[#1a1a2e]">
                {kid.name}
              </span>
              <span className="text-xs text-[#FF8C42] font-bold mt-1">
                Play & Learn!
              </span>
            </button>
          ))}
        </div>

        {children.length === 0 && (
          <div className="text-center bg-white rounded-2xl p-6 shadow-sm border-2 border-dashed border-[#e8e8f4]">
            <p className="font-bold text-[#4a4a6a] mb-4">
              No kid profiles yet!
            </p>
            <p className="text-sm text-[#9999bb] mb-6">
              Go to the Parents Dashboard to add a child.
            </p>
            <button
              onClick={() => navigate("/parent")}
              className="bg-[#1aaee8] text-white px-6 py-2.5 rounded-full font-extrabold shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-transform"
            >
              Parents Dashboard →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
