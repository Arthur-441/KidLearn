import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

interface AppUser extends User {
  role?: "admin" | "user";
  isPremium?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              ...currentUser,
              role: data.role || "user",
              isPremium: data.isPremium || false,
            });
          } else {
            // Create user document if it doesn't exist
            const { setDoc, serverTimestamp } = await import("firebase/firestore");
            await setDoc(doc(db, "users", currentUser.uid), {
              username: currentUser.displayName || currentUser.email?.split("@")[0] || "Parent",
              email: currentUser.email,
              stars: 0,
              badges: [],
              gamesPlayed: 0,
              createdAt: serverTimestamp(),
              role: "user",
              isPremium: false,
              subscriptionEndDate: null,
            });
            setUser({
              ...currentUser,
              role: "user",
              isPremium: false,
            });
          }
        } catch (error) {
          console.error("Error fetching user role", error);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
