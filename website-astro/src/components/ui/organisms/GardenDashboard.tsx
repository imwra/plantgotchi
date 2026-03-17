import { useState, useEffect, useRef } from 'react';
import { Analytics } from '../../../lib/analytics';
import { toPlantView, type PlantView } from '../../../lib/plant-view';
import type { Plant, SensorReading, CareLog, Recommendation } from '../../../lib/db/queries';
import { DEMO_PLANTS, getDemoPlants, getDemoRecommendations } from '../../../lib/demo-data';
import { SummaryTag, PixelButton } from '../atoms';
import { DetailPanel, CareHistory, RecommendationItem } from '../molecules';
import SiteNav from './SiteNav';
import PlantGrid from './PlantGrid';
import AddPlantModal from './AddPlantModal';
import CareLogForm from './CareLogForm';
import ReadingForm from './ReadingForm';

// ---------------------------------------------------------------------------
// DashLabels
// ---------------------------------------------------------------------------

export interface DashLabels {
  subtitle: string;
  plants: string;
  happy: string;
  needWater: string;
  allPlants: string;
  plantDetails: string;
  tapPlant: string;
  hp: string;
  moisture: string;
  temp: string;
  light: string;
  health: string;
  watered: string;
  noData: string;
  statusHappy: string;
  statusThirsty: string;
  recommendations: string;
  careHistory: string;
  logReading: string;
  logCare: string;
  loading: string;
  noPlantsYet: string;
  addFirstPlant: string;
  add: string;
  footer: string;
  noLogsYet: string;
  dismiss: string;
  careWater: string;
  careFertilize: string;
  carePrune: string;
  careRepot: string;
  careMist: string;
  carePestTreatment: string;
  severityInfo: string;
  severityWarning: string;
  severityUrgent: string;
}

const DEFAULT_DASH_LABELS: DashLabels = {
  subtitle: 'HOME GARDEN MONITOR v0.1',
  plants: 'PLANTS',
  happy: 'HAPPY',
  needWater: 'NEED WATER',
  allPlants: 'ALL PLANTS',
  plantDetails: 'PLANT DETAILS',
  tapPlant: 'TAP A PLANT\nTO VIEW DETAILS',
  hp: 'HP',
  moisture: 'MOISTURE',
  temp: 'TEMP',
  light: 'LIGHT',
  health: 'HEALTH',
  watered: 'WATERED',
  noData: 'NO DATA',
  statusHappy: 'HAPPY',
  statusThirsty: 'THIRSTY!',
  recommendations: 'RECOMMENDATIONS',
  careHistory: 'CARE HISTORY',
  logReading: 'LOG READING',
  logCare: 'LOG CARE',
  loading: 'LOADING GARDEN...',
  noPlantsYet: 'NO PLANTS YET',
  addFirstPlant: 'ADD YOUR FIRST PLANT',
  add: '+ ADD',
  footer: 'PLANTGOTCHI \u2022 ESP32 + SOIL SENSOR \u2022 MADE WITH \u2764 IN \uD83C\uDDE7\uD83C\uDDF7',
  noLogsYet: 'NO CARE LOGS YET',
  dismiss: 'DISMISS',
  careWater: 'Water',
  careFertilize: 'Fertilize',
  carePrune: 'Prune',
  careRepot: 'Repot',
  careMist: 'Mist',
  carePestTreatment: 'Pest Treatment',
  severityInfo: 'INFO',
  severityWarning: 'WARNING',
  severityUrgent: 'URGENT',
};

// ---------------------------------------------------------------------------
// Detail section (right panel / mobile sheet)
// ---------------------------------------------------------------------------

function DetailSection({
  plant,
  onClose,
  onRefresh,
  demoMode,
  labels,
  locale,
}: {
  plant: PlantView | undefined;
  onClose?: () => void;
  onRefresh: () => void;
  demoMode?: boolean;
  labels: DashLabels;
  locale?: string;
}) {
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const trackedRecsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!plant) return;
    if (demoMode) {
      const demoData = getDemoPlants(locale || 'pt-br');
      const demoEntry = demoData.find((d) => d.plant.id === plant.id);
      setCareLogs(demoEntry?.recentCareLogs ?? []);
      setRecommendations(getDemoRecommendations(locale || 'pt-br').filter((r) => r.plant_id === plant.id));
      return;
    }
    const fetchDetails = async () => {
      const [logsRes, recsRes] = await Promise.all([
        fetch(`/api/care-logs?plantId=${plant.id}&limit=10`),
        fetch(`/api/recommendations?plantId=${plant.id}`),
      ]);
      if (logsRes.ok) setCareLogs(await logsRes.json());
      if (recsRes.ok) setRecommendations(await recsRes.json());
    };
    fetchDetails();
  }, [plant?.id, demoMode, locale]);

  useEffect(() => {
    if (!plant) return;
    const active = recommendations.filter((r) => !r.acted_on);
    active.forEach((rec) => {
      if (!trackedRecsRef.current.has(rec.id)) {
        trackedRecsRef.current.add(rec.id);
        Analytics.track('care_recommendation_viewed', { plant_id: plant.id, severity: rec.severity });
      }
    });
  }, [recommendations, plant?.id]);

  const refreshDetails = async () => {
    if (!plant) return;
    if (demoMode) return;
    onRefresh();
    const [logsRes, recsRes] = await Promise.all([
      fetch(`/api/care-logs?plantId=${plant.id}&limit=10`),
      fetch(`/api/recommendations?plantId=${plant.id}`),
    ]);
    if (logsRes.ok) setCareLogs(await logsRes.json());
    if (recsRes.ok) setRecommendations(await recsRes.json());
  };

  return (
    <DetailPanel
      plant={
        plant
          ? {
              name: plant.name,
              species: plant.species,
              emoji: plant.emoji,
              status: plant.status,
              hp: plant.hp,
              moisture: plant.moisture,
              temp: plant.temp,
              lightLabel: plant.lightLabel,
            }
          : undefined
      }
      onClose={onClose}
      labels={{
        tapPlant: labels.tapPlant,
        moisture: labels.moisture,
        temp: labels.temp,
        light: labels.light,
        health: labels.health,
      }}
    >
      {plant && (
        <>
          {/* Recommendations */}
          {recommendations.filter((r) => !r.acted_on).length > 0 && (
            <div className="mb-3.5">
              <div className="font-pixel text-pixel-xs text-text-mid mb-2">
                {'\u26A0\uFE0F'} {labels.recommendations}
              </div>
              <div className="space-y-1.5">
                {recommendations
                  .filter((r) => !r.acted_on)
                  .map((rec) => (
                    <RecommendationItem
                      key={rec.id}
                      message={rec.message}
                      severity={rec.severity as 'urgent' | 'warning' | 'info'}
                      onDismiss={demoMode ? undefined : () => refreshDetails()}
                      dismissLabel={labels.dismiss}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Reading Form */}
          {!demoMode && (
            <div className="mb-3.5">
              <div className="font-pixel text-pixel-xs text-text-mid mb-2">
                {'\uD83D\uDCCA'} {labels.logReading}
              </div>
              <ReadingForm plantId={plant.id} onSubmitted={refreshDetails} />
            </div>
          )}

          {/* Care Log Form */}
          {!demoMode && (
            <div className="mb-3.5">
              <div className="font-pixel text-pixel-xs text-text-mid mb-2">
                {'\uD83C\uDF31'} {labels.logCare}
              </div>
              <CareLogForm plantId={plant.id} onLogged={refreshDetails} />
            </div>
          )}

          {/* Care History */}
          <div>
            <div className="font-pixel text-pixel-xs text-text-mid mb-2">
              {'\uD83D\uDCCB'} {labels.careHistory}
            </div>
            <CareHistory
              logs={careLogs.map((l) => ({ action: l.action, notes: l.notes ?? undefined, created_at: l.created_at }))}
              labels={{
                noLogsYet: labels.noLogsYet,
                actionLabels: {
                  water: labels.careWater,
                  fertilize: labels.careFertilize,
                  prune: labels.carePrune,
                  repot: labels.careRepot,
                  mist: labels.careMist,
                  pest_treatment: labels.carePestTreatment,
                },
              }}
            />
          </div>
        </>
      )}
    </DetailPanel>
  );
}

// ---------------------------------------------------------------------------
// GardenDashboard
// ---------------------------------------------------------------------------

export interface GardenDashboardProps {
  userName?: string;
  demoMode?: boolean;
  demoBannerText?: string;
  locale?: string;
  navLabels?: Record<string, string>;
  dashLabels?: DashLabels;
}

export default function GardenDashboard({
  userName,
  demoMode,
  demoBannerText,
  locale,
  navLabels,
  dashLabels,
}: GardenDashboardProps) {
  const labels = dashLabels || DEFAULT_DASH_LABELS;
  const [plants, setPlants] = useState<PlantView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [time, setTime] = useState(new Date());

  const selectedPlant = plants.find((p) => p.id === selectedId);

  const fetchPlants = async () => {
    if (demoMode) {
      const demoData = getDemoPlants(locale || 'pt-br');
      const views = demoData.map((d) => toPlantView(d.plant, d.latestReading, d.recentCareLogs));
      setPlants(views);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/plants');
      if (!res.ok) throw new Error('Failed to load plants');
      const data = await res.json();
      const views = data.map(
        (item: { plant: Plant; latestReading: SensorReading | null; recentCareLogs: CareLog[] }) =>
          toPlantView(item.plant, item.latestReading, item.recentCareLogs),
      );
      setPlants(views);
      Analytics.track('garden_viewed', { plant_count: views.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading plants');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    await fetchPlants();
    Analytics.track('garden_refreshed', { plant_count: plants.length });
  };

  useEffect(() => {
    fetchPlants();
    const pollIv = setInterval(fetchPlants, 15000);
    return () => clearInterval(pollIv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const happyCount = plants.filter((p) => p.status === 'happy').length;
  const alertCount = plants.filter((p) => p.status === 'thirsty').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg via-bg-warm to-bg font-pixel text-text">
      <SiteNav
        userName={demoMode ? undefined : userName}
        locale={locale as 'pt-br' | 'en'}
        labels={navLabels as any}
        currentPath={typeof window !== 'undefined' ? window.location.pathname : '/'}
      />

      {/* Demo banner */}
      {demoMode && (
        <div className="bg-sun-pale border-b-2 border-sun px-4 py-1.5 text-center font-pixel text-pixel-sm text-text">
          {demoBannerText || 'Demo Mode \u2014 data is not saved'}
        </div>
      )}

      <div className="max-w-[960px] mx-auto px-3 sm:px-4 pt-3.5 pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3.5 pb-3 border-b-2 border-border-light">
          <div>
            <div className="font-pixel text-[13px] sm:text-[15px] text-primary-dark tracking-wide flex items-center gap-2">
              <span className="text-[22px]">{'\uD83C\uDF31'}</span> PLANTGOTCHI
            </div>
            <div className="font-pixel text-pixel-xs text-text-light mt-1 tracking-wider">
              {labels.subtitle}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!demoMode && (
              <PixelButton label={labels.add} variant="primary" onClick={() => setShowAddModal(true)} />
            )}
            <div className="font-pixel text-pixel-md text-text-mid bg-bg-card px-2.5 py-1 rounded-md border border-border-light">
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>
        </div>

        {/* Summary tags */}
        <div className="flex gap-1.5 sm:gap-2 flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible pb-1 mb-4 scrollbar-hide">
          <SummaryTag
            label={`${plants.length} ${labels.plants}`}
            icon={'\uD83C\uDF3F'}
            variant="primary"
          />
          <SummaryTag
            label={`${happyCount} ${labels.happy}`}
            icon={'\u2665'}
            variant="primary"
          />
          {alertCount > 0 && (
            <SummaryTag
              label={`${alertCount} ${labels.needWater}`}
              icon={'\u26A0\uFE0F'}
              variant="danger"
              pulse
            />
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-3xl mb-4 animate-pulse">{'\uD83C\uDF31'}</div>
            <p className="font-pixel text-pixel-sm text-text-light">{labels.loading}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-8 text-danger">
            <p className="font-pixel text-pixel-sm">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && plants.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">{'\uD83C\uDF31'}</div>
            <p className="font-pixel text-pixel-md mb-4 text-text">{labels.noPlantsYet}</p>
            <PixelButton label={labels.addFirstPlant} variant="primary" onClick={() => setShowAddModal(true)} />
          </div>
        )}

        {/* Main layout */}
        {!loading && !error && plants.length > 0 && (
          <div className="main-layout">
            <div>
              <div className="font-pixel text-pixel-xs text-text-light mb-2.5">
                {labels.allPlants} ({plants.length})
              </div>
              <PlantGrid
                plants={plants}
                selectedId={selectedId ?? undefined}
                onSelect={(id) => {
                  setSelectedId(id);
                  setShowDetail(true);
                  const plant = plants.find((p) => p.id === id);
                  if (plant) Analytics.track('plant_viewed', { plant_id: plant.id, species: plant.species });
                }}
              />
            </div>

            {/* Desktop detail */}
            <div className="detail-desktop">
              <div className="font-pixel text-pixel-xs text-text-light mb-2.5">
                {labels.plantDetails}
              </div>
              <DetailSection
                plant={selectedPlant}
                onRefresh={fetchPlants}
                demoMode={demoMode}
                labels={labels}
                locale={locale}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile overlay */}
      {showDetail && selectedPlant && (
        <div
          className="detail-mobile-overlay fixed inset-0 z-50 bg-black/30 backdrop-blur-sm items-end justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDetail(false);
          }}
        >
          <div className="w-full max-w-[480px] max-h-[85vh] overflow-y-auto px-3 pb-6 animate-slide-up">
            <div className="w-10 h-1 rounded bg-border-light mx-auto my-2" />
            <DetailSection
              plant={selectedPlant}
              onClose={() => setShowDetail(false)}
              onRefresh={fetchPlants}
              demoMode={demoMode}
              labels={labels}
              locale={locale}
            />
          </div>
        </div>
      )}

      {/* Add Plant Modal */}
      {showAddModal && !demoMode && (
        <AddPlantModal onClose={() => setShowAddModal(false)} onCreated={fetchPlants} />
      )}

      {/* Footer */}
      <div className="text-center px-4 py-4 font-pixel text-pixel-xs text-text-light tracking-wider">
        {labels.footer}
      </div>

      {/* Layout styles for desktop/mobile responsiveness */}
      <style>{`
.main-layout{display:flex;flex-direction:column;gap:16px}
@media(min-width:1060px){.main-layout{display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start}}
.detail-desktop{display:none}
@media(min-width:1060px){.detail-desktop{display:block;position:sticky;top:16px}}
.detail-mobile-overlay{display:flex}
@media(min-width:1060px){.detail-mobile-overlay{display:none!important}}
.scrollbar-hide::-webkit-scrollbar{display:none}
.scrollbar-hide{scrollbar-width:none}
      `}</style>
    </div>
  );
}
