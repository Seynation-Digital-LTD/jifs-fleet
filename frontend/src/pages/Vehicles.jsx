import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const DOC_TYPES = [
    { value: 'tra_sticker', label: 'TRA Sticker' },
    { value: 'road_licence', label: 'Road Licence' },
    { value: 'psv_licence', label: 'PSV Licence' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'goods_licence', label: 'Goods Licence' },
    { value: 'other', label: 'Other' },
];

const getDocStatus = (expiry) => {
    if (!expiry) return null;
    const days = Math.ceil((new Date(expiry + 'T00:00:00') - new Date().setHours(0, 0, 0, 0)) / 86400000);
    if (days < 0) return { label: 'Overdue', color: 'badge-danger', days };
    if (days <= 14) return { label: `${days}d left`, color: 'badge-danger', days };
    if (days <= 60) return { label: `${days}d left`, color: 'badge-warning', days };
    return { label: 'Valid', color: 'badge-success', days };
};

const fmtDate = (d) => {
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Vehicles = () => {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        plate_no: '',
        vehicle_type: '',
        make_model: '',
        year: '',
        status: 'active',
        monthly_budget: '',
    });

    // Detail panel state
    const [detailId, setDetailId] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailTab, setDetailTab] = useState('docs');

    // Inline doc form within detail panel
    const [showDocForm, setShowDocForm] = useState(false);
    const [docFormData, setDocFormData] = useState({
        doc_type: 'road_licence', doc_name: '', doc_number: '', issue_date: '', expiry_date: '', notes: '',
    });
    const [docSaving, setDocSaving] = useState(false);

    // Delete modal
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });

    useEffect(() => { fetchVehicles(); }, []);

    const fetchVehicles = async () => {
        try {
            const response = await api.get('/vehicles');
            setVehicles(response.data.vehicles);
        } catch {
            setError('Failed to load vehicles. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                monthly_budget: formData.monthly_budget ? parseFloat(formData.monthly_budget) : 0,
            };
            if (editingId) {
                await api.put(`/vehicles/${editingId}`, payload);
            } else {
                await api.post('/vehicles', payload);
            }
            fetchVehicles();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed. Please try again.');
        }
    };

    const handleEdit = (vehicle) => {
        setFormData({
            plate_no: vehicle.plate_no,
            vehicle_type: vehicle.vehicle_type || '',
            make_model: vehicle.make_model || '',
            year: vehicle.year || '',
            status: vehicle.status,
            monthly_budget: vehicle.monthly_budget || '',
        });
        setEditingId(vehicle.id);
        setShowForm(true);
        setDetailId(null);
    };

    const handleDelete = (vehicle) => {
        setDeleteModal({ open: true, id: vehicle.id, name: vehicle.plate_no });
    };

    const doDelete = async () => {
        try {
            await api.delete(`/vehicles/${deleteModal.id}`);
            fetchVehicles();
            if (detailId === deleteModal.id) setDetailId(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({ plate_no: '', vehicle_type: '', make_model: '', year: '', status: 'active', monthly_budget: '' });
        setEditingId(null);
        setShowForm(false);
    };

    // Load detail panel data for a vehicle
    const loadDetail = async (vehicleId) => {
        if (detailId === vehicleId) {
            setDetailId(null);
            setDetailData(null);
            return;
        }
        setDetailId(vehicleId);
        setDetailTab('docs');
        setDetailLoading(true);
        setDetailData(null);
        setShowDocForm(false);
        try {
            const [docsRes, partsRes, servicesRes] = await Promise.all([
                api.get('/documents'),
                api.get(`/parts/vehicle/${vehicleId}`),
                api.get('/services'),
            ]);
            const docs = (docsRes.data.documents || []).filter(d => d.vehicle_id === vehicleId);
            const parts = partsRes.data.parts || [];
            const services = (servicesRes.data.services || [])
                .filter(s => s.vehicle_id === vehicleId)
                .sort((a, b) => new Date(b.service_date) - new Date(a.service_date));
            setDetailData({ docs, parts, services });
        } catch {
            setDetailData({ docs: [], parts: [], services: [] });
        } finally {
            setDetailLoading(false);
        }
    };

    const handleSaveDoc = async (e) => {
        e.preventDefault();
        setDocSaving(true);
        try {
            await api.post('/documents', { ...docFormData, vehicle_id: detailId });
            setDocFormData({ doc_type: 'road_licence', doc_name: '', doc_number: '', issue_date: '', expiry_date: '', notes: '' });
            setShowDocForm(false);
            // Refresh detail
            const docsRes = await api.get('/documents');
            const docs = (docsRes.data.documents || []).filter(d => d.vehicle_id === detailId);
            setDetailData(prev => ({ ...prev, docs }));
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save document.');
        } finally {
            setDocSaving(false);
        }
    };

    const handleDeleteDoc = async (docId) => {
        try {
            await api.delete(`/documents/${docId}`);
            setDetailData(prev => ({ ...prev, docs: prev.docs.filter(d => d.id !== docId) }));
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete document.');
        }
    };

    const filteredVehicles = vehicles.filter((v) => {
        const q = searchQuery.toLowerCase();
        if (q && !([v.plate_no, v.vehicle_type, v.make_model].join(' ').toLowerCase().includes(q))) return false;
        if (filterStatus && v.status !== filterStatus) return false;
        return true;
    });

    const fmt = (n) => n ? new Intl.NumberFormat('en-TZ').format(n) : '-';
    const isAdmin = user?.role === 'admin';

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
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                        <span className="text-sm">{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
                    <p className="text-gray-500 mt-1">Manage your fleet vehicles — click a row to view details</p>
                </div>
                {isAdmin && (
                    <button onClick={() => { setShowForm(!showForm); setDetailId(null); }} className="btn btn-primary">
                        {showForm ? (
                            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Cancel</>
                        ) : (
                            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Vehicle</>
                        )}
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
                        <input type="text" placeholder="Search plate, type, make/model..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input pl-9" />
                    </div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input select">
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                {(searchQuery || filterStatus) && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">{filteredVehicles.length} result{filteredVehicles.length !== 1 ? 's' : ''}</p>
                        <button onClick={() => { setSearchQuery(''); setFilterStatus(''); }} className="text-sm text-blue-600 hover:underline">Clear filters</button>
                    </div>
                )}
            </div>

            {/* Add / Edit Form */}
            {showForm && (
                <div className="card p-6 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-900 mb-4">{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Plate No *</label>
                                <input type="text" value={formData.plate_no} onChange={e => setFormData({ ...formData, plate_no: e.target.value })} placeholder="T 123 ABC" className="input" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type</label>
                                <input type="text" value={formData.vehicle_type} onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })} placeholder="Truck, Van, etc." className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Make & Model</label>
                                <input type="text" value={formData.make_model} onChange={e => setFormData({ ...formData, make_model: e.target.value })} placeholder="Toyota Hilux" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
                                <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} placeholder="2020" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="input select">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Budget (TZS)</label>
                                <input type="number" step="1000" value={formData.monthly_budget} onChange={e => setFormData({ ...formData, monthly_budget: e.target.value })} placeholder="e.g. 5,000,000" className="input" />
                            </div>
                        </div>
                        {editingId && (
                            <p className="text-xs text-blue-600 mb-4">
                                <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                To manage documents for this vehicle, save changes then click "View Details" on the vehicle row.
                            </p>
                        )}
                        <div className="flex gap-3">
                            <button type="submit" className="btn btn-success">{editingId ? 'Update Vehicle' : 'Create Vehicle'}</button>
                            <button type="button" onClick={resetForm} className="btn btn-ghost">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0V9a4 4 0 014-4h0a4 4 0 014 4v4" /></svg>
                        <p className="text-gray-500 mb-2">{vehicles.length === 0 ? 'No vehicles found' : 'No vehicles match your filters'}</p>
                        {vehicles.length === 0 && isAdmin && (
                            <button onClick={() => setShowForm(true)} className="text-blue-600 font-medium hover:underline">Add your first vehicle</button>
                        )}
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Plate No</th>
                                <th>Type</th>
                                <th>Make / Model</th>
                                <th>Year</th>
                                <th>Status</th>
                                <th className="text-right">Monthly Budget</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVehicles.map((vehicle) => (
                                <>
                                    <tr
                                        key={vehicle.id}
                                        className={`cursor-pointer transition-colors ${detailId === vehicle.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                        onClick={() => loadDetail(vehicle.id)}
                                    >
                                        <td className="font-semibold text-gray-900 flex items-center gap-2">
                                            <svg className={`w-3.5 h-3.5 transition-transform ${detailId === vehicle.id ? 'rotate-90 text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                            {vehicle.plate_no}
                                        </td>
                                        <td className="text-gray-600">{vehicle.vehicle_type || '-'}</td>
                                        <td className="text-gray-600">{vehicle.make_model || '-'}</td>
                                        <td className="text-gray-600">{vehicle.year || '-'}</td>
                                        <td>
                                            <span className={`badge ${vehicle.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{vehicle.status}</span>
                                        </td>
                                        <td className="text-right text-gray-600">
                                            {vehicle.monthly_budget > 0 ? `TZS ${fmt(vehicle.monthly_budget)}` : <span className="text-gray-400">Not set</span>}
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => loadDetail(vehicle.id)} className="link text-sm text-blue-600">
                                                    {detailId === vehicle.id ? 'Hide' : 'Details'}
                                                </button>
                                                {isAdmin && (
                                                    <>
                                                        <button onClick={() => handleEdit(vehicle)} className="link text-sm">Edit</button>
                                                        <button onClick={() => handleDelete(vehicle)} className="link link-danger text-sm">Delete</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>

                                    {/* ── Detail Panel ── */}
                                    {detailId === vehicle.id && (
                                        <tr key={`detail-${vehicle.id}`}>
                                            <td colSpan={7} className="bg-blue-50/50 p-0 border-b border-blue-100">
                                                <div className="p-5">
                                                    {detailLoading ? (
                                                        <div className="flex items-center gap-3 py-4 text-gray-500">
                                                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                            Loading vehicle details…
                                                        </div>
                                                    ) : detailData ? (
                                                        <div>
                                                            {/* Sub-tabs */}
                                                            <div className="flex gap-2 mb-4">
                                                                {[
                                                                    { id: 'docs', label: `Documents (${detailData.docs.length})` },
                                                                    { id: 'services', label: `Services (${detailData.services.length})` },
                                                                    { id: 'parts', label: `Parts (${detailData.parts.length})` },
                                                                ].map(t => (
                                                                    <button
                                                                        key={t.id}
                                                                        onClick={() => setDetailTab(t.id)}
                                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${detailTab === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                                                                    >
                                                                        {t.label}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            {/* Documents Tab */}
                                                            {detailTab === 'docs' && (
                                                                <div>
                                                                    {detailData.docs.length === 0 && !showDocForm ? (
                                                                        <p className="text-sm text-gray-500 mb-3">No documents on file for this vehicle.</p>
                                                                    ) : (
                                                                        <div className="overflow-x-auto mb-3">
                                                                            <table className="w-full text-sm">
                                                                                <thead>
                                                                                    <tr className="border-b border-gray-200">
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Doc No</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Issue Date</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Expiry</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                                                                        {isAdmin && <th className="py-2 px-3"></th>}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {detailData.docs.map(doc => {
                                                                                        const st = getDocStatus(doc.expiry_date);
                                                                                        const typeLabel = DOC_TYPES.find(t => t.value === doc.doc_type)?.label || doc.doc_type;
                                                                                        return (
                                                                                            <tr key={doc.id} className="border-b border-gray-100 last:border-0">
                                                                                                <td className="py-2 px-3 font-medium text-gray-800">{typeLabel}</td>
                                                                                                <td className="py-2 px-3 text-gray-600 font-mono text-xs">{doc.doc_number || '-'}</td>
                                                                                                <td className="py-2 px-3 text-gray-600">{fmtDate(doc.issue_date)}</td>
                                                                                                <td className="py-2 px-3 text-gray-600">{fmtDate(doc.expiry_date)}</td>
                                                                                                <td className="py-2 px-3">
                                                                                                    {st ? <span className={`badge ${st.color}`}>{st.label}</span> : <span className="text-gray-400 text-xs">No expiry</span>}
                                                                                                </td>
                                                                                                {isAdmin && (
                                                                                                    <td className="py-2 px-3">
                                                                                                        <button onClick={() => handleDeleteDoc(doc.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                                                                                                    </td>
                                                                                                )}
                                                                                            </tr>
                                                                                        );
                                                                                    })}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    )}

                                                                    {/* Add Doc mini-form */}
                                                                    {showDocForm ? (
                                                                        <form onSubmit={handleSaveDoc} className="bg-white rounded-xl border border-blue-200 p-4">
                                                                            <p className="text-sm font-semibold text-gray-800 mb-3">Add Document for {vehicle.plate_no}</p>
                                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                                                                <div>
                                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Document Type *</label>
                                                                                    <select value={docFormData.doc_type} onChange={e => setDocFormData({ ...docFormData, doc_type: e.target.value })} className="input text-sm py-1.5">
                                                                                        {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                                                    </select>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Doc Name / Notes</label>
                                                                                    <input type="text" value={docFormData.doc_name} onChange={e => setDocFormData({ ...docFormData, doc_name: e.target.value })} placeholder="Optional name" className="input text-sm py-1.5" />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Document Number</label>
                                                                                    <input type="text" value={docFormData.doc_number} onChange={e => setDocFormData({ ...docFormData, doc_number: e.target.value })} placeholder="e.g. TRA-20261234" className="input text-sm py-1.5" />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Issue Date</label>
                                                                                    <input type="date" value={docFormData.issue_date} onChange={e => setDocFormData({ ...docFormData, issue_date: e.target.value })} className="input text-sm py-1.5" />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date</label>
                                                                                    <input type="date" value={docFormData.expiry_date} onChange={e => setDocFormData({ ...docFormData, expiry_date: e.target.value })} className="input text-sm py-1.5" />
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <button type="submit" disabled={docSaving} className="btn btn-success text-sm py-1.5 px-4">{docSaving ? 'Saving…' : 'Save Document'}</button>
                                                                                <button type="button" onClick={() => setShowDocForm(false)} className="btn btn-ghost text-sm py-1.5 px-4">Cancel</button>
                                                                            </div>
                                                                        </form>
                                                                    ) : (
                                                                        <button onClick={() => setShowDocForm(true)} className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline">
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                                            Add Document
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Services Tab */}
                                                            {detailTab === 'services' && (
                                                                <div>
                                                                    {detailData.services.length === 0 ? (
                                                                        <p className="text-sm text-gray-500">No service records for this vehicle.</p>
                                                                    ) : (
                                                                        <div className="overflow-x-auto">
                                                                            <table className="w-full text-sm">
                                                                                <thead>
                                                                                    <tr className="border-b border-gray-200">
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Service Date</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Next Service</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Next KM</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {detailData.services.map((svc, i) => {
                                                                                        const isUpcoming = svc.next_service_date && new Date(svc.next_service_date) > new Date();
                                                                                        const isDue = svc.next_service_date && new Date(svc.next_service_date) <= new Date();
                                                                                        return (
                                                                                            <tr key={svc.id} className={`border-b border-gray-100 last:border-0 ${i === 0 ? 'font-medium' : ''}`}>
                                                                                                <td className="py-2 px-3 text-gray-700">{fmtDate(svc.service_date)}</td>
                                                                                                <td className="py-2 px-3 text-gray-600">{svc.description || '-'}</td>
                                                                                                <td className="py-2 px-3">
                                                                                                    {svc.next_service_date ? (
                                                                                                        <span className={isDue ? 'text-red-600 font-semibold' : isUpcoming ? 'text-amber-600' : 'text-gray-600'}>
                                                                                                            {fmtDate(svc.next_service_date)}
                                                                                                            {isDue && ' ⚠ DUE'}
                                                                                                        </span>
                                                                                                    ) : '-'}
                                                                                                </td>
                                                                                                <td className="py-2 px-3 text-gray-600">{svc.next_service_km ? `${fmt(svc.next_service_km)} km` : '-'}</td>
                                                                                            </tr>
                                                                                        );
                                                                                    })}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    )}
                                                                    <p className="text-xs text-gray-400 mt-3">To add a new service record, go to the Services page.</p>
                                                                </div>
                                                            )}

                                                            {/* Parts Tab */}
                                                            {detailTab === 'parts' && (
                                                                <div>
                                                                    {detailData.parts.length === 0 ? (
                                                                        <p className="text-sm text-gray-500">No parts recorded for this vehicle.</p>
                                                                    ) : (
                                                                        <div className="overflow-x-auto">
                                                                            <table className="w-full text-sm">
                                                                                <thead>
                                                                                    <tr className="border-b border-gray-200">
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Part Name</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Part No</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Serial No</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Installed</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Expiry</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {detailData.parts.map(part => {
                                                                                        const st = getDocStatus(part.expiry_date);
                                                                                        return (
                                                                                            <tr key={part.id} className="border-b border-gray-100 last:border-0">
                                                                                                <td className="py-2 px-3 text-gray-800 font-medium">{part.part_name}</td>
                                                                                                <td className="py-2 px-3 text-gray-500 font-mono text-xs">{part.part_number || '-'}</td>
                                                                                                <td className="py-2 px-3 text-gray-500 font-mono text-xs">{part.serial_number || '-'}</td>
                                                                                                <td className="py-2 px-3 text-gray-600">{fmtDate(part.installed_date)}</td>
                                                                                                <td className="py-2 px-3">
                                                                                                    {st ? <span className={`badge ${st.color}`}>{st.label}</span> : <span className="text-gray-400 text-xs">No expiry</span>}
                                                                                                </td>
                                                                                            </tr>
                                                                                        );
                                                                                    })}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    )}
                                                                    <p className="text-xs text-gray-400 mt-3">To add or remove parts, go to the Parts page.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Vehicles;
