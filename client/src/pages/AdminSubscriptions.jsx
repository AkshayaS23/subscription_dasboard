// // client/src/pages/AdminSubscriptions.jsx
// import React, { useEffect, useState } from 'react';
// import { subscriptionsAPI } from '../services/api';

// export default function AdminSubscriptions({ darkMode }) {
//   const [subscriptions, setSubscriptions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
//   const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
//   const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

//   useEffect(() => {
//     const fetchSubscriptions = async () => {
//       try {
//         const res = await subscriptionsAPI.getAll();
//         // ✅ Expecting: res.data.data or res.data
//         const subs = res?.data?.data || res?.data || [];
//         setSubscriptions(subs);
//       } catch (err) {
//         console.error('Error fetching subscriptions:', err);
//         setError('Failed to load subscriptions');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSubscriptions();
//   }, []);

//   if (loading) return <p className="text-center text-gray-500 mt-10">Loading subscriptions...</p>;
//   if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;

//   return (
//     <div className={`${cardBg} rounded-2xl shadow-xl overflow-hidden`}>
//       <table className="w-full">
//         <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
//           <tr>
//             <th className={`px-6 py-4 text-left ${textClass}`}>User</th>
//             <th className={`px-6 py-4 text-left ${textClass}`}>Email</th>
//             <th className={`px-6 py-4 text-left ${textClass}`}>Plan</th>
//             <th className={`px-6 py-4 text-left ${textClass}`}>Status</th>
//             <th className={`px-6 py-4 text-left ${textClass}`}>Start Date</th>
//             <th className={`px-6 py-4 text-left ${textClass}`}>End Date</th>
//           </tr>
//         </thead>
//         <tbody>
//           {subscriptions.length > 0 ? (
//             subscriptions.map((sub) => (
//               <tr key={sub._id} className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border-t`}>
//                 <td className={`px-6 py-4 ${textClass}`}>{sub.user?.name || '—'}</td>
//                 <td className={`px-6 py-4 ${textSecondary}`}>{sub.user?.email || '—'}</td>
//                 <td className={`px-6 py-4 ${textClass}`}>{sub.plan?.name || sub.planName || '—'}</td>
//                 <td className={`px-6 py-4`}>
//                   <span
//                     className={`px-3 py-1 rounded-full text-sm font-semibold ${
//                       sub.status === 'active'
//                         ? 'bg-green-100 text-green-700'
//                         : 'bg-red-100 text-red-700'
//                     }`}
//                   >
//                     {sub.status || 'unknown'}
//                   </span>
//                 </td>
//                 <td className={`px-6 py-4 ${textSecondary}`}>
//                   {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '—'}
//                 </td>
//                 <td className={`px-6 py-4 ${textSecondary}`}>
//                   {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '—'}
//                 </td>
//               </tr>
//             ))
//           ) : (
//             <tr>
//               <td colSpan="6" className="text-center py-6 text-gray-500">
//                 No subscriptions found
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }
