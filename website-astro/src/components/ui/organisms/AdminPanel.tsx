import { useState, useEffect } from 'react';
import SiteNav from './SiteNav';
import OverviewTab from '../../admin/OverviewTab';
import UsersTab from '../../admin/UsersTab';
import PlantsTab from '../../admin/PlantsTab';
import ActivityTab from '../../admin/ActivityTab';
import { Analytics } from '../../../lib/analytics';

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type Tab = 'overview' | 'users' | 'plants' | 'activity';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'plants', label: 'Plants' },
  { id: 'activity', label: 'Activity' },
];

// ---------------------------------------------------------------------------
// AdminPanel
// ---------------------------------------------------------------------------

export interface AdminPanelProps {
  userName?: string;
  locale?: string;
  navLabels?: Record<string, string>;
}

export default function AdminPanel({ userName, locale, navLabels }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    Analytics.track('admin_panel_viewed', { tab: activeTab });
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-bg text-text">
      <SiteNav
        userName={userName}
        locale={locale as 'pt-br' | 'en'}
        labels={navLabels as any}
        currentPath={typeof window !== 'undefined' ? window.location.pathname : '/'}
      />

      {/* Header */}
      <header className="bg-primary-dark text-bg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="font-pixel text-base sm:text-lg tracking-wide">ADMIN PANEL</h1>
          <p className="text-bg-warm text-xs mt-1 opacity-80">Platform Overview & Management</p>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-bg-warm shadow-sm sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition cursor-pointer ${
                activeTab === tab.id
                  ? 'border-primary text-primary-dark'
                  : 'border-transparent text-text-mid hover:text-text hover:border-bg-warm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'plants' && <PlantsTab />}
        {activeTab === 'activity' && <ActivityTab />}
      </main>
    </div>
  );
}
