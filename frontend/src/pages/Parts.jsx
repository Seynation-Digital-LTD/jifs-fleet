import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const Parts = () => {
    const { user } = useAuth();
    const [parts, setParts] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        vehicle_id: '',
        part_number: '',
        serial_number: '',
        part_name: '',
        installed_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
    });

    const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [partsRes, vehiclesRes] = await Promise.all([
                api.get('/parts'),
                api.get('/vehicles'),
            ]);
            setParts(partsRes.data.parts);
            setVehicles(vehiclesRes.data.vehicles.filter(v => v.status === 'active'));
        } catch {
            setError('Failed to load parts. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/parts/${editingId}`, formData);
            } else {
                await api.post('/parts', formData);
            }
            fetchData();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed. Please try again.');
        }
    };

    const handleEdit = (part) => {
        setFormData({
            vehicle_id: part.vehicle_id,
            part_number: part.part_number || '',
            serial_number: part.serial_number || '',
            part_name: part.part_name,
            installed_date: part.installed_date || new Date().toISOString().split('T')[0],
            expiry_date: part.expiry_date || '',
        });
        setEditingId(part.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (part) => {
        setDeleteModal({ open: true, id: part.id, name: `${part.part_name} (${part.plate_no})` });
    };

    const doDelete = async () => {
        try {
            await api.delete(`/parts/${deleteModal.id}`);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({
            vehicle_id: '',
            part_number: '',
            serial_number: '',
            part_name: '',
            installed_date: new Date().toISOString().split('T')[0],
            expiry_date: '',
        });
        setEditingId(null);
        setShowForm(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    };

    const getExpiryStatus = (dateStr) => {
        if (!dateStr) return null;
        const days = Math.ceil((new Date(dateStr + 'T00:00:00') - new Date().setHours(0, 0, 0, 0)) / 86400000);
        if (days < 0) return 'expired';
        if (days <= 30) return 'expiring';
        return 'ok';
    };

    // Show serial number field prominently when part name contains tyre/tire
    const isTyre = formData.part_name.toLowerCase().match(/tyre|tire|wheel/);

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
                    <h1 className="text-2xl font-bold text-gray-900">Parts</h1>
                    <p className="text-gray-500 mt-1">Track vehicle parts and expiry dates</p>
                </div>
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
                            Add Part
                        </>
                    )}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="card p-6 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-900 mb-4">
                        {editingId ? 'Edit Part' : 'Add New Part'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle *</label>
                                <select
                                    value={formData.vehicle_id}
                                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                                    className="input select"
                                    required
                                >
                                    <option value="">Select Vehicle</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.plate_no}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Part Name *</label>
                                <input
                                    type="text"
                                    value={formData.part_name}
                                    onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                                    placeholder="Oil filter, Tyre, Brake pads…"
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Part Number</label>
                                <input
                                    type="text"
                                    value={formData.part_number}
                                    onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                                    placeholder="e.g. OFT-445"
                                    className="input"
                                />
                            </div>
                            <div className={isTyre ? 'ring-2 ring-amber-400 rounded-xl p-1 -m-1' : ''}>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Serial Number
                                    {isTyre && <span className="ml-2 text-amber-600 font-semibold text-xs">← Required for tyres</span>}
                                </label>
                                <input
                                    type="text"
                                    value={formData.serial_number}
                                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                    placeholder={isTyre ? 'Tyre serial number (DOT code)' : 'Serial or chassis number'}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Installed Date</label>
                                <input
                                    type="date"
                                    value={formData.installed_date}
                                    onChange={(e) => setFormData({ ...formData, installed_date: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
                                <input
                                    type="date"
                                    value={formData.expiry_date}
                                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button type="submit" className="btn btn-success">
                                {editingId ? 'Update Part' : 'Create Part'}
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
                ) : parts.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                        <p className="text-gray-500 mb-2">No parts recorded</p>
                        <button onClick={() => setShowForm(true)} className="font-medium hover:underline" style={{ color: "#c47f17" }}>
                            Add your first part
                        </button>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Vehicle</th>
                                <th>Part Name</th>
                                <th>Part No</th>
                                <th>Serial No</th>
                                <th>Installed</th>
                                <th>Expiry</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parts.map((part) => {
                                const expiryStatus = getExpiryStatus(part.expiry_date);
                                return (
                                    <tr key={part.id} className={expiryStatus === 'expired' ? 'bg-red-50' : expiryStatus === 'expiring' ? 'bg-amber-50' : ''}>
                                        <td className="font-medium text-gray-900">{part.plate_no}</td>
                                        <td className="text-gray-900">{part.part_name}</td>
                                        <td className="text-gray-500 font-mono text-xs">{part.part_number || '-'}</td>
                                        <td className="text-gray-500 font-mono text-xs">{part.serial_number || '-'}</td>
                                        <td className="text-gray-600">{formatDate(part.installed_date)}</td>
                                        <td>
                                            {part.expiry_date ? (
                                                <span className={`badge ${
                                                    expiryStatus === 'expired' ? 'badge-danger' :
                                                    expiryStatus === 'expiring' ? 'badge-warning' : 'badge-success'
                                                }`}>
                                                    {formatDate(part.expiry_date)}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleEdit(part)} className="link text-sm">Edit</button>
                                                <button onClick={() => handleDelete(part)} className="link link-danger text-sm">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Parts;
