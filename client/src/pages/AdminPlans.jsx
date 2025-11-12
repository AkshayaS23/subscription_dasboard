import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, XCircle } from 'lucide-react';
import { mockPlans as defaultMockPlans } from '../utils/mockPlans';

export default function AdminPlans({ darkMode }) {
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  const [plans, setPlans] = useState(defaultMockPlans);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: '',
    duration: 30,
    features: ['']
  });

  const openCreatePlanModal = () => {
    setEditingPlan(null);
    setPlanForm({ name: '', price: '', duration: 30, features: [''] });
    setShowPlanModal(true);
  };

  const openEditPlanModal = (plan) => {
    setEditingPlan(plan);
    setPlanForm(plan);
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

  const removeFeature = (index) =>
    setPlanForm((p) => ({ ...p, features: p.features.filter((_, i) => i !== index) }));

  const savePlan = () => {
    const features = planForm.features.filter((f) => f.trim() !== '');
    if (!planForm.name || !planForm.price || !features.length) {
      alert('Please fill all fields');
      return;
    }
    if (editingPlan) {
      setPlans((prev) =>
        prev.map((p) => (p.id === editingPlan.id ? { ...planForm, features } : p))
      );
    } else {
      setPlans((prev) => [
        ...prev,
        { id: Date.now().toString(), ...planForm, features }
      ]);
    }
    closePlanModal();
  };

  const deletePlan = (id) =>
    window.confirm('Delete this plan?') && setPlans((prev) => prev.filter((p) => p.id !== id));

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={openCreatePlanModal}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> <span>Create Plan</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p.id} className={`${cardBg} rounded-2xl shadow-lg p-6`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className={`text-xl font-bold ${textClass}`}>{p.name}</h3>
                <p className={`${textSecondary}`}>${p.price} / {p.duration} days</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => openEditPlanModal(p)} className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deletePlan(p.id)} className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <ul className="space-y-1">
              {p.features.map((f, i) => (
                <li key={i} className={`${textSecondary}`}>• {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${cardBg} rounded-xl shadow-2xl w-full max-w-xl p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-2xl font-bold ${textClass}`}>
                {editingPlan ? 'Edit Plan' : 'New Plan'}
              </h3>
              <button onClick={closePlanModal}>
                <XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                className="w-full border px-4 py-2 rounded-lg"
                placeholder="Plan name"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              />
              <input
                className="w-full border px-4 py-2 rounded-lg"
                placeholder="Price"
                type="number"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
              />
              <input
                className="w-full border px-4 py-2 rounded-lg"
                placeholder="Duration (days)"
                type="number"
                value={planForm.duration}
                onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
              />

              <div>
                <p className={`font-semibold ${textClass} mb-2`}>Features</p>
                {planForm.features.map((f, i) => (
                  <div key={i} className="flex space-x-2 mb-2">
                    <input
                      value={f}
                      onChange={(e) => handleFeatureChange(i, e.target.value)}
                      className="flex-1 border px-4 py-2 rounded-lg"
                      placeholder={`Feature ${i + 1}`}
                    />
                    {planForm.features.length > 1 && (
                      <button
                        onClick={() => removeFeature(i)}
                        className="bg-red-100 text-red-600 px-3 rounded-lg"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addFeature} className="text-indigo-600 font-semibold">
                  + Add feature
                </button>
              </div>

              <div className="flex space-x-3 pt-4">
                <button onClick={savePlan} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold">
                  <Save className="inline-block w-5 h-5 mr-1" />
                  Save
                </button>
                <button onClick={closePlanModal} className="bg-gray-200 px-6 py-2 rounded-lg font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
