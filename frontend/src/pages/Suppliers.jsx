import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

// Predefined supplier categories. type maps to the DB enum; label is display name.
const SUPPLIER_PRESETS = [
    { type: 'fuel',        label: 'Fuel' },
    { type: 'fuel',        label: 'Fuel Station' },
    { type: 'maintenance', label: 'Maintenance & Repair' },
    { type: 'maintenance', label: 'Mechanical Workshop' },
    { type: 'other',       label: 'Tyres & Tubes' },
    { type: 'other',       label: 'Lubricants & Oils' },
    { type: 'other',       label: 'Parts & Spares' },
    { type: 'other',       label: 'Transport Services' },
    { type: 'other',       label: 'Electrical & Auto' },
    { type: 'insurance',   label: 'Insurance' },
    { type: 'other',       label: 'Security Services' },
    { type: 'other',       label: 'Washing & Cleaning' },
    { type: 'other',       label: 'Other (specify below)' },
];

const BADGE_COLORS = {
    fuel: 'badge-info',
    maintenance: 'badge-warning',
    insurance: 'badge-success',
    other: 'badge-danger',
};

const Suppliers = () => {
    const { user } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        preset: 'Fuel',
        type_label: '',    // custom label when preset is 'Other (specify below)'
    });

    const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });

    useEffect(() => { fetchSuppliers(); }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/suppliers');
            setSuppliers(response.data.suppliers);
        } catch {
            setError('Failed to load suppliers. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    // Resolve DB type + display label from the form
    const resolveTypeFields = () => {
        const preset = SUPPLIER_PRESETS.find(p => p.label === formData.preset);
        const isCustom = !preset || formData.preset === 'Other (specify below)';
        const type = isCustom ? 'other' : preset.type;
        const type_label = isCustom ? (formData.type_label || 'Other') : formData.preset;
        return { type, type_label };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { type, type_label } = resolveTypeFields();
            const payload = { name: formData.name, contact: formData.contact, type, type_label };
            if (editingId) {
                await api.put(`/suppliers/${editingId}`, payload);
            } else {
                await api.post('/suppliers', payload);
            }
            fetchSuppliers();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed. Please try again.');
        }
    };

    const handleEdit = (supplier) => {
        // Find matching preset by type_label
        const matchedPreset = SUPPLIER_PRESETS.find(p => p.label === supplier.type_label);
        const preset = matchedPreset ? supplier.type_label : 'Other (specify below)';
        const type_label = matchedPreset ? '' : (supplier.type_label || '');
        setFormData({
            name: supplier.name,
            contact: supplier.contact || '',
            preset,
            type_label,
        });
        setEditingId(supplier.id);
        setShowForm(true);
    };

    const handleDelete = (supplier) => {
        setDeleteModal({ open: true, id: supplier.id, name: supplier.name });
    };

    const doDelete = async () => {
        try {
            await api.delete(`/suppliers/${deleteModal.id}`);
            fetchSuppliers();
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', contact: '', preset: 'Fuel', type_label: '' });
        setEditingId(null);
        setShowForm(false);
    };

    const isAdmin = user?.role === 'admin';
    const isCustomPreset = formData.preset === 'Other (specify below)';

    const getDisplayLabel = (supplier) => supplier.type_label || supplier.type;

    return (
        <div className="animate-fade-in">
            <DeleteConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, id: null, name: '' })}
                onConfirm={doDelete}
                itemName={deleteModal.name}
            />

            {error && (
                <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <span className="text-sm">{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
                    <p className="text-gray-500 mt-1">Manage your service providers and vendors</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                        {showForm ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Supplier
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="card p-6 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-900 mb-4">
                        {editingId ? 'Edit Supplier' : 'Add New Supplier'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Total Energies, Kariakoo Auto"
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact</label>
                                <input
                                    type="text"
                                    value={formData.contact}
                                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                    placeholder="Phone or email"
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supply Category *</label>
                                <select
                                    value={formData.preset}
                                    onChange={(e) => setFormData({ ...formData, preset: e.target.value, type_label: '' })}
                                    className="input select"
                                    required
                                >
                                    {SUPPLIER_PRESETS.map(p => (
                                        <option key={p.label} value={p.label}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                            {isCustomPreset && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Specify Category *</label>
                                    <input
                                        type="text"
                                        value={formData.type_label}
                                        onChange={(e) => setFormData({ ...formData, type_label: e.target.value })}
                                        placeholder="e.g. Spare parts, Canopy repair…"
                                        className="input"
                                        required
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button type="submit" className="btn btn-success">
                                {editingId ? 'Update Supplier' : 'Create Supplier'}
                            </button>
                            <button type="button" onClick={resetForm} className="btn btn-ghost">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: '#c47f17', borderTopColor: 'transparent' }}></div>
                    </div>
                ) : suppliers.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-gray-500 mb-2">No suppliers found</p>
                        {isAdmin && (
                            <button onClick={() => setShowForm(true)} className="font-medium hover:underline" style={{ color: "#c47f17" }}>
                                Add your first supplier
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Category</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((supplier) => (
                                <tr key={supplier.id}>
                                    <td className="font-medium text-gray-900">{supplier.name}</td>
                                    <td className="text-gray-600">{supplier.contact || '-'}</td>
                                    <td>
                                        <span className={`badge ${BADGE_COLORS[supplier.type] || 'badge-info'}`}>
                                            {getDisplayLabel(supplier)}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleEdit(supplier)} className="link text-sm">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(supplier)} className="link link-danger text-sm">
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Suppliers;
