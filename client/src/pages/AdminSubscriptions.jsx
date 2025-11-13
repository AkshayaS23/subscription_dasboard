// client/src/pages/AdminSubscriptions.jsx
import React, { useEffect, useState } from 'react';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';

export default function AdminSubscriptions({ darkMode }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300';

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API_ROOT = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

      const res = await fetch(`${API_ROOT}/api/subscriptions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await res.json();
      const subs = data?.data || data?.subscriptions || data || [];
      setSubscriptions(subs);
      setError(null);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = 
      (sub.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.plan?.name || sub.planName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' || 
      sub.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    expired: subscriptions.filter(s => s.status === 'expired').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['User Name', 'Email', 'Plan', 'Status', 'Start Date', 'End Date'];
    const rows = filteredSubscriptions.map(sub => [
      sub.user?.name || '—',
      sub.user?.email || '—',
      sub.plan?.name || sub.planName || '—',
      sub.status || 'unknown',
      sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '—',
      sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '—',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className={`${cardBg} rounded-2xl shadow-xl p-8 text-center`}>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchSubscriptions}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className={`text-3xl font-bold ${textClass} mb-2`}>User Subscriptions</h2>
        <p className={textSecondary}>Manage and monitor all user subscriptions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
          <p className={textSecondary}>Total Subscriptions</p>
          <p className={`text-3xl font-bold ${textClass} mt-2`}>{stats.total}</p>
        </div>
        <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
          <p className={textSecondary}>Active</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
        </div>
        <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
          <p className={textSecondary}>Expired</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.expired}</p>
        </div>
        <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
          <p className={textSecondary}>Cancelled</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`${cardBg} rounded-2xl shadow-xl p-6 mb-6`}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${textSecondary}`} />
            <input
              type="text"
              placeholder="Search by user, email, or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${inputBg} ${textClass} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
          </div>

          {/* Filter and Actions */}
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${textSecondary}`} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`pl-10 pr-8 py-3 rounded-lg border ${inputBg} ${textClass} focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer`}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={fetchSubscriptions}
              className="px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              onClick={handleExport}
              className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className={`${cardBg} rounded-2xl shadow-xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <tr>
                <th className={`px-6 py-4 text-left ${textClass} font-semibold`}>User</th>
                <th className={`px-6 py-4 text-left ${textClass} font-semibold`}>Email</th>
                <th className={`px-6 py-4 text-left ${textClass} font-semibold`}>Plan</th>
                <th className={`px-6 py-4 text-left ${textClass} font-semibold`}>Status</th>
                <th className={`px-6 py-4 text-left ${textClass} font-semibold`}>Start Date</th>
                <th className={`px-6 py-4 text-left ${textClass} font-semibold`}>End Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.length > 0 ? (
                filteredSubscriptions.map((sub, index) => (
                  <tr 
                    key={sub._id || sub.id || index} 
                    className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border-t hover:bg-opacity-50 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <td className={`px-6 py-4 ${textClass} font-medium`}>
                      {sub.user?.name || '—'}
                    </td>
                    <td className={`px-6 py-4 ${textSecondary}`}>
                      {sub.user?.email || '—'}
                    </td>
                    <td className={`px-6 py-4 ${textClass}`}>
                      {sub.plan?.name || sub.planName || '—'}
                    </td>
                    <td className={`px-6 py-4`}>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                          sub.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : sub.status === 'expired'
                            ? 'bg-orange-100 text-orange-700'
                            : sub.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {sub.status || 'unknown'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 ${textSecondary}`}>
                      {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '—'}
                    </td>
                    <td className={`px-6 py-4 ${textSecondary}`}>
                      {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <p className={`${textSecondary} text-lg mb-2`}>No subscriptions found</p>
                    <p className={`${textSecondary} text-sm`}>
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'Subscriptions will appear here once users subscribe to plans'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Results count */}
        {filteredSubscriptions.length > 0 && (
          <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`${textSecondary} text-sm`}>
              Showing {filteredSubscriptions.length} of {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}