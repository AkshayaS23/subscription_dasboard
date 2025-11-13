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
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_ROOT = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

      // Fetch all stats in parallel
      const [usersRes, subsRes, plansRes] = await Promise.all([
        fetch(`${API_ROOT}/api/users`, {
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
        fetch(`${API_ROOT}/api/subscriptions`, {
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
        fetch(`${API_ROOT}/api/plans`, {
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
      ]);

      const usersData = await usersRes.json();
      const subsData = await subsRes.json();
      const plansData = await plansRes.json();

      const users = usersData?.data || usersData?.users || usersData || [];
      const subscriptions = subsData?.data || subsData?.subscriptions || subsData || [];
      const plans = plansData?.data || plansData?.plans || plansData || [];

      // Calculate revenue (sum of active subscription prices)
      const revenue = subscriptions
        .filter(sub => sub.status === 'active')
        .reduce((sum, sub) => {
          const price = sub.plan?.price || 0;
          return sum + price;
        }, 0);

      setStats({
        totalUsers: users.length,
        activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
        totalPlans: plans.length,
        revenue: revenue,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
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
        {/* <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className={`text-sm ${textSecondary}`}>Plans</span>
          </div>
          <h3 className={`text-3xl font-bold ${textClass} mb-1`}>{stats.totalPlans}</h3>
          <p className={`text-sm ${textSecondary}`}>Available Plans</p>
        </div> */}

        {/* Monthly Revenue */}
        <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className={`text-sm ${textSecondary}`}>Revenue</span>
          </div>
          <h3 className={`text-3xl font-bold ${textClass} mb-1`}>
            ${stats.revenue.toLocaleString()}
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