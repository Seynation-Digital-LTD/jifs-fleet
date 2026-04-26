import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

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

const TYPE_ICONS = { fuel: '⛽', maintenance: '🔧', insurance: '🛡️', other: '📦' };

const EMPTY_FORM = {
    name: '', contact: '', preset: 'Fuel', type_label: '',
    tin_no: '', vrn_no: '', billing_address: '', email: '',
    salesman: '', salesman_contact: '', logo_data: '',
};

const Suppliers = () => {
    const { user } = useAuth();
    const logoInputRef = useRef(null);

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });

    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [balance, setBalance] = useState(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

    useEffect(() => { fetchSuppliers(); }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data.suppliers);
        } catch {
            setError('Failed to load suppliers.');
        } finally {
            setLoading(false);
        }
    };

    const openProfile = async (supplier) => {
        if (selectedSupplier?.id === supplier.id) {
            setSelectedSupplier(null); setBalance(null); return;
        }
        setSelectedSupplier(supplier);
        setBalance(null);
        setBalanceLoading(true);
        try {
            const res = await api.get(`/expenses/statement?supplier_id=${supplier.id}`);
            setBalance(res.data.summary || { total_debit: 0, total_credit: 0, final_balance: 0 });
        } catch {
            setBalance({ total_debit: 0, total_credit: 0, final_balance: 0 });
        } finally {
            setBalanceLoading(false);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setFormData(f => ({ ...f, logo_data: ev.target.result }));
        reader.readAsDataURL(file);
    };

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
            const payload = {
                name: formData.name, contact: formData.contact, type, type_label,
                tin_no: formData.tin_no, vrn_no: formData.vrn_no,
                billing_address: formData.billing_address, email: formData.email,
                salesman: formData.salesman, salesman_contact: formData.salesman_contact,
                logo_data: formData.logo_data,
            };
            if (editingId) {
                await api.put(`/suppliers/${editingId}`, payload);
                if (selectedSupplier?.id === editingId) setSelectedSupplier({ ...selectedSupplier, ...payload, type, type_label });
            } else {
                await api.post('/suppliers', payload);
            }
            fetchSuppliers();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed.');
        }
    };

    const handleEdit = (supplier) => {
        const matchedPreset = SUPPLIER_PRESETS.find(p => p.label === supplier.type_label);
        const preset = matchedPreset ? supplier.type_label : 'Other (specify below)';
        setFormData({
            name: supplier.name || '', contact: supplier.contact || '',
            preset, type_label: matchedPreset ? '' : (supplier.type_label || ''),
            tin_no: supplier.tin_no || '', vrn_no: supplier.vrn_no || '',
            billing_address: supplier.billing_address || '', email: supplier.email || '',
            salesman: supplier.salesman || '', salesman_contact: supplier.salesman_contact || '',
            logo_data: supplier.logo_data || '',
        });
        setEditingId(supplier.id);
        setShowForm(true);
        setSelectedSupplier(null);
    };

    const doDelete = async () => {
        try {
            await api.delete(`/suppliers/${deleteModal.id}`);
            if (selectedSupplier?.id === deleteModal.id) setSelectedSupplier(null);
            fetchSuppliers();
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed.');
        }
    };

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setEditingId(null);
        setShowForm(false);
        if (logoInputRef.current) logoInputRef.current.value = '';
    };

    const isAdmin = user?.role === 'admin';
    const isCustomPreset = formData.preset === 'Other (specify below)';
    const getDisplayLabel = (s) => s.type_label || s.type;
    const fmt = (n) => n != null ? new Intl.NumberFormat('en-TZ').format(n) : '0';

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
                    <span className="text-sm">{error}</span>
                    <button onClick={() => setError(null)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
                    <p className="text-gray-500 mt-1">Manage your service providers and vendors</p>
                </div>
                {isAdmin && (
                    <button onClick={() => { setShowForm(!showForm); setSelectedSupplier(null); }} className="btn btn-primary">
                        {showForm
                            ? <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Cancel</>
                            : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Supplier</>
                        }
                    </button>
                )}
            </div>

            {/* ── Supplier Form ── */}
            {showForm && (
                <div className="card p-6 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-900 mb-5">{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                    <form onSubmit={handleSubmit}>

                        {/* Basic info */}
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Basic Information</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier Name *</label>
                                <input type="text" value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Total Energies, Said Salim Bakhresa"
                                    className="input" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone / Contact</label>
                                <input type="text" value={formData.contact}
                                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                    placeholder="Phone number" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supply Category *</label>
                                <select value={formData.preset}
                                    onChange={e => setFormData({ ...formData, preset: e.target.value, type_label: '' })}
                                    className="input select" required>
                                    {SUPPLIER_PRESETS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                </select>
                            </div>
                            {isCustomPreset && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Specify Category *</label>
                                    <input type="text" value={formData.type_label}
                                        onChange={e => setFormData({ ...formData, type_label: e.target.value })}
                                        placeholder="e.g. Spare parts, Canopy repair…"
                                        className="input" required autoFocus />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                <input type="email" value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="supplier@example.com" className="input" />
                            </div>
                        </div>

                        {/* Official details */}
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Official Details (for statements)</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">TIN Number</label>
                                <input type="text" value={formData.tin_no}
                                    onChange={e => setFormData({ ...formData, tin_no: e.target.value })}
                                    placeholder="e.g. 100-100-223" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">VRN Number</label>
                                <input type="text" value={formData.vrn_no}
                                    onChange={e => setFormData({ ...formData, vrn_no: e.target.value })}
                                    placeholder="e.g. 10000007C" className="input" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Billing / Physical Address</label>
                                <input type="text" value={formData.billing_address}
                                    onChange={e => setFormData({ ...formData, billing_address: e.target.value })}
                                    placeholder="e.g. Plot 1, Block 75, Livingstone St, Dar es Salaam"
                                    className="input" />
                            </div>
                        </div>

                        {/* Account manager */}
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Account Manager (Salesman)</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Salesman Name</label>
                                <input type="text" value={formData.salesman}
                                    onChange={e => setFormData({ ...formData, salesman: e.target.value })}
                                    placeholder="e.g. Amos Zakayo" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Salesman Contact</label>
                                <input type="text" value={formData.salesman_contact}
                                    onChange={e => setFormData({ ...formData, salesman_contact: e.target.value })}
                                    placeholder="e.g. +255 712 000 000" className="input" />
                            </div>
                        </div>

                        {/* Logo upload */}
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Supplier Logo (shows on printed statements)</p>
                        <div className="flex items-center gap-4 mb-6">
                            {formData.logo_data && formData.logo_data.startsWith('data:') && (
                                <img src={formData.logo_data} alt="logo preview"
                                    className="w-16 h-16 object-contain rounded border border-gray-200 bg-white p-1" />
                            )}
                            <div>
                                <input ref={logoInputRef} type="file" accept="image/*"
                                    onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                                <label htmlFor="logo-upload"
                                    className="btn btn-ghost cursor-pointer text-sm">
                                    {formData.logo_data && formData.logo_data.startsWith('data:') ? 'Change Logo' : 'Upload Logo'}
                                </label>
                                {formData.logo_data && formData.logo_data.startsWith('data:') && (
                                    <button type="button" onClick={() => { setFormData(f => ({ ...f, logo_data: '' })); if (logoInputRef.current) logoInputRef.current.value = ''; }}
                                        className="ml-2 text-xs text-red-400 hover:text-red-600">Remove</button>
                                )}
                                <p className="text-xs text-gray-400 mt-1">PNG or JPG, max 1MB</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" className="btn btn-success">
                                {editingId ? 'Update Supplier' : 'Create Supplier'}
                            </button>
                            <button type="button" onClick={resetForm} className="btn btn-ghost">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Supplier table */}
                <div className={`${selectedSupplier ? 'lg:col-span-2' : 'lg:col-span-3'} card overflow-hidden`}>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #c47f17', borderTopColor: 'transparent' }}></div>
                        </div>
                    ) : suppliers.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-2">No suppliers found</p>
                            {isAdmin && (
                                <button onClick={() => setShowForm(true)} className="font-medium hover:underline" style={{ color: '#c47f17' }}>
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
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map(supplier => {
                                    const isSelected = selectedSupplier?.id === supplier.id;
                                    return (
                                        <tr key={supplier.id} className="cursor-pointer"
                                            style={isSelected ? { background: 'rgba(196,127,23,0.06)' } : {}}
                                            onClick={() => openProfile(supplier)}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    {supplier.logo_data && supplier.logo_data.startsWith('data:')
                                                        ? <img src={supplier.logo_data} alt="" className="w-7 h-7 object-contain rounded" />
                                                        : <span className="text-lg">{TYPE_ICONS[supplier.type] || '📦'}</span>
                                                    }
                                                    <span className="font-medium text-gray-900">{supplier.name}</span>
                                                </div>
                                            </td>
                                            <td className="text-gray-600">{supplier.contact || '-'}</td>
                                            <td>
                                                <span className={`badge ${BADGE_COLORS[supplier.type] || 'badge-info'}`}>
                                                    {getDisplayLabel(supplier)}
                                                </span>
                                            </td>
                                            <td onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => openProfile(supplier)} className="link text-sm"
                                                        style={{ color: isSelected ? '#c47f17' : undefined }}>
                                                        {isSelected ? 'Hide' : 'View'}
                                                    </button>
                                                    {isAdmin && <>
                                                        <button onClick={() => handleEdit(supplier)} className="link text-sm">Edit</button>
                                                        <button onClick={() => setDeleteModal({ open: true, id: supplier.id, name: supplier.name })} className="link link-danger text-sm">Delete</button>
                                                    </>}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Profile panel */}
                {selectedSupplier && (
                    <div className="lg:col-span-1 animate-fade-in">
                        <div className="card p-5 sticky top-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {selectedSupplier.logo_data && selectedSupplier.logo_data.startsWith('data:')
                                        ? <img src={selectedSupplier.logo_data} alt="" className="w-12 h-12 object-contain rounded border border-gray-100 bg-white p-1" />
                                        : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(196,127,23,0.08)' }}>
                                            {TYPE_ICONS[selectedSupplier.type] || '📦'}
                                          </div>
                                    }
                                    <div>
                                        <h3 className="font-bold text-gray-900 leading-tight">{selectedSupplier.name}</h3>
                                        <span className={`badge ${BADGE_COLORS[selectedSupplier.type] || 'badge-info'} text-xs`}>
                                            {getDisplayLabel(selectedSupplier)}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedSupplier(null); setBalance(null); }} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="space-y-1.5 text-sm mb-4 pb-4 border-b border-gray-100">
                                {selectedSupplier.contact && <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{selectedSupplier.contact}</span></div>}
                                {selectedSupplier.email && <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-xs">{selectedSupplier.email}</span></div>}
                                {selectedSupplier.tin_no && <div className="flex justify-between"><span className="text-gray-500">TIN No.</span><span className="font-mono text-xs">{selectedSupplier.tin_no}</span></div>}
                                {selectedSupplier.vrn_no && <div className="flex justify-between"><span className="text-gray-500">VRN No.</span><span className="font-mono text-xs">{selectedSupplier.vrn_no}</span></div>}
                                {selectedSupplier.billing_address && <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="text-xs text-right max-w-[55%]">{selectedSupplier.billing_address}</span></div>}
                                {selectedSupplier.salesman && <div className="flex justify-between"><span className="text-gray-500">Salesman</span><span className="font-medium">{selectedSupplier.salesman}</span></div>}
                                {selectedSupplier.salesman_contact && <div className="flex justify-between"><span className="text-gray-500">Salesman Tel</span><span className="font-medium">{selectedSupplier.salesman_contact}</span></div>}
                            </div>

                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Account Balance (All Time)</p>
                            {balanceLoading ? (
                                <div className="flex justify-center py-4">
                                    <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid #c47f17', borderTopColor: 'transparent' }}></div>
                                </div>
                            ) : balance && (
                                <div className="space-y-2">
                                    <div className="flex justify-between px-3 py-2 rounded-lg bg-red-50">
                                        <span className="text-xs font-semibold text-red-500">Total Debit</span>
                                        <span className="font-bold text-red-700 text-sm">TZS {fmt(balance.total_debit)}</span>
                                    </div>
                                    <div className="flex justify-between px-3 py-2 rounded-lg bg-green-50">
                                        <span className="text-xs font-semibold text-green-500">Total Credit</span>
                                        <span className="font-bold text-green-700 text-sm">TZS {fmt(balance.total_credit)}</span>
                                    </div>
                                    <div className={`flex justify-between px-3 py-2.5 rounded-lg ${balance.final_balance < 0 ? 'bg-red-100' : 'bg-amber-50'}`}>
                                        <span className={`text-xs font-bold uppercase ${balance.final_balance < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                            {balance.final_balance < 0 ? 'Amount Owed' : 'Net Balance'}
                                        </span>
                                        <span className={`font-bold ${balance.final_balance < 0 ? 'text-red-700' : 'text-amber-700'}`}>
                                            TZS {fmt(Math.abs(balance.final_balance))}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                                <a href="/statement" className="btn btn-primary text-center text-sm py-2">View Full Statement</a>
                                {isAdmin && <button onClick={() => handleEdit(selectedSupplier)} className="btn btn-ghost text-sm py-2">Edit Supplier</button>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Suppliers;
