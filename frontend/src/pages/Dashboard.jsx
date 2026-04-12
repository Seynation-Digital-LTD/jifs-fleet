import { useState, useEffect } from 'react';
import api from '../api/client';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await api.get('/reports/dashboard');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Active Vehicles',
            value: stats?.activeVehicles || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0V9a4 4 0 014-4h0a4 4 0 014 4v4" />
                </svg>
            ),
            gradient: 'from-blue-500 to-blue-600',
            shadow: 'shadow-blue-500/30'
        },
        {
            label: 'Suppliers',
            value: stats?.totalSuppliers || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            gradient: 'from-emerald-500 to-emerald-600',
            shadow: 'shadow-emerald-500/30'
        },
        {
            label: 'Total Expenses',
            value: formatCurrency(stats?.totalDebit),
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            gradient: 'from-red-500 to-red-600',
            shadow: 'shadow-red-500/30'
        },
        {
            label: 'This Month',
            value: formatCurrency(stats?.monthExpenses),
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            gradient: 'from-amber-500 to-orange-500',
            shadow: 'shadow-amber-500/30'
        }
    ];

    const alertCards = [
        {
            label: 'Upcoming Services',
            value: stats?.upcomingServices?.length || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            gradient: 'from-violet-500 to-purple-600',
            shadow: 'shadow-violet-500/30'
        },
        {
            label: 'Expiring Parts',
            value: stats?.expiringParts?.length || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            gradient: 'from-yellow-500 to-amber-500',
            shadow: 'shadow-yellow-500/30'
        }
    ];

    return (
        <div className="animate-fade-in">
            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back! Here's an overview of your fleet.</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                {statCards.map((stat, index) => (
                    <div
                        key={stat.label}
                        className={`stat-card bg-gradient-to-br ${stat.gradient} rounded-xl p-5 text-white shadow-lg ${stat.shadow} animate-fade-in stagger-${index + 1}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                {stat.icon}
                            </div>
                        </div>
                        <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Alert stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                {alertCards.map((stat, index) => (
                    <div
                        key={stat.label}
                        className={`stat-card bg-gradient-to-br ${stat.gradient} rounded-xl p-5 text-white shadow-lg ${stat.shadow} animate-fade-in stagger-${index + 5}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                                <p className="text-3xl font-bold mt-1">{stat.value}</p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Alert panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Services */}
                <div className="card p-6 animate-fade-in stagger-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Upcoming Services</h3>
                            <p className="text-sm text-gray-500">Vehicles due for service in next 30 days</p>
                        </div>
                    </div>
                    
                    {stats?.upcomingServices?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.upcomingServices.slice(0, 5).map((service, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0V9a4 4 0 014-4h0a4 4 0 014 4v4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{service.plate_no}</p>
                                            <p className="text-xs text-gray-500">{service.description || 'Service due'}</p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-violet-100 text-violet-700">
                                        {formatDate(service.next_service_date)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>No upcoming services</p>
                        </div>
                    )}
                </div>

                {/* Expiring Parts */}
                <div className="card p-6 animate-fade-in stagger-6" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderColor: '#fcd34d' }}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-lg bg-amber-200 flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-900">Expiring Parts</h3>
                            <p className="text-sm text-amber-700">Parts expiring in next 30 days</p>
                        </div>
                    </div>
                    
                    {stats?.expiringParts?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.expiringParts.slice(0, 5).map((part, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-amber-200 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-amber-900">{part.part_name}</p>
                                            <p className="text-xs text-amber-700">{part.plate_no}</p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                                        {formatDate(part.expiry_date)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-amber-700">
                            <svg className="w-12 h-12 mx-auto mb-3 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>No expiring parts</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
