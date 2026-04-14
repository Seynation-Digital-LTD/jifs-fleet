import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const DOC_TYPES = [
    { value: 'tra_sticker', label: 'TRA Sticker' },
    { value: 'road_licence', label: 'Road Licence' },
    { value: 'psv_licence', label: 'PSV Licence' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'goods_licence', label: 'Goods Licence' },
    { value: 'other', label: 'Other' },
];

const Documents = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [documents, setDocuments] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        vehicle_id: '',
        doc_type: 'road_licence',
        doc_name: '',
        doc_number: '',
        issue_date: '',
        expiry_date: '',
        notes: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [docsRes, vehiclesRes] = await Promise.all([
                api.get('/documents'),
                api.get('/vehicles'),
            ]);
            setDocuments(docsRes.data.documents || []);
            setVehicles(vehiclesRes.data.vehicles.filter(v => v.status === 'active'));
        } catch {
            setError('Failed to load documents. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/documents/${editingId}`, formData);
            } else {
                await api.post('/documents', formData);
            }
            fetchData();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed. Please try again.');
        }
    };

    const handleEdit = (doc) => {
        setFormData({
            vehicle_id: doc.vehicle_id,
            doc_type: doc.doc_type,
            doc_name: doc.doc_name || '',
            doc_number: doc.doc_number || '',
            issue_date: doc.issue_date || '',
            expiry_date: doc.expiry_date || '',
            notes: doc.notes || '',
        });
        setEditingId(doc.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this document?')) return;
        try {
            await api.delete(`/documents/${id}`);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed.');
        }
    };

    const resetForm = () => {
        setFormData({ vehicle_id: '', doc_type: 'road_licence', doc_name: '', doc_number: '', issue_date: '', expiry_date: '', notes: '' });
        setEditingId(null);
        setShowForm(false);
    };

    const fmtDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr + 'T00:00:00');
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const getStatus = (expiry) => {
        if (!expiry) return null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const exp = new Date(expiry + 'T00:00:00');
        const days = Math.ceil((exp - today) / 86400000);
        if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, color: 'bg-red-100 text-red-700', urgency: 'overdue' };
        if (days <= 14) return { label: `${days}d left`, color: 'bg-red-100 text-red-700', urgency: 'urgent' };
        if (days <= 60) return { label: `${days}d left`, color: 'bg-amber-100 text-amber-700', urgency: 'warning' };
        return { label: `${days}d left`, color: 'bg-green-100 text-green-700', urgency: 'ok' };
    };

    const docTypeLabel = (val) => DOC_TYPES.find(d => d.value === val)?.label || val;

    const filtered = documents.filter(d => {
        const q = searchQuery.toLowerCase();
        if (q && !([d.plate_no, d.doc_name, d.doc_number, d.doc_type].join(' ').toLowerCase().includes(q))) return false;
        if (filterType && d.doc_type !== filterType) return false;
        if (filterStatus) {
            const st = getStatus(d.expiry_date);
            if (filterStatus === 'overdue' && st?.urgency !== 'overdue') return false;
            if (filterStatus === 'expiring' && !['urgent', 'warning'].includes(st?.urgency)) return false;
            if (filterStatus === 'ok' && st?.urgency !== 'ok') return false;
        }
        return true;
    });

    // Counts for status summary
    const overdueCount = documents.filter(d => getStatus(d.expiry_date)?.urgency === 'overdue').length;
    const urgentCount = documents.filter(d => getStatus(d.expiry_date)?.urgency === 'urgent').length;

    return (
        <div className="animate-fade-in">
            {error && (
                <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6">
                    <span className="text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vehicle Documents</h1>
                    <p className="text-gray-500 mt-1">Track TRA stickers, licences, insurance, and other documents</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                    {showForm ? (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Cancel</>
                    ) : (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Document</>
                    )}
                </button>
            </div>

            {/* Alert banners */}
            {(overdueCount > 0 || urgentCount > 0) && (
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    {overdueCount > 0 && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex-1">
                            <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <span className="text-sm font-medium text-red-700">{overdueCount} document{overdueCount > 1 ? 's' : ''} expired — action required</span>
                        </div>
                    )}
                    {urgentCount > 0 && (
                        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex-1">
                            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <span className="text-sm font-medium text-amber-700">{urgentCount} document{urgentCount > 1 ? 's' : ''} expiring within 14 days</span>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="card p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
                        <input type="text" placeholder="Search truck, doc type, number..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input pl-9" />
                    </div>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input select">
                        <option value="">All Document Types</option>
                        {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input select">
                        <option value="">All Statuses</option>
                        <option value="overdue">Expired</option>
                        <option value="expiring">Expiring Soon</option>
                        <option value="ok">Valid</option>
                    </select>
                </div>
                {(searchQuery || filterType || filterStatus) && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
                        <button onClick={() => { setSearchQuery(''); setFilterType(''); setFilterStatus(''); }} className="text-sm text-blue-600 hover:underline">Clear filters</button>
                    </div>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="card p-6 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-900 mb-4">{editingId ? 'Edit Document' : 'Add Document'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Truck *</label>
                                <select value={formData.vehicle_id} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })} className="input select" required>
                                    <option value="">Select Vehicle</option>
                                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_no}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Document Type *</label>
                                <select value={formData.doc_type} onChange={e => setFormData({ ...formData, doc_type: e.target.value })} className="input select" required>
                                    {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Document Name</label>
                                <input type="text" value={formData.doc_name} onChange={e => setFormData({ ...formData, doc_name: e.target.value })} placeholder="e.g. Comprehensive Insurance" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Document Number</label>
                                <input type="text" value={formData.doc_number} onChange={e => setFormData({ ...formData, doc_number: e.target.value })} placeholder="e.g. INS-2026-001" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Date</label>
                                <input type="date" value={formData.issue_date} onChange={e => setFormData({ ...formData, issue_date: e.target.value })} className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
                                <input type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} className="input" />
                            </div>
                        </div>
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                            <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Any extra details..." className="input" />
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="btn btn-success">{editingId ? 'Update Document' : 'Save Document'}</button>
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
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 mb-2">{documents.length === 0 ? 'No documents added yet' : 'No documents match your filters'}</p>
                        {documents.length === 0 && (
                            <button onClick={() => setShowForm(true)} className="text-blue-600 font-medium hover:underline">Add your first document</button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Truck</th>
                                    <th>Document Type</th>
                                    <th>Name / Number</th>
                                    <th>Issue Date</th>
                                    <th>Expiry Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(doc => {
                                    const status = getStatus(doc.expiry_date);
                                    return (
                                        <tr key={doc.id}>
                                            <td className="font-semibold text-gray-900">{doc.plate_no}</td>
                                            <td className="text-gray-700">{docTypeLabel(doc.doc_type)}</td>
                                            <td>
                                                <div className="text-gray-700">{doc.doc_name || '-'}</div>
                                                <div className="text-xs text-gray-400 font-mono">{doc.doc_number || ''}</div>
                                            </td>
                                            <td className="text-gray-600">{fmtDate(doc.issue_date)}</td>
                                            <td className="text-gray-600">{fmtDate(doc.expiry_date)}</td>
                                            <td>
                                                {status ? (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">No expiry</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => handleEdit(doc)} className="link text-sm">Edit</button>
                                                    {isAdmin && (
                                                        <button onClick={() => handleDelete(doc.id)} className="link link-danger text-sm">Delete</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Documents;
