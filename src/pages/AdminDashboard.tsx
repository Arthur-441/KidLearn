import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Key,
  LogOut,
  Plus,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  Activity,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [activeSubsCount, setActiveSubsCount] = useState(0);
  const [codes, setCodes] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Generator
  const [newCodeDuration, setNewCodeDuration] = useState(30);
  const [bulkCount, setBulkCount] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login");
      return;
    }

    const checkAdmin = async () => {
      const adminDoc = await getDoc(doc(db, "users", user.uid));
      if (adminDoc.exists() && adminDoc.data().role === "admin") {
        setIsAdmin(true);
        loadDashboardData();
      } else {
        navigate("/dashboard"); // Kick out
      }
    };
    checkAdmin();
  }, [user, loading, navigate]);

  const loadDashboardData = async () => {
    try {
      const codeSnap = await getDocs(
        query(collection(db, "premiumCodes"), orderBy("createdAt", "desc")),
      );
      setCodes(codeSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const subsSnap = await getDocs(
        query(collection(db, "subscriptions"), orderBy("activatedAt", "desc")),
      );
      const allSubs = subsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSubs(allSubs);

      const active = allSubs.filter(
        (s: any) => s.subscriptionStatus === "active",
      );
      setActiveSubsCount(active.length);

      const usersSnap = await getDocs(
        query(collection(db, "users"), orderBy("createdAt", "desc")),
      );
      setUsersList(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const generateCode = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let j = 0; j < bulkCount; j++) {
      let randomPart1 = "";
      let randomPart2 = "";
      for (let i = 0; i < 4; i++)
        randomPart1 += chars.charAt(Math.floor(Math.random() * chars.length));
      for (let i = 0; i < 4; i++)
        randomPart2 += chars.charAt(Math.floor(Math.random() * chars.length));
      const newCode = `KL-${randomPart1}-${randomPart2}`;

      try {
        await setDoc(doc(db, "premiumCodes", newCode), {
          code: newCode,
          createdAt: serverTimestamp(),
          createdByAdmin: user?.uid,
          status: "unused",
          durationDays: newCodeDuration,
          redeemed: false,
        });
      } catch (err) {
        console.error(err);
      }
    }
    await loadDashboardData();
    setIsGenerating(false);
  };

  const deleteCode = async (codeId: string) => {
    if (!window.confirm("Are you sure you want to delete this code?")) return;
    try {
      await deleteDoc(doc(db, "premiumCodes", codeId));
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#4ECAFC] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#4ECAFC] to-[#0288d1] flex items-center justify-center text-white font-bold text-xl">
            K
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">
            AdminPanel
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "subscriptions"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Subscriptions
          </button>
          <button
            onClick={() => setActiveTab("codes")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "codes"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Key className="w-4 h-4" /> Promocodes
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" /> Users
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-xl font-semibold text-gray-900 capitalize">
            {activeTab}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Admin Access
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Active Subscriptions
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {activeSubsCount}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Activity className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Total Codes Generated
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {codes.length}
                        </p>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <Key className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Total Revenue Tracked
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          $0
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Codes are free currently
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <CreditCard className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions & Recent */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Code Gen */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                      <h3 className="font-semibold text-gray-900">
                        Quick Generate
                      </h3>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Duration (Days)
                          </label>
                          <input
                            type="number"
                            value={newCodeDuration}
                            onChange={(e) =>
                              setNewCodeDuration(Number(e.target.value))
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Amount
                          </label>
                          <input
                            type="number"
                            value={bulkCount}
                            onChange={(e) =>
                              setBulkCount(Number(e.target.value))
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <button
                        onClick={generateCode}
                        disabled={isGenerating}
                        className="mt-4 w-full bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        {isGenerating
                          ? "Generating..."
                          : `Generate ${bulkCount} Codes`}
                      </button>
                    </div>
                  </div>

                  {/* Recent Subs */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">
                        Recent Activations
                      </h3>
                      <button
                        onClick={() => setActiveTab("subscriptions")}
                        className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
                      >
                        View All
                      </button>
                    </div>
                    <div className="p-0 flex-1 overflow-auto">
                      <ul className="divide-y divide-gray-100">
                        {subs.slice(0, 5).map((s) => (
                          <li
                            key={s.id}
                            className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                                {s.parentId}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <Key className="w-3 h-3" /> {s.activationCode}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  s.subscriptionStatus === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {s.subscriptionStatus}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {s.activatedAt?.toDate
                                  ? format(
                                      s.activatedAt.toDate(),
                                      "MMM d, yyyy",
                                    )
                                  : "N/A"}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                      {subs.length === 0 && (
                        <div className="p-6 text-center text-sm text-gray-500">
                          No activations yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* CODES TAB */}
            {activeTab === "codes" && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                <div className="p-5 border-b border-gray-200 bg-white flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">
                    Promocodes Inventory
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={newCodeDuration}
                      onChange={(e) =>
                        setNewCodeDuration(Number(e.target.value))
                      }
                      placeholder="Days"
                      className="w-20 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      type="number"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(Number(e.target.value))}
                      placeholder="Count"
                      className="w-20 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      onClick={generateCode}
                      className="bg-indigo-600 text-white rounded-md px-3 py-1.5 text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Generate
                    </button>
                  </div>
                </div>
                <div className="overflow-auto flex-1">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {codes.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-indigo-600 flex items-center gap-2">
                            {c.code}
                            <button
                              onClick={() => copyToClipboard(c.code)}
                              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                              title="Copy code"
                            >
                              {copiedCode === c.code ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                c.status === "unused"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {c.durationDays} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {c.createdAt?.toDate
                              ? format(
                                  c.createdAt.toDate(),
                                  "MMM d, yyyy HH:mm",
                                )
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {c.status === "unused" && (
                              <button
                                onClick={() => deleteCode(c.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUBSCRIPTIONS TAB */}
            {activeTab === "subscriptions" && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                <div className="p-5 border-b border-gray-200 bg-white flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">
                    Active & Past Subscriptions
                  </h3>
                </div>
                <div className="overflow-auto flex-1">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code Used
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expires
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subs.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono text-xs truncate max-w-[200px]">
                            {s.parentId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                s.subscriptionStatus === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s.subscriptionStatus === "active" ? "bg-green-500" : "bg-red-500"}`}
                              ></span>
                              {s.subscriptionStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600">
                            {s.activationCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {s.activatedAt?.toDate
                              ? format(s.activatedAt.toDate(), "MMM d, yyyy")
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {s.expiresAt?.toDate
                              ? format(s.expiresAt.toDate(), "MMM d, yyyy")
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === "users" && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                <div className="p-5 border-b border-gray-200 bg-white flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">
                    User Management
                  </h3>
                </div>
                <div className="overflow-auto flex-1">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email/Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Premium Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {u.email}
                            </div>
                            <div className="text-xs text-gray-500">
                              {u.username}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {u.role || "user"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                u.isPremium
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {u.isPremium ? "Premium" : "Free"}
                            </span>
                            {u.isPremium && u.subscriptionEndDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                Ends:{" "}
                                {u.subscriptionEndDate?.toDate
                                  ? format(
                                      u.subscriptionEndDate.toDate(),
                                      "MMM d, yyyy",
                                    )
                                  : "N/A"}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {u.createdAt?.toDate
                              ? format(u.createdAt.toDate(), "MMM d, yyyy")
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {/* Actions can be added here, e.g. toggle role */}
                            <button
                              onClick={async () => {
                                const newRole =
                                  u.role === "admin" ? "user" : "admin";
                                if (
                                  window.confirm(`Change role to ${newRole}?`)
                                ) {
                                  try {
                                    await updateDoc(doc(db, "users", u.id), {
                                      role: newRole,
                                    });
                                    loadDashboardData();
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Toggle Admin
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usersList.length === 0 && (
                    <div className="p-6 text-center text-sm text-gray-500">
                      No users found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
