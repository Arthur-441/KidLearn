/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ParentDashboard from "./pages/ParentDashboard";
import ChildDashboard from "./pages/ChildDashboard";
import SubjectDashboard from "./pages/SubjectDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Game from "./pages/Game";
import AuthProvider from "./components/AuthProvider";

import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/child/:childId" element={<ChildDashboard />} />
          <Route
            path="/subject/:childId/:subject"
            element={<SubjectDashboard />}
          />
          <Route path="/game/:childId/:subject/:mode" element={<Game />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
