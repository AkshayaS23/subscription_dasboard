// client/src/pages/AdminPlans.jsx
import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, XCircle } from 'lucide-react';
import Toast from '../components/Toast';
import { planAPI } from '../services/api';

export default function AdminPlans({ darkMode }) {
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', price: '', duration: 30, features: [''] });
  const [toast, setToast] = useState(null);

  // broadcast channel for notifying other tabs
  const bc = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel('submanager') : null;

  const showToast = (message, type = 'info', duration = 3500) => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => setToast(null), duration + 200);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await planAPI.getAll();
        const data = res?.data?.data || res?.data || [];
        if (!mounted) return;
        setPlans(data);
      } catch (err) {
        console.error('Failed to load plans', err);
        showToast('Failed to load plans', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
      if (bc) bc.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreatePlanModal = () => {
    setEditingPlan(null);
    setPlanForm({ name: '', price: '', duration: 30, features: [''] });
    setShowPlanModal(true);
  };

  const openEditPlanModal = (plan) => {
    setEditingPlan(plan);
    // Normalize features to at least one string
    setPlanForm({ ...plan, features: plan.features && plan.features.length ? plan.features : [''] });
    setShowPlanModal(true);
  };

  const closePlanModal = () => {
    setShowPlanModal(false);
    setEditingPlan(null);
    setPlanForm({ name: '', price: '', duration: 30, features: [''] });
  };

  const handleFeatureChange = (index, value) => {
    const features = [...planForm.features];
    features[index] = value;
    setPlanForm((p) => ({ ...p, features }));
  };
  const addFeature = () => setPlanForm((p) => ({ ...p, features: [...p.features, ''] }));
  const removeFeature = (index) => setPlanForm((p) => ({ ...p, features: p.features.filter((_, i) => i !== index) }));

  const savePlan = async () => {
    const features = (planForm.features || []).map((f) => f.trim()).filter(Boolean);
    if (!planForm.name?.trim() || !planForm.price || !features.length) {
      showToast('Please fill name, price and at least one feature', 'warning');
      return;
    }

    try {
      if (editingPlan) {
        const res = await planAPI.update(editingPlan._id || editingPlan.id, {
          name: planForm.name.trim(),
          price: Number(planForm.price),
          duration: Number(planForm.duration),
          features,
        });
        const updated = res?.data?.data || res?.data || res;
        setPlans((prev) => prev.map((p) => (p._id === (updated._id || updated.id) ? updated : p)));
        showToast('Plan updated', 'success');
      } else {
        const res = await planAPI.create({
          name: planForm.name.trim(),
          price: Number(planForm.price),
          duration: Number(planForm.duration),
          features,
        });
        const created = res?.data?.data || res?.data || res;
        setPlans((prev) => [created, ...prev]);
        showToast('Plan created', 'success');
      }

      // notify other tabs to refresh plans
      if (bc) bc.postMessage({ type: 'plans-updated' });
      closePlanModal();
    } catch (err) {
      console.error('Save plan error', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to save plan';
      showToast(msg, 'error');
    }
  };

  const deletePlan = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await planAPI.delete(id);
      setPlans((prev) => prev.filter((p) => (p._id || p.id) !== id));
      showToast('Plan deleted', 'success');
      if (bc) bc.postMessage({ type: 'plans-updated' });
    } catch (err) {
      console.error('Delete plan error', err);
      showToast('Failed to delete plan', 'error');
    }
  };

  if (loading) return <p className="text-center py-8 text-gray-500">Loading plans...</p>;

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} duration={3000} darkMode={darkMode} />

      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${textClass}`}>Manage Plans</h2>
        <div>
          <button onClick={openCreatePlanModal} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> <span>Create Plan</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p._id || p.id} className={`${cardBg} rounded-2xl shadow-lg p-6`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className={`text-xl font-bold ${textClass}`}>{p.name}</h3>
                <p className={`${textSecondary}`}>${p.price} / {p.duration} days</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => openEditPlanModal(p)} className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deletePlan(p._id || p.id)} className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <ul className="space-y-1">
              {(p.features || []).map((f, i) => <li key={i} className={`${textSecondary}`}>• {f}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${cardBg} rounded-xl shadow-2xl w-full max-w-xl p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-2xl font-bold ${textClass}`}>{editingPlan ? 'Edit Plan' : 'New Plan'}</h3>
              <button onClick={closePlanModal}><XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="space-y-4">
              <input className="w-full border px-4 py-2 rounded-lg" placeholder="Plan name" value={planForm.name} onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))} />
              <input className="w-full border px-4 py-2 rounded-lg" placeholder="Price" type="number" value={planForm.price} onChange={(e) => setPlanForm((p) => ({ ...p, price: e.target.value }))} />
              <input className="w-full border px-4 py-2 rounded-lg" placeholder="Duration (days)" type="number" value={planForm.duration} onChange={(e) => setPlanForm((p) => ({ ...p, duration: e.target.value }))} />

              <div>
                <p className={`font-semibold ${textClass} mb-2`}>Features</p>
                {planForm.features.map((f, i) => (
                  <div key={i} className="flex space-x-2 mb-2">
                    <input value={f} onChange={(e) => handleFeatureChange(i, e.target.value)} className="flex-1 border px-4 py-2 rounded-lg" placeholder={`Feature ${i + 1}`} />
                    {planForm.features.length > 1 && <button onClick={() => removeFeature(i)} className="bg-red-100 text-red-600 px-3 rounded-lg">✕</button>}
                  </div>
                ))}
                <button onClick={addFeature} className="text-indigo-600 font-semibold">+ Add feature</button>
              </div>

              <div className="flex space-x-3 pt-4">
                <button onClick={savePlan} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold"><Save className="inline-block w-5 h-5 mr-1" />Save</button>
                <button onClick={closePlanModal} className="bg-gray-200 px-6 py-2 rounded-lg font-semibold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
