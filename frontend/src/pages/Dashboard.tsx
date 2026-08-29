import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { TopMetricCards } from '../components/dashboard/TopMetricCards';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { SalesFunnelCard } from '../components/dashboard/SalesFunnelCard';
import { UpcomingTasksCard } from '../components/dashboard/UpcomingTasksCard';
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard';
import { VoiceCallModal } from '../components/dashboard/VoiceCallModal';
import { addonService } from '../services/api';
import { DashboardOverview } from '../types/call';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const data = await addonService.getDashboardOverview();
      setOverview(data);
    } catch (e) {
      console.error('Failed fetching dashboard overview', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 5000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/70 dark:bg-slate-950 px-5 sm:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 w-full font-sans transition-colors duration-150">
      {/* 1. Header with Greeting and Actions (Edge-to-Edge) */}
      <DashboardHeader
        userName={overview?.user_name || 'Riya'}
        workspaceName={overview?.workspace_name || 'Apex Media'}
        onStartCall={() => setVoiceModalOpen(true)}
        onAddTask={() => {
          const addBtn = document.querySelector('[title="Upcoming Tasks"] button');
        }}
        onOpenWorkflow={() => navigate('/builder')}
      />

      {/* 2. Top 4 Metric KPI Cards */}
      <TopMetricCards data={overview} />

      {/* 3. Middle Section: Revenue Overview (60%) + Sales Funnel (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        <div className="lg:col-span-7 xl:col-span-8">
          <RevenueChart points={overview?.chart_points} currentPeriod={overview?.chart_period} />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <SalesFunnelCard stats={overview?.funnel} />
        </div>
      </div>

      {/* 4. Bottom Section: Upcoming Tasks (50%) + Recent Activity (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 pb-2">
        <div className="lg:col-span-6">
          <UpcomingTasksCard tasks={overview?.upcoming_tasks} onTaskToggled={fetchOverview} />
        </div>
        <div className="lg:col-span-6">
          <RecentActivityCard activities={overview?.recent_activities} />
        </div>
      </div>

      {/* Interactive Voice Assistant Modal */}
      <VoiceCallModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
    </div>
  );
};
