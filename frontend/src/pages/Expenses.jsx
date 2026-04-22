import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const PAYMENT_STATUS = [
    { value: 'unpaid', label: 'Unpaid', color: 'bg-red-100 text-red-700' },
    { value: 'partial', label: 'Partial', color: 'bg-amber-100 text-amber-700' },
    { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-700' },
];

const Expenses = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterPayment, setFilterPayment] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        vehicle_id: '',
        supplier_id: '',
        date: new Date().toISOString().split('T')[0],
        due_date: '',
        reference_no: '',
        expense_type: 'fuel',
        item_description: '',
        quantity: '',
        unit: '',
        debit: '',
        credit: '',
        odometer_km: '',
        payment_status: 'unpaid',
        notes: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [expensesRes, vehiclesRes, suppliersRes] = await Promise.all([
                api.get('/expenses'),
                api.get('/vehicles'),
                api.get('/suppliers'),
            ]);
            setExpenses(expensesRes.data.expenses);
            setVehicles(vehiclesRes.data.vehicles.filter(v => v.status === 'active'));
            setSuppliers(suppliersRes.data.suppliers);
        } catch {
            setError('Failed to load expenses. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                quantity: formData.quantity ? parseFloat(formData.quantity) : null,
                debit: formData.debit ? parseFloat(formData.debit) : 0,
                credit: formData.credit ? parseFloat(formData.credit) : 0,
                odometer_km: formData.odometer_km ? parseFloat(formData.odometer_km) : null,
            };
            if (editingId) {
                await api.put(`/expenses/${editingId}`, payload);
            } else {
                await api.post('/expenses', payload);
            }
            fetchData();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed. Please try again.');
        }
    };

    const handleEdit = (expense) => {
        setFormData({
            vehicle_id: expense.vehicle_id,
            supplier_id: expense.supplier_id || '',
            date: expense.date,
            due_date: expense.due_date || '',
            reference_no: expense.reference_no || '',
            expense_type: expense.expense_type,
            item_description: expense.item_description || '',
            quantity: expense.quantity || '',
            unit: expense.unit || '',
            debit: expense.debit || '',
            credit: expense.credit || '',
            odometer_km: expense.odometer_km || '',
            payment_status: expense.payment_status || 'unpaid',
            notes: expense.notes || '',
            document_no: expense.document_no || '',
        });
        setEditingId(expense.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDuplicate = (expense) => {
        setFormData({
            vehicle_id: expense.vehicle_id,
            supplier_id: expense.supplier_id || '',
            date: new Date().toISOString().split('T')[0],
            due_date: '',
            reference_no: '',
            expense_type: expense.expense_type,
            item_description: expense.item_description || '',
            quantity: expense.quantity || '',
            unit: expense.unit || '',
            debit: expense.debit || '',
            credit: '',
            odometer_km: '',
            payment_status: 'unpaid',
            notes: expense.notes || '',
        });
        setEditingId(null);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (expense) => {
        setDeleteModal({ open: true, id: expense.id, name: `${expense.plate_no} — ${expense.date}` });
    };

    const doDelete = async () => {
        try {
            await api.delete(`/expenses/${deleteModal.id}`);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({
            vehicle_id: '',
            supplier_id: '',
            date: new Date().toISOString().split('T')[0],
            due_date: '',
            reference_no: '',
            expense_type: 'fuel',
            item_description: '',
            quantity: '',
            unit: '',
            debit: '',
            credit: '',
            odometer_km: '',
            payment_status: 'unpaid',
            notes: '',
        });
        setEditingId(null);
        setShowForm(false);
    };

    const formatCurrency = (amount) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('en-TZ').format(amount);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr + 'T00:00:00');
        return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
    };

    const filteredExpenses = expenses.filter((e) => {
        const q = searchQuery.toLowerCase();
        if (q && !([e.plate_no, e.supplier_name, e.reference_no, e.item_description, e.document_no, e.notes].join(' ').toLowerCase().includes(q))) return false;
        if (filterType && e.expense_type !== filterType) return false;
        if (filterPayment && e.payment_status !== filterPayment) return false;
        if (filterDateFrom && e.date < filterDateFrom) return false;
        if (filterDateTo && e.date > filterDateTo) return false;
        return true;
    });

    const typeColors = {
        fuel: 'badge-info',
        maintenance: 'badge-warning',
        insurance: 'badge-success',
        parts: 'badge-danger',
        other: 'bg-gray-100 text-gray-700',
    };

    const paymentColor = (status) => PAYMENT_STATUS.find(p => p.value === status)?.color || 'bg-gray-100 text-gray-700';
    const paymentLabel = (status) => PAYMENT_STATUS.find(p => p.value === status)?.label || status;

    const isAdmin = user?.role === 'admin';

    const hasFilters = searchQuery || filterType || filterPayment || filterDateFrom || filterDateTo;

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

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
                    <p className="text-gray-500 mt-1">Track all fleet expenses</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                    {showForm ? (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Cancel</>
                    ) : (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Expense</>
                    )}
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="relative lg:col-span-2">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
                        <input type="text" placeholder="Search vehicle, supplier, ref, description..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input pl-9" />
                    </div>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input select">
                        <option value="">All Types</option>
                        <option value="fuel">Fuel</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="insurance">Insurance</option>
                        <option value="parts">Parts</option>
                        <option value="other">Other</option>
                    </select>
                    <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} className="input select">
                        <option value="">All Payment Status</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                    </select>
                    <div className="flex gap-2">
                        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="input flex-1" title="From date" />
                        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="input flex-1" title="To date" />
                    </div>
                </div>
                {hasFilters && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">{filteredExpenses.length} result{filteredExpenses.length !== 1 ? 's' : ''}</p>
                        <button onClick={() => { setSearchQuery(''); setFilterType(''); setFilterPayment(''); setFilterDateFrom(''); setFilterDateTo(''); }} className="text-sm text-blue-600 hover:underline">Clear filters</button>
                    </div>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="card p-6 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-900 mb-4">{editingId ? 'Edit Expense' : 'Add New Expense'}</h3>
                    <form onSubmit={handleSubmit}>
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle *</label>
                                <select value={formData.vehicle_id} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })} className="input select" required>
                                    <option value="">Select Vehicle</option>
                                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_no}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier</label>
                                <select value={formData.supplier_id} onChange={e => setFormData({ ...formData, supplier_id: e.target.value })} className="input select">
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="input" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                                <input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} className="input" />
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {editingId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Document No</label>
                                    <input type="text" value={formData.document_no || ''} readOnly className="input bg-gray-50 text-gray-400 cursor-not-allowed" />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Reference No
                                    <span className="ml-2 text-xs font-normal text-blue-500">auto-generated</span>
                                </label>
                                <input type="text" value={formData.reference_no} onChange={e => setFormData({ ...formData, reference_no: e.target.value })} placeholder="Leave blank to auto-generate" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
                                <select value={formData.expense_type} onChange={e => setFormData({ ...formData, expense_type: e.target.value })} className="input select" required>
                                    <option value="fuel">Fuel</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="insurance">Insurance</option>
                                    <option value="parts">Parts</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Status</label>
                                <select value={formData.payment_status} onChange={e => setFormData({ ...formData, payment_status: e.target.value })} className="input select">
                                    <option value="unpaid">Unpaid</option>
                                    <option value="partial">Partial</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                        </div>

                        {/* Item Description */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Item Description *</label>
                            <input type="text" value={formData.item_description} onChange={e => setFormData({ ...formData, item_description: e.target.value })} placeholder="e.g. Diesel fuel for truck — Mombasa route" className="input" required />
                        </div>

                        {/* Row 3: amounts + odometer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
                                <input type="number" step="0.01" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} placeholder="50" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
                                <input type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="Liters" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Debit (TZS)</label>
                                <input type="number" step="0.01" value={formData.debit} onChange={e => setFormData({ ...formData, debit: e.target.value })} placeholder="150,000" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Credit (TZS)</label>
                                <input type="number" step="0.01" value={formData.credit} onChange={e => setFormData({ ...formData, credit: e.target.value })} placeholder="0" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Odometer (KM)</label>
                                <input type="number" step="1" value={formData.odometer_km} onChange={e => setFormData({ ...formData, odometer_km: e.target.value })} placeholder="45,200" className="input" />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                            <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." className="input" />
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button type="submit" className="btn btn-success">{editingId ? 'Update Expense' : 'Create Expense'}</button>
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
                ) : filteredExpenses.length === 0 ? (
                    <div className="text-center py-12 px-6">
                        {expenses.length === 0 && vehicles.length === 0 ? (
                            <>
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-gray-700 font-medium mb-1">Set up your trucks first</p>
                                <p className="text-gray-500 text-sm mb-4">Each transaction is linked to a truck. Add your vehicles before logging expenses.</p>
                                <Link to="/vehicles" className="btn btn-primary inline-flex">Go to Vehicles →</Link>
                            </>
                        ) : expenses.length === 0 && suppliers.length === 0 ? (
                            <>
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-gray-700 font-medium mb-1">Add at least one supplier</p>
                                <p className="text-gray-500 text-sm mb-4">You need a supplier before logging a transaction.</p>
                                <Link to="/suppliers" className="btn btn-primary inline-flex">Go to Suppliers →</Link>
                            </>
                        ) : expenses.length === 0 ? (
                            <>
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-gray-500 mb-2">No transactions yet</p>
                                <button onClick={() => setShowForm(true)} className="text-blue-600 font-medium hover:underline">Record your first transaction</button>
                            </>
                        ) : (
                            <>
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>
                                <p className="text-gray-500">No transactions match your filters</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Doc No</th>
                                    <th>Ref No</th>
                                    <th>Vehicle</th>
                                    <th>Supplier</th>
                                    <th>Description</th>
                                    <th>Type</th>
                                    <th className="text-right">KM</th>
                                    <th className="text-right">Debit</th>
                                    <th className="text-right">Credit</th>
                                    <th>Payment</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td className="text-gray-600 whitespace-nowrap">{formatDate(expense.date)}</td>
                                        <td className="text-gray-500 text-xs font-mono">{expense.document_no || '-'}</td>
                                        <td className="text-gray-600">{expense.reference_no || '-'}</td>
                                        <td className="font-medium text-gray-900">{expense.plate_no}</td>
                                        <td className="text-gray-600">{expense.supplier_name || '-'}</td>
                                        <td className="text-gray-700 max-w-48 truncate" title={expense.item_description}>{expense.item_description || '-'}</td>
                                        <td><span className={`badge ${typeColors[expense.expense_type]}`}>{expense.expense_type}</span></td>
                                        <td className="text-right text-gray-500 text-sm">{expense.odometer_km ? new Intl.NumberFormat('en-TZ').format(expense.odometer_km) : '-'}</td>
                                        <td className="text-right font-medium text-red-600">{expense.debit ? formatCurrency(expense.debit) : '-'}</td>
                                        <td className="text-right font-medium text-green-600">{expense.credit ? formatCurrency(expense.credit) : '-'}</td>
                                        <td>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentColor(expense.payment_status)}`}>
                                                {paymentLabel(expense.payment_status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEdit(expense)} className="link text-sm">Edit</button>
                                                <button onClick={() => handleDuplicate(expense)} className="link text-sm text-gray-500" title="Duplicate this entry">Copy</button>
                                                {isAdmin && (
                                                    <button onClick={() => handleDelete(expense)} className="link link-danger text-sm">Del</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Expenses;
