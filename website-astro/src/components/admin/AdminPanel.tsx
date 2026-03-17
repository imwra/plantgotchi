import { useState } from "react";
import SiteNav from "../SiteNav";
import OverviewTab from "./OverviewTab";
import UsersTab from "./UsersTab";
import PlantsTab from "./PlantsTab";
import ActivityTab from "./ActivityTab";
import AdminDashboard from "../AdminDashboard";
import HPSystemTab from "./HPSystemTab";

type Tab = "overview" | "users" | "plants" | "activity" | "hp-system" | "launch-tracker";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "plants", label: "Plants" },
  { id: "activity", label: "Activity" },
  { id: "hp-system", label: "HP System" },
  { id: "launch-tracker", label: "Launch Tracker" },
];

interface AdminPanelProps {
  userName?: string;
}

export default function AdminPanel({ userName }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen bg-cream text-pixel-black">
      <SiteNav userName={userName} />

      {/* Header */}
      <header className="bg-green-dark text-cream shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="pixel-font text-base sm:text-lg tracking-wide">
            ADMIN PANEL
          </h1>
          <p className="text-cream-dark text-xs mt-1 opacity-80">
            Platform Overview & Management
          </p>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-cream-dark shadow-sm sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition cursor-pointer ${
                activeTab === tab.id
                  ? "border-green-plant text-green-dark"
                  : "border-transparent text-pixel-gray hover:text-pixel-black hover:border-cream-dark"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "plants" && <PlantsTab />}
        {activeTab === "activity" && <ActivityTab />}
        {activeTab === "hp-system" && <HPSystemTab />}
        {activeTab === "launch-tracker" && <AdminDashboard embedded />}
      </main>
    </div>
  );
}
