import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Shell from "./components/Shell.jsx";
import { FarmProvider } from "./lib/useFarm.jsx";

import Home from "./pages/Home.jsx";
import Analyse from "./pages/Analyse.jsx";
import Result from "./pages/Result.jsx";
import Chat from "./pages/Chat.jsx";
import Voice from "./pages/Voice.jsx";
import FarmMap from "./pages/FarmMap.jsx";
import Satellite from "./pages/Satellite.jsx";
import Soil from "./pages/Soil.jsx";
import Weather from "./pages/Weather.jsx";
import Knowledge from "./pages/Knowledge.jsx";
import Monitoring from "./pages/Monitoring.jsx";
import Alerts from "./pages/Alerts.jsx";
import Reports from "./pages/Reports.jsx";
import Profile from "./pages/Profile.jsx";
import More from "./pages/More.jsx";
import Auth from "./pages/Auth.jsx";
import { AuthProvider, useAuth } from "./lib/auth.jsx";

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <main className="auth-page"><p className="muted">Loading your farm...</p></main>;
  if (!user) return <Auth />;

  // The latest assessment is held here so Result and Reports can both read it
  // without a round trip after the analysis finishes.
  const [result, setResult] = useState(null);

  return (
    <FarmProvider user={user}>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analyse" element={<Analyse onResult={setResult} />} />
          <Route path="/result" element={<Result result={result} />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/voice" element={<Voice />} />
          <Route path="/map" element={<FarmMap />} />
          <Route path="/satellite" element={<Satellite />} />
          <Route path="/soil" element={<Soil />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<Reports result={result} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/more" element={<More />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Shell>
    </FarmProvider>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
