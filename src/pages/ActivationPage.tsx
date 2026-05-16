import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import ContactSupport from "../components/ContactSupport";
import FeatureGuide from "../components/FeatureGuide";
import confetti from "canvas-confetti";

export const activateCode = async (parentUid: string, childId: string, code: string) => {
  const cleanCode = code.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (!cleanCode || !childId || !parentUid) {
    throw new Error("Missing required information.");
  }
  
  const childRef = doc(db, "users", parentUid, "children", childId);

  await runTransaction(db, async (transaction) => {
    let codeRef = doc(db, "activationCodes", cleanCode);
    let codeSnap = await transaction.get(codeRef);
    let isLegacy = false;

    if (!codeSnap.exists()) {
      codeRef = doc(db, "premiumCodes", cleanCode);
      codeSnap = await transaction.get(codeRef);
      if (!codeSnap.exists()) {
        throw new Error("Activation code not found.");
      }
      isLegacy = true;
    }
    
    const codeData = codeSnap.data();
    
    if (isLegacy) {
       if (codeData.status === "redeemed" || codeData.redeemed) {
         throw new Error("This code has already been used.");
       }
    } else {
       if (codeData.used) {
         throw new Error("This code has already been used.");
       }
    }

    const childSnap = await transaction.get(childRef);
    if (!childSnap.exists()) {
      throw new Error("Child profile not found.");
    }

    // Mark code as used
    if (isLegacy) {
      transaction.update(codeRef, {
        status: "redeemed",
        redeemed: true,
        activatedBy: parentUid,
        activatedAt: serverTimestamp()
      });
    } else {
      transaction.update(codeRef, {
        used: true,
        usedBy: childId,
        usedAt: serverTimestamp(),
      });
    }

    // Determine new expiry if we want to extend
    const durationDays = codeData.durationDays || 30;
    const childData = childSnap.data();
    let currentExpireAt = new Date();
    if (childData && childData.premiumExpireAt) {
      currentExpireAt = childData.premiumExpireAt.toDate();
    }
    const baseDate = currentExpireAt > new Date() ? currentExpireAt : new Date();
    baseDate.setDate(baseDate.getDate() + durationDays);
    
    // Update child profile
    transaction.update(childRef, {
      isPremium: true,
      premiumActivatedAt: serverTimestamp(),
      activationCode: cleanCode,
      premiumExpireAt: Timestamp.fromDate(baseDate),
    });
  });
};

export default function ActivationPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [code, setCode] = useState("");
  const [errorObj, setErrorObj] = useState("");
  const [success, setSuccess] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [showContactPopup, setShowContactPopup] = useState(true);

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
        if (kids.length > 0 && !selectedChildId) {
          setSelectedChildId(kids[0].id);
        }
      }
    );
    return () => unsub();
  }, [user]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorObj("");
    setSuccess("");
    
    if (!user) return;
    if (!selectedChildId) {
      setErrorObj("Please select a child profile first.");
      return;
    }
    if (!code.trim()) {
      setErrorObj("Please enter an activation code.");
      return;
    }

    const activeChild = children.find(c => c.id === selectedChildId);

    setIsActivating(true);
    try {
      await activateCode(user.uid, selectedChildId, code.toUpperCase());
      setSuccess(activeChild?.isPremium ? "Premium Extended Successfully! 🌟" : "Premium Activated Successfully! 🌟");
      setCode("");
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error(err);
      setErrorObj(err.message || "An error occurred. Please try again.");
    } finally {
      setIsActivating(false);
    }
  };

  if (loading || !user) return <div className="min-h-screen bg-[#f9f9fd]" />;

  return (
    <div className="bg-[#f9f9fd] min-h-screen text-[#1a1a2e] pt-[62px] font-['Nunito'] flex flex-col items-center">
      <nav className="fixed top-0 left-0 right-0 z-[200] h-[62px] bg-white border-b-2 border-[#e8e8f4] flex items-center px-4 md:px-9 shadow-sm">
        <div className="flex w-full justify-between items-center">
          <Link
            to="/parent"
            className="bg-[#f0f4ff] text-[#4a4a6a] px-3 py-1.5 rounded-full text-[13px] font-bold no-underline hover:bg-[#e0e7ff] transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <span className="font-['Baloo_2'] text-xl font-extrabold text-[#1a1a2e] flex items-center gap-2">
             Activate Premium <span className="text-2xl">👑</span>
          </span>
        </div>
      </nav>

      <div className="w-full max-w-md px-4 py-8 flex flex-col flex-1">
        <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-[#e8e8f4] mb-8">
          <h2 className="font-['Baloo_2'] text-2xl font-black mb-6 text-center text-[#1a1a2e]">
            Unlock Magical Learning ✨
          </h2>

          <form onSubmit={handleActivate} className="flex flex-col gap-6">
            {/* Child Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#666] uppercase tracking-wider">
                Select Child Profile
              </label>
              {children.length === 0 ? (
                <div className="p-4 bg-[#fff0f0] rounded-xl text-sm font-bold text-red-500 border border-[#ffebee]">
                  You need to add a child to your dashboard first.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {children.map((kid) => (
                    <button
                      key={kid.id}
                      type="button"
                      onClick={() => setSelectedChildId(kid.id)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                        selectedChildId === kid.id
                          ? "border-[#1aaee8] bg-[#f0f9ff]"
                          : "border-[#e8e8f4] hover:bg-[#f9f9fd]"
                      }`}
                    >
                      <div className="text-4xl mb-2">{kid.avatar}</div>
                      <div className="font-bold text-sm truncate w-full text-center">
                        {kid.name}
                      </div>
                      {kid.isPremium ? (
                        <span className="mt-1 text-[10px] font-black uppercase text-green-500 bg-green-100 px-2 py-0.5 rounded-full">
                          Premium
                        </span>
                      ) : (
                        <span className="mt-1 text-[10px] font-black uppercase text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          Free
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Code Input */}
            <div className="flex flex-col gap-2 relative">
              <label className="text-sm font-bold text-[#666] uppercase tracking-wider">
                Activation Code
              </label>
              <input
                type="text"
                placeholder="Ex: KL-ABCD-1234"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full p-4 text-lg font-black tracking-widest uppercase border-2 border-[#e8e8f4] rounded-xl outline-none focus:border-[#FFD93D] transition-colors"
              />
            </div>

            {/* Status Feedback */}
            {errorObj && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-sm font-bold border border-red-100">
                <span>⚠️</span> {errorObj}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl text-sm font-bold border border-green-100">
                <span>✅</span> {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isActivating || children.length === 0}
              className="w-full bg-[#FFD93D] text-[#1a1a2e] py-4 rounded-xl font-black text-lg hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isActivating ? "Activating..." : (children.find(c => c.id === selectedChildId)?.isPremium ? "Extend Premium" : "Activate Now")}
            </button>
          </form>
        </div>

        <div id="contact-section">
          <ContactSupport />
        </div>
      </div>
      
      {showContactPopup && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#1a1a2e]/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
             <div className="text-6xl mb-4">💬</div>
             <h2 className="text-2xl font-black font-['Baloo_2'] text-[#1a1a2e] mb-2">Need a code?</h2>
             <p className="text-[#6a6a8c] font-bold mb-6">Contact us to access an activation code to unlock premium features!</p>
             <button
               onClick={() => {
                 setShowContactPopup(false);
                 document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
               }}
               className="w-full bg-[#1aaee8] text-white py-3 rounded-xl font-black text-lg hover:scale-105 transition-transform"
             >
               Show Contact Options
             </button>
             <button
               onClick={() => setShowContactPopup(false)}
               className="mt-4 text-[#9999bb] font-bold text-sm hover:text-[#1a1a2e] transition-colors"
             >
               I already have a code
             </button>
          </div>
        </div>
      )}

      <FeatureGuide 
        featureId="activation_page" 
        title="Premium Activation 💎" 
        description="Just enter the code from your purchase email and assign it to the right child. Their premium features unlock instantly!"
        position="bottom-left"
      />
    </div>
  );
}
