import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const Expenses = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        vehicle_id: '',
        supplier_id: '',
        date: new Date().toISOString().split('T')[0],
        reference_no: '',
        expense_type: 'fuel',
        quantity: '',
        unit: '',
        debit: '',
        credit: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [expensesRes, vehiclesRes, suppliersRes] = await Promise.all([
                api.get('/expenses'),
                api.get('/vehicles'),
                api.get('/suppliers')
            ]);
            setExpenses(expensesRes.data);
            setVehicles(vehiclesRes.data.filter(v => v.status === 'active'));
            setSuppliers(suppliersRes.data);
        } catch (error) {
            alert('Failed to fetch data');
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
                credit: formData.credit ? parseFloat(formData.credit) : 0
            };
            if (editingId) {
                await api.put(`/expenses/${editingId}`, payload);
            } else {
                await api.post('/expenses', payload);
            }
            fetchData();
            resetForm();
        } catch (error) {
            alert(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleEdit = (expense) => {
        setFormData({
            vehicle_id: expense.vehicle_id,
            supplier_id: expense.supplier_id || '',
            date: expense.date,
            reference_no: expense.reference_no || '',
            expense_type: expense.expense_type,
            quantity: expense.quantity || '',
            unit: expense.unit || '',
            debit: expense.debit || '',
            credit: expense.credit || '',
            notes: expense.notes || ''
        });
        setEditingId(expense.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await api.delete(`/expenses/${id}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || 'Delete failed');
        }
    };

    const resetForm = () => {
        setFormData({
            vehicle_id: '',
            supplier_id: '',
            date: new Date().toISOString().split('T')[0],
            reference_no: '',
            expense_type: 'fuel',
            quantity: '',
            unit: '',
            debit: '',
            credit: '',
            notes: ''
        });
        setEditingId(null);
        setShowForm(false);
    };

    const formatCurrency = (amount) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('en-TZ').format(amount);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const typeColors = {
        fuel: 'badge-info',
        maintenance: 'badge-warning',
        insurance: 'badge-success',
        parts: 'badge-danger',
        other: 'bg-gray-100 text-gray-700'
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
                    <p className="text-gray-500 mt-1">Track all fleet expenses</p>
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
                            Add Expense
                        </>
                    )}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="card p-6 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-900 mb-4">
                        {editingId ? 'Edit Expense' : 'Add New Expense'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier</label>
                                <select
                                    value={formData.supplier_id}
                                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                    className="input select"
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference No</label>
                                <input
                                    type="text"
                                    value={formData.reference_no}
                                    onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                                    placeholder="INV-001"
                                    className="input"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
                                <select
                                    value={formData.expense_type}
                                    onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                                    className="input select"
                                    required
                                >
                                    <option value="fuel">Fuel</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="insurance">Insurance</option>
                                    <option value="parts">Parts</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    placeholder="50"
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
                                <input
                                    type="text"
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    placeholder="Liters"
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Debit (TZS)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.debit}
                                    onChange={(e) => setFormData({ ...formData, debit: e.target.value })}
                                    placeholder="150,000"
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Credit (TZS)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.credit}
                                    onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                                    placeholder="0"
                                    className="input"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                            <input
                                type="text"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes..."
                                className="input"
                            />
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button type="submit" className="btn btn-success">
                                {editingId ? 'Update Expense' : 'Create Expense'}
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
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-500 mb-2">No expenses found</p>
                        <button onClick={() => setShowForm(true)} className="text-blue-600 font-medium hover:underline">
                            Record your first expense
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Ref No</th>
                                    <th>Vehicle</th>
                                    <th>Supplier</th>
                                    <th>Type</th>
                                    <th className="text-right">Debit</th>
                                    <th className="text-right">Credit</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td className="text-gray-600">{formatDate(expense.date)}</td>
                                        <td className="text-gray-600">{expense.reference_no || '-'}</td>
                                        <td className="font-medium text-gray-900">{expense.plate_no}</td>
                                        <td className="text-gray-600">{expense.supplier_name || '-'}</td>
                                        <td>
                                            <span className={`badge ${typeColors[expense.expense_type]}`}>
                                                {expense.expense_type}
                                            </span>
                                        </td>
                                        <td className="text-right font-medium text-red-600">
                                            {expense.debit ? formatCurrency(expense.debit) : '-'}
                                        </td>
                                        <td className="text-right font-medium text-green-600">
                                            {expense.credit ? formatCurrency(expense.credit) : '-'}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleEdit(expense)} className="link text-sm">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(expense.id)} className="link link-danger text-sm">
                                                    Delete
                                                </button>
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
