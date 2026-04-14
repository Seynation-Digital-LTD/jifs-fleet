import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

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

    useEffect(() => {
        fetchVehicles();
    }, []);

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
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this vehicle?')) return;
        try {
            await api.delete(`/vehicles/${id}`);
            fetchVehicles();
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({ plate_no: '', vehicle_type: '', make_model: '', year: '', status: 'active', monthly_budget: '' });
        setEditingId(null);
        setShowForm(false);
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
                    <p className="text-gray-500 mt-1">Manage your fleet vehicles</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
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

            {/* Form */}
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
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVehicles.map((vehicle) => (
                                <tr key={vehicle.id}>
                                    <td className="font-semibold text-gray-900">{vehicle.plate_no}</td>
                                    <td className="text-gray-600">{vehicle.vehicle_type || '-'}</td>
                                    <td className="text-gray-600">{vehicle.make_model || '-'}</td>
                                    <td className="text-gray-600">{vehicle.year || '-'}</td>
                                    <td>
                                        <span className={`badge ${vehicle.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{vehicle.status}</span>
                                    </td>
                                    <td className="text-right text-gray-600">
                                        {vehicle.monthly_budget > 0 ? `TZS ${fmt(vehicle.monthly_budget)}` : <span className="text-gray-400">Not set</span>}
                                    </td>
                                    {isAdmin && (
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleEdit(vehicle)} className="link text-sm">Edit</button>
                                                <button onClick={() => handleDelete(vehicle.id)} className="link link-danger text-sm">Delete</button>
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

export default Vehicles;
