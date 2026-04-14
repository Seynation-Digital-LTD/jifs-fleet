import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

    const formatCurrency = (amount) => new Intl.NumberFormat('en-TZ', {
        style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount || 0);

    const fmt = (n) => new Intl.NumberFormat('en-TZ').format(n || 0);

    const fmtDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr + 'T00:00:00');
        return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`;
    };

    const daysUntil = (dateStr) => {
        const t = new Date(); t.setHours(0, 0, 0, 0);
        return Math.ceil((new Date(dateStr + 'T00:00:00') - t) / 86400000);
    };

    const DOC_TYPE_LABELS = {
        tra_sticker: 'TRA Sticker', road_licence: 'Road Licence', psv_licence: 'PSV Licence',
        insurance: 'Insurance', goods_licence: 'Goods Licence', other: 'Document'
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const hasVehicles = (stats?.activeVehicles || 0) > 0;
    const hasSuppliers = (stats?.totalSuppliers || 0) > 0;
    const setupComplete = hasVehicles && hasSuppliers;

    const overdueDocCount = (stats?.overdueDocuments || []).length;
    const expiringDocCount = (stats?.expiringDocuments || []).length;
    const budgetWarnings = stats?.budgetWarnings || [];

    const statCards = [
        {
            label: 'Active Vehicles', value: stats?.activeVehicles || 0,
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0V9a4 4 0 014-4h0a4 4 0 014 4v4" /></svg>,
            gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/30'
        },
        {
            label: 'Suppliers', value: stats?.totalSuppliers || 0,
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
            gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/30'
        },
        {
            label: 'Total Expenses', value: formatCurrency(stats?.totalDebit),
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            gradient: 'from-red-500 to-red-600', shadow: 'shadow-red-500/30'
        },
        {
            label: 'This Month', value: formatCurrency(stats?.monthExpenses),
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
            gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/30'
        },
    ];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back! Here's an overview of your fleet.</p>
                </div>
                {setupComplete && (
                    <Link to="/expenses" className="btn btn-primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        New Transaction
                    </Link>
                )}
            </div>

            {/* Quick Start */}
            {!setupComplete && (
                <div className="card p-6 mb-8 border-2 border-dashed border-blue-200 bg-blue-50/50">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-blue-900 mb-1">Get started in 3 steps</h3>
                            <p className="text-sm text-blue-700 mb-4">Complete these steps once and you'll be ready to log transactions and generate statements.</p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link to="/vehicles" className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${hasVehicles ? 'border-green-400 bg-green-50 text-green-700' : 'border-blue-300 bg-white text-blue-700 hover:border-blue-500'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${hasVehicles ? 'bg-green-400 text-white' : 'bg-blue-600 text-white'}`}>{hasVehicles ? '✓' : '1'}</div>
                                    <div><p className="font-medium text-sm">Add your trucks</p><p className="text-xs opacity-70">Register each vehicle by plate number</p></div>
                                </Link>
                                <Link to="/suppliers" className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${hasSuppliers ? 'border-green-400 bg-green-50 text-green-700' : 'border-blue-300 bg-white text-blue-700 hover:border-blue-500'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${hasSuppliers ? 'bg-green-400 text-white' : 'bg-blue-600 text-white'}`}>{hasSuppliers ? '✓' : '2'}</div>
                                    <div><p className="font-medium text-sm">Add your suppliers</p><p className="text-xs opacity-70">E.g. Said Salim Bakhresa & Co.</p></div>
                                </Link>
                                <Link to="/expenses" className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${!setupComplete ? 'border-gray-200 bg-gray-50 text-gray-400 pointer-events-none' : 'border-blue-300 bg-white text-blue-700 hover:border-blue-500'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${!setupComplete ? 'bg-gray-300 text-white' : 'bg-blue-600 text-white'}`}>3</div>
                                    <div><p className="font-medium text-sm">Log transactions</p><p className="text-xs opacity-70">Record debits, credits, truck deliveries</p></div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick actions */}
            {setupComplete && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <Link to="/expenses" className="flex items-center gap-3 p-4 card hover:shadow-md transition-shadow group">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                            <svg className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <div><p className="font-semibold text-gray-900 text-sm">Log a Transaction</p><p className="text-xs text-gray-500">Record a debit or credit entry</p></div>
                    </Link>
                    <Link to="/statement" className="flex items-center gap-3 p-4 card hover:shadow-md transition-shadow group">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                            <svg className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        </div>
                        <div><p className="font-semibold text-gray-900 text-sm">Print Statement</p><p className="text-xs text-gray-500">Generate & print supplier ledger</p></div>
                    </Link>
                    <Link to="/reports" className="flex items-center gap-3 p-4 card hover:shadow-md transition-shadow group">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center group-hover:bg-violet-600 transition-colors">
                            <svg className="w-5 h-5 text-violet-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <div><p className="font-semibold text-gray-900 text-sm">View Reports</p><p className="text-xs text-gray-500">Fuel, supplier balances, monthly</p></div>
                    </Link>
                </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                {statCards.map((stat, index) => (
                    <div key={stat.label} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-5 text-white shadow-lg ${stat.shadow} animate-fade-in stagger-${index + 1}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">{stat.icon}</div>
                        </div>
                        <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Budget warnings */}
            {budgetWarnings.length > 0 && (
                <div className="card p-5 mb-6 border border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-amber-200 flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-900">Budget Warnings</h3>
                            <p className="text-sm text-amber-700">{budgetWarnings.length} truck{budgetWarnings.length > 1 ? 's' : ''} at or above 80% of monthly budget</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {budgetWarnings.map((w, i) => {
                            const pct = Math.round((w.month_spent / w.monthly_budget) * 100);
                            return (
                                <div key={i} className="flex items-center gap-4 bg-white rounded-lg px-4 py-3">
                                    <div className="font-semibold text-gray-900 w-24 shrink-0">{w.plate_no}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">TZS {fmt(w.month_spent)} spent</span>
                                            <span className={`font-bold ${pct >= 100 ? 'text-red-600' : 'text-amber-600'}`}>{pct}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className={`h-2 rounded-full ${pct >= 100 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 shrink-0">of TZS {fmt(w.monthly_budget)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Alert panels row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Upcoming Services */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Upcoming Services</h3>
                            <p className="text-sm text-gray-500">Due in next 30 days</p>
                        </div>
                    </div>
                    {stats?.upcomingServices?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.upcomingServices.slice(0, 5).map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17h8M8 17v-4m8 4v-4m-8 0h8" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{s.plate_no}</p>
                                            <p className="text-xs text-gray-500">{s.description || 'Service due'}</p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-violet-100 text-violet-700">{fmtDate(s.next_service_date)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p>No upcoming services</p>
                        </div>
                    )}
                </div>

                {/* Expiring Parts */}
                <div className="card p-6" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderColor: '#fcd34d' }}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-lg bg-amber-200 flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-900">Expiring Parts</h3>
                            <p className="text-sm text-amber-700">Parts expiring in next 30 days</p>
                        </div>
                    </div>
                    {stats?.expiringParts?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.expiringParts.slice(0, 5).map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/60">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-amber-200 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-amber-900">{p.part_name}</p>
                                            <p className="text-xs text-amber-700">{p.plate_no}</p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">{fmtDate(p.expiry_date)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-amber-600">
                            <svg className="w-12 h-12 mx-auto mb-3 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p>No expiring parts</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Document alerts row */}
            {(overdueDocCount > 0 || expiringDocCount > 0) && (
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Vehicle Documents</h3>
                            <p className="text-sm text-gray-500">
                                {overdueDocCount > 0 && `${overdueDocCount} expired`}
                                {overdueDocCount > 0 && expiringDocCount > 0 && ' · '}
                                {expiringDocCount > 0 && `${expiringDocCount} expiring within 60 days`}
                            </p>
                        </div>
                        <Link to="/documents" className="ml-auto text-sm text-blue-600 hover:underline font-medium">Manage →</Link>
                    </div>
                    <div className="space-y-2">
                        {[...(stats?.overdueDocuments || []).map(d => ({ ...d, overdue: true })), ...(stats?.expiringDocuments || [])].slice(0, 6).map((d, i) => {
                            const days = daysUntil(d.expiry_date);
                            return (
                                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${d.overdue ? 'bg-red-50' : 'bg-amber-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${d.overdue ? 'bg-red-500' : 'bg-amber-400'}`}></span>
                                        <span className="font-semibold text-gray-900 text-sm">{d.plate_no}</span>
                                        <span className="text-gray-600 text-sm">{DOC_TYPE_LABELS[d.doc_type] || d.doc_type}{d.doc_name ? ` — ${d.doc_name}` : ''}</span>
                                    </div>
                                    <span className={`text-xs font-bold ${d.overdue ? 'text-red-600' : 'text-amber-600'}`}>
                                        {d.overdue ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
