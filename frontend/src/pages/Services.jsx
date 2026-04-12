import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const Services = () => {
    const { user } = useAuth();
    const [services, setServices] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        vehicle_id: '',
        service_date: new Date().toISOString().split('T')[0],
        description: '',
        next_service_date: '',
        next_service_km: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [servicesRes, vehiclesRes] = await Promise.all([
                api.get('/services'),
                api.get('/vehicles')
            ]);
            setServices(servicesRes.data.services);
            setVehicles(vehiclesRes.data.vehicles.filter(v => v.status === 'active'));
        } catch {
            setError('Failed to load services. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                next_service_km: formData.next_service_km ? parseInt(formData.next_service_km) : null
            };
            if (editingId) {
                await api.put(`/services/${editingId}`, payload);
            } else {
                await api.post('/services', payload);
            }
            fetchData();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed. Please try again.');
        }
    };

    const handleEdit = (service) => {
        setFormData({
            vehicle_id: service.vehicle_id,
            service_date: service.service_date,
            description: service.description || '',
            next_service_date: service.next_service_date || '',
            next_service_km: service.next_service_km || ''
        });
        setEditingId(service.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this service record?')) return;
        try {
            await api.delete(`/services/${id}`);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({
            vehicle_id: '',
            service_date: new Date().toISOString().split('T')[0],
            description: '',
            next_service_date: '',
            next_service_km: ''
        });
        setEditingId(null);
        setShowForm(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const isUpcoming = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const today = new Date();
        const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays >= 0;
    };

    return (
        <div className="animate-fade-in">
            {/* Error banner */}
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

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Services</h1>
                    <p className="text-gray-500 mt-1">Track vehicle maintenance and services</p>
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
                            Add Service
                        </>
                    )}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="card p-6 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-900 mb-4">
                        {editingId ? 'Edit Service' : 'Add New Service'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Date *</label>
                                <input
                                    type="date"
                                    value={formData.service_date}
                                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Oil change, tire rotation..."
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Next Service Date</label>
                                <input
                                    type="date"
                                    value={formData.next_service_date}
                                    onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Next Service KM</label>
                                <input
                                    type="number"
                                    value={formData.next_service_km}
                                    onChange={(e) => setFormData({ ...formData, next_service_km: e.target.value })}
                                    placeholder="50000"
                                    className="input"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button type="submit" className="btn btn-success">
                                {editingId ? 'Update Service' : 'Create Service'}
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
                ) : services.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-gray-500 mb-2">No services recorded</p>
                        <button onClick={() => setShowForm(true)} className="text-blue-600 font-medium hover:underline">
                            Record your first service
                        </button>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Service Date</th>
                                <th>Vehicle</th>
                                <th>Description</th>
                                <th>Next Service</th>
                                <th>Next KM</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((service) => (
                                <tr key={service.id}>
                                    <td className="text-gray-600">{formatDate(service.service_date)}</td>
                                    <td className="font-medium text-gray-900">{service.plate_no}</td>
                                    <td className="text-gray-600">{service.description || '-'}</td>
                                    <td>
                                        {service.next_service_date ? (
                                            <span className={isUpcoming(service.next_service_date) ? 'text-amber-600 font-medium' : 'text-gray-600'}>
                                                {formatDate(service.next_service_date)}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="text-gray-600">
                                        {service.next_service_km ? `${service.next_service_km.toLocaleString()} km` : '-'}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleEdit(service)} className="link text-sm">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(service.id)} className="link link-danger text-sm">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Services;
