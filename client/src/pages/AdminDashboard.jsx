// client/src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Users, CreditCard, TrendingUp, DollarSign } from 'lucide-react';

export default function AdminDashboard({ darkMode }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalPlans: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  useEffect(() => {
    // initial load
    fetchStats();

    // BroadcastChannel listener
    let bc;
    const bcHandler = (ev) => {
      if (!ev?.data) return;
      console.log('[AdminDashboard] BroadcastChannel message:', ev.data);
      const type = ev.data.type;
      if (type === 'plans-updated' || type === 'subscriptions-updated' || type === 'users-updated') {
        fetchStats();
      }
    };

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('submanager');
        bc.addEventListener('message', bcHandler);
        console.log('[AdminDashboard] BroadcastChannel opened');
      } catch (e) {
        console.warn('[AdminDashboard] BroadcastChannel open failed', e);
      }
    } else {
      console.log('[AdminDashboard] BroadcastChannel not supported');
    }

    // storage event fallback
    const onStorage = (e) => {
      if (!e) return;
      // we expect keys like users-updated-at, plans-updated-at, subscriptions-updated-at
      if (e.key === 'users-updated-at' || e.key === 'plans-updated-at' || e.key === 'subscriptions-updated-at') {
        console.log('[AdminDashboard] storage event detected:', e.key, e.newValue);
        fetchStats();
      }
    };
    window.addEventListener('storage', onStorage);

    // cleanup
    return () => {
      if (bc) {
        try {
          bc.removeEventListener('message', bcHandler);
          bc.close();
          console.log('[AdminDashboard] BroadcastChannel closed');
        } catch (e) {
          // ignore
        }
      }
      window.removeEventListener('storage', onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const API_ROOT = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

      const usersUrl = `${API_ROOT}/api/users`;
      const subsUrl = `${API_ROOT}/api/subscriptions`;
      const plansUrl = `${API_ROOT}/api/plans`;

      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      console.log('[AdminDashboard] fetching stats from', { usersUrl, subsUrl, plansUrl, tokenPresent: !!token });

      const [usersRes, subsRes, plansRes] = await Promise.all([
        fetch(usersUrl, { headers }),
        fetch(subsUrl, { headers }),
        fetch(plansUrl, { headers }),
      ]);

      // debug the status codes
      console.log('[AdminDashboard] responses status:', {
        users: usersRes.status,
        subs: subsRes.status,
        plans: plansRes.status
      });

      // parse with try/catch
      const safeJson = async (r) => {
        try { return await r.json(); } catch (e) { return null; }
      };

      const usersData = await safeJson(usersRes);
      const subsData = await safeJson(subsRes);
      const plansData = await safeJson(plansRes);

      console.log('[AdminDashboard] responses bodies:', { usersData, subsData, plansData });

      const users = usersData?.data || usersData?.users || usersData || [];
      const subscriptions = subsData?.data || subsData?.subscriptions || subsData || [];
      const plans = plansData?.data || plansData?.plans || plansData || [];

      const revenue = (Array.isArray(subscriptions) ? subscriptions : [])
        .filter(s => s && s.status === 'active')
        .reduce((sum, sub) => {
          const price = Number(sub?.plan?.price ?? sub?.price ?? 0) || 0;
          return sum + price;
        }, 0);

      setStats({
        totalUsers: Array.isArray(users) ? users.length : (users.count ?? users.total ?? 0),
        activeSubscriptions: Array.isArray(subscriptions) ? subscriptions.filter(s => s && s.status === 'active').length : (subscriptions.count ?? subscriptions.active ?? 0),
        totalPlans: Array.isArray(plans) ? plans.length : (plans.count ?? plans.total ?? 0),
        revenue,
      });
    } catch (err) {
      console.error('[AdminDashboard] Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className={`text-3xl font-bold ${textClass} mb-2`}>Admin Dashboard</h2>
        <p className={textSecondary}>Overview of your subscription management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className={`text-sm ${textSecondary}`}>Total</span>
          </div>
          <h3 className={`text-3xl font-bold ${textClass} mb-1`}>{stats.totalUsers}</h3>
          <p className={`text-sm ${textSecondary}`}>Registered Users</p>
        </div>

        {/* Active Subscriptions */}
        <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className={`text-sm ${textSecondary}`}>Active</span>
          </div>
          <h3 className={`text-3xl font-bold ${textClass} mb-1`}>{stats.activeSubscriptions}</h3>
          <p className={`text-sm ${textSecondary}`}>Active Subscriptions</p>
        </div>

        {/* Total Plans */}
        <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className={`text-sm ${textSecondary}`}>Plans</span>
          </div>
          <h3 className={`text-3xl font-bold ${textClass} mb-1`}>{stats.totalPlans}</h3>
          <p className={`text-sm ${textSecondary}`}>Available Plans</p>
        </div>

        {/* Monthly Revenue */}
        <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className={`text-sm ${textSecondary}`}>Revenue</span>
          </div>
          <h3 className={`text-3xl font-bold ${textClass} mb-1`}>
            ${Number(stats.revenue || 0).toLocaleString()}
          </h3>
          <p className={`text-sm ${textSecondary}`}>Total Active Revenue</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`${cardBg} rounded-2xl shadow-xl p-8`}>
        <h3 className={`text-xl font-bold ${textClass} mb-6`}>Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/plans"
            className="flex items-center justify-between p-4 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <div>
              <h4 className={`font-semibold ${textClass} mb-1`}>Manage Plans</h4>
              <p className={`text-sm ${textSecondary}`}>Create, edit, or delete subscription plans</p>
            </div>
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </a>

          <a
            href="/admin/subscriptions"
            className="flex items-center justify-between p-4 border-2 border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            <div>
              <h4 className={`font-semibold ${textClass} mb-1`}>View Subscriptions</h4>
              <p className={`text-sm ${textSecondary}`}>Monitor and manage user subscriptions</p>
            </div>
            <CreditCard className="w-6 h-6 text-green-600" />
          </a>
        </div>
      </div>

      {/* Recent Activity or Additional Info */}
      <div className={`${cardBg} rounded-2xl shadow-xl p-8 mt-6`}>
        <h3 className={`text-xl font-bold ${textClass} mb-4`}>System Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <span className={textSecondary}>System Status</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              Operational
            </span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <span className={textSecondary}>Last Updated</span>
            <span className={textClass}>{new Date().toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className={textSecondary}>Database</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
