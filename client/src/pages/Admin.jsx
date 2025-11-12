import React from 'react';

export default function Admin({ darkMode }) {
  const mockSubs = [
    { id: '1', userName: 'John Doe', userEmail: 'john@example.com', planName: 'Professional', status: 'active', startDate: '2024-01-15' },
    { id: '2', userName: 'Jane Smith', userEmail: 'jane@example.com', planName: 'Enterprise', status: 'active', startDate: '2024-02-01' },
    { id: '3', userName: 'Bob Wilson', userEmail: 'bob@example.com', planName: 'Starter', status: 'expired', startDate: '2023-12-20' },
  ];

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="container mx-auto px-4 py-12">
      <h2 className={`text-3xl font-bold ${textClass} mb-8`}>All Subscriptions</h2>
      <div className={`${cardBg} rounded-2xl shadow-xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-4 text-left ${textClass}`}>User</th>
                <th className={`px-6 py-4 text-left ${textClass}`}>Email</th>
                <th className={`px-6 py-4 text-left ${textClass}`}>Plan</th>
                <th className={`px-6 py-4 text-left ${textClass}`}>Status</th>
                <th className={`px-6 py-4 text-left ${textClass}`}>Start Date</th>
              </tr>
            </thead>
            <tbody>
              {mockSubs.map((sub) => (
                <tr key={sub.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`px-6 py-4 ${textClass}`}>{sub.userName}</td>
                  <td className={`px-6 py-4 ${textSecondary}`}>{sub.userEmail}</td>
                  <td className={`px-6 py-4 ${textClass} font-semibold`}>{sub.planName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${textSecondary}`}>{new Date(sub.startDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
