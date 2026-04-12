import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const Suppliers = () => {
    const { user } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        type: 'fuel'
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/suppliers');
            setSuppliers(response.data);
        } catch (error) {
            alert('Failed to fetch suppliers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/suppliers/${editingId}`, formData);
            } else {
                await api.post('/suppliers', formData);
            }
            fetchSuppliers();
            resetForm();
        } catch (error) {
            alert(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleEdit = (supplier) => {
        setFormData({
            name: supplier.name,
            contact: supplier.contact || '',
            type: supplier.type
        });
        setEditingId(supplier.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this supplier?')) return;
        try {
            await api.delete(`/suppliers/${id}`);
            fetchSuppliers();
        } catch (error) {
            alert(error.response?.data?.error || 'Delete failed');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', contact: '', type: 'fuel' });
        setEditingId(null);
        setShowForm(false);
    };

    const isAdmin = user?.role === 'admin';

    const typeColors = {
        fuel: 'badge-info',
        maintenance: 'badge-warning',
        insurance: 'badge-success',
        other: 'badge-danger'
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
                    <p className="text-gray-500 mt-1">Manage your service providers</p>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Supplier name"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="input select"
                                    required
                                >
                                    <option value="fuel">Fuel</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="insurance">Insurance</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
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
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : suppliers.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-gray-500 mb-2">No suppliers found</p>
                        {isAdmin && (
                            <button onClick={() => setShowForm(true)} className="text-blue-600 font-medium hover:underline">
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
                                <th>Type</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((supplier) => (
                                <tr key={supplier.id}>
                                    <td className="font-medium text-gray-900">{supplier.name}</td>
                                    <td className="text-gray-600">{supplier.contact || '-'}</td>
                                    <td>
                                        <span className={`badge ${typeColors[supplier.type]}`}>
                                            {supplier.type}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleEdit(supplier)} className="link text-sm">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(supplier.id)} className="link link-danger text-sm">
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
