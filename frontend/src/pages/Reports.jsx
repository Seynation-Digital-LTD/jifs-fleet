import { useState, useEffect } from 'react';
import api from '../api/client';

const TABS = [
    {
        id: 'vehicle',
        label: 'By Vehicle',
        desc: 'Cost per truck',
        hasDate: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0V9a4 4 0 014-4h0a4 4 0 014 4v4M6 17H4a1 1 0 01-1-1v-2a1 1 0 011-1h2m12 4h2a1 1 0 001-1v-2a1 1 0 00-1-1h-2" />
            </svg>
        ),
    },
    {
        id: 'type',
        label: 'By Category',
        desc: 'Cost per expense type',
        hasDate: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
        ),
    },
    {
        id: 'transactions',
        label: 'Transactions',
        desc: 'All entries in a period',
        hasDate: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
    },
    {
        id: 'fuel',
        label: 'Fuel',
        desc: 'Consumption per truck',
        hasDate: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h2l2 9h10l2-9h2M3 10V6a1 1 0 011-1h4a1 1 0 011 1v4M3 10h12" />
            </svg>
        ),
    },
    {
        id: 'supplier-balances',
        label: 'Supplier Balances',
        desc: 'Outstanding amounts',
        hasDate: false,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
    {
        id: 'services',
        label: 'Services',
        desc: 'Maintenance schedule',
        hasDate: false,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        id: 'parts',
        label: 'Parts Expiry',
        desc: 'Parts & documents due',
        hasDate: false,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
    },
    {
        id: 'monthly',
        label: 'Monthly Overview',
        desc: 'Full month breakdown',
        hasDate: false,
        hasMonth: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
];

const Reports = () => {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const currentMonthValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const [activeTab, setActiveTab] = useState('vehicle');
    const [startDate, setStartDate] = useState(firstOfMonth);
    const [endDate, setEndDate] = useState(todayStr);
    const [month, setMonth] = useState(currentMonthValue);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReport(activeTab);
    }, [activeTab]);

    const fetchReport = async (tab) => {
        setLoading(true);
        setError(null);
        setData(null);
        try {
            let res;
            const dateParams = `start=${startDate}&end=${endDate}`;
            switch (tab) {
                case 'vehicle':
                    res = await api.get(`/reports/expenses-by-vehicle?${dateParams}`);
                    setData(res.data);
                    break;
                case 'type':
                    res = await api.get(`/reports/expenses-by-type?${dateParams}`);
                    setData(res.data);
                    break;
                case 'transactions':
                    res = await api.get(`/reports/expenses-by-date?${dateParams}`);
                    setData(res.data);
                    break;
                case 'fuel':
                    res = await api.get(`/reports/fuel?${dateParams}`);
                    setData(res.data);
                    break;
                case 'supplier-balances':
                    res = await api.get('/reports/supplier-balances');
                    setData(res.data);
                    break;
                case 'services':
                    res = await api.get('/reports/services-schedule');
                    setData(res.data);
                    break;
                case 'parts':
                    res = await api.get('/reports/parts-expiry');
                    setData(res.data);
                    break;
                case 'monthly': {
                    const [y, m] = month.split('-');
                    res = await api.get(`/reports/monthly-overview?year=${y}&month=${m}`);
                    setData(res.data);
                    break;
                }
            }
        } catch {
            setError('Failed to load report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => fetchReport(activeTab);

    const handleTabChange = (tabId) => {
        if (tabId === activeTab) return;
        setActiveTab(tabId);
    };

    const fmt = (amount) =>
        new Intl.NumberFormat('en-TZ').format(amount || 0);

    const fmtDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr + 'T00:00:00');
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const daysUntil = (dateStr) => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return Math.ceil((new Date(dateStr + 'T00:00:00') - t) / 86400000);
    };

    const activeTabDef = TABS.find(t => t.id === activeTab);

    // ── Summary totals helpers ─────────────────────────────────────────────
    const expenseTotals = (rows) => ({
        debit: rows.reduce((s, r) => s + (r.total_debit || 0), 0),
        credit: rows.reduce((s, r) => s + (r.total_credit || 0), 0),
    });

    // ── Renderers per tab ──────────────────────────────────────────────────
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            );
        }
        if (!data) return null;

        // ── BY VEHICLE ────────────────────────────────────────────────────
        if (activeTab === 'vehicle') {
            const rows = data.report || [];
            const totals = expenseTotals(rows);
            return (
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Truck (Plate No)</th>
                                <th>Make / Model</th>
                                <th className="text-right">Transactions</th>
                                <th className="text-right">Total Debit</th>
                                <th className="text-right">Total Credit</th>
                                <th className="text-right">Net Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-gray-400 py-8">No data for this period</td></tr>
                            ) : rows.map((r, i) => (
                                <tr key={i}>
                                    <td className="font-semibold text-gray-900">{r.plate_no}</td>
                                    <td className="text-gray-600">{r.make_model || '-'}</td>
                                    <td className="text-right text-gray-600">{r.expense_count}</td>
                                    <td className="text-right text-red-600 font-medium">{fmt(r.total_debit)}</td>
                                    <td className="text-right text-green-600 font-medium">{fmt(r.total_credit)}</td>
                                    <td className="text-right font-semibold text-gray-900">{fmt(r.total_debit - r.total_credit)}</td>
                                </tr>
                            ))}
                        </tbody>
                        {rows.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                                    <td colSpan={3} className="px-4 py-3 text-gray-700">Total</td>
                                    <td className="text-right px-4 py-3 text-red-600">{fmt(totals.debit)}</td>
                                    <td className="text-right px-4 py-3 text-green-600">{fmt(totals.credit)}</td>
                                    <td className="text-right px-4 py-3 text-gray-900">{fmt(totals.debit - totals.credit)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            );
        }

        // ── BY CATEGORY ───────────────────────────────────────────────────
        if (activeTab === 'type') {
            const rows = data.report || [];
            const totals = expenseTotals(rows);
            const TYPE_LABELS = { fuel: 'Fuel', maintenance: 'Maintenance', insurance: 'Insurance', parts: 'Parts', other: 'Other' };
            return (
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th className="text-right">Transactions</th>
                                <th className="text-right">Total Debit</th>
                                <th className="text-right">Total Credit</th>
                                <th className="text-right">Net Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={5} className="text-center text-gray-400 py-8">No data for this period</td></tr>
                            ) : rows.map((r, i) => (
                                <tr key={i}>
                                    <td className="font-semibold text-gray-900">{TYPE_LABELS[r.expense_type] || r.expense_type}</td>
                                    <td className="text-right text-gray-600">{r.expense_count}</td>
                                    <td className="text-right text-red-600 font-medium">{fmt(r.total_debit)}</td>
                                    <td className="text-right text-green-600 font-medium">{fmt(r.total_credit)}</td>
                                    <td className="text-right font-semibold text-gray-900">{fmt(r.total_debit - r.total_credit)}</td>
                                </tr>
                            ))}
                        </tbody>
                        {rows.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                                    <td colSpan={2} className="px-4 py-3 text-gray-700">Total</td>
                                    <td className="text-right px-4 py-3 text-red-600">{fmt(totals.debit)}</td>
                                    <td className="text-right px-4 py-3 text-green-600">{fmt(totals.credit)}</td>
                                    <td className="text-right px-4 py-3 text-gray-900">{fmt(totals.debit - totals.credit)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            );
        }

        // ── TRANSACTIONS ──────────────────────────────────────────────────
        if (activeTab === 'transactions') {
            const rows = data.expenses || [];
            return (
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Truck</th>
                                <th>Supplier</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Reference</th>
                                <th className="text-right">Debit</th>
                                <th className="text-right">Credit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={8} className="text-center text-gray-400 py-8">No transactions in this period</td></tr>
                            ) : rows.map((r) => (
                                <tr key={r.id}>
                                    <td className="text-gray-600 whitespace-nowrap">{fmtDate(r.date)}</td>
                                    <td className="font-semibold text-gray-900">{r.plate_no}</td>
                                    <td className="text-gray-600">{r.supplier_name || '-'}</td>
                                    <td className="text-gray-600 capitalize">{r.expense_type}</td>
                                    <td className="text-gray-700">{r.item_description || '-'}</td>
                                    <td className="text-gray-500 text-xs font-mono">{r.reference_no || '-'}</td>
                                    <td className="text-right text-red-600 font-medium whitespace-nowrap">{r.debit ? fmt(r.debit) : '-'}</td>
                                    <td className="text-right text-green-600 font-medium whitespace-nowrap">{r.credit ? fmt(r.credit) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                        {rows.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                                    <td colSpan={6} className="px-4 py-3 text-gray-700">Total ({rows.length} transactions)</td>
                                    <td className="text-right px-4 py-3 text-red-600">{fmt(data.totalDebit)}</td>
                                    <td className="text-right px-4 py-3 text-green-600">{fmt(data.totalCredit)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            );
        }

        // ── FUEL ──────────────────────────────────────────────────────────
        if (activeTab === 'fuel') {
            const rows = data.report || [];
            const totals = data.totals || {};
            return (
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Truck (Plate No)</th>
                                <th>Make / Model</th>
                                <th className="text-right">Fill-ups</th>
                                <th className="text-right">Total Liters</th>
                                <th className="text-right">Total Cost (TZS)</th>
                                <th className="text-right">Cost per Liter</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-gray-400 py-8">No fuel transactions in this period</td></tr>
                            ) : rows.map((r, i) => (
                                <tr key={i}>
                                    <td className="font-semibold text-gray-900">{r.plate_no}</td>
                                    <td className="text-gray-600">{r.make_model || '-'}</td>
                                    <td className="text-right text-gray-600">{r.fill_ups}</td>
                                    <td className="text-right font-medium text-gray-900">{fmt(r.total_liters)} L</td>
                                    <td className="text-right text-red-600 font-medium">{fmt(r.total_cost)}</td>
                                    <td className="text-right text-gray-600">
                                        {r.total_liters > 0 ? fmt(Math.round(r.total_cost / r.total_liters)) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {rows.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                                    <td colSpan={2} className="px-4 py-3 text-gray-700">Total</td>
                                    <td className="text-right px-4 py-3 text-gray-700">{totals.fill_ups}</td>
                                    <td className="text-right px-4 py-3 text-gray-900">{fmt(totals.total_liters)} L</td>
                                    <td className="text-right px-4 py-3 text-red-600">{fmt(totals.total_cost)}</td>
                                    <td className="text-right px-4 py-3 text-gray-600">
                                        {totals.total_liters > 0 ? fmt(Math.round(totals.total_cost / totals.total_liters)) : '-'}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            );
        }

        // ── SUPPLIER BALANCES ─────────────────────────────────────────────
        if (activeTab === 'supplier-balances') {
            const rows = data.report || [];
            const grandTotal = rows.reduce((s, r) => s + (r.balance || 0), 0);
            return (
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Supplier</th>
                                <th>Type</th>
                                <th className="text-right">Transactions</th>
                                <th className="text-right">Total Debit</th>
                                <th className="text-right">Total Credit (Paid)</th>
                                <th className="text-right">Outstanding Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-gray-400 py-8">No suppliers found</td></tr>
                            ) : rows.map((r) => (
                                <tr key={r.id}>
                                    <td className="font-semibold text-gray-900">{r.name}</td>
                                    <td className="text-gray-600 capitalize">{r.type}</td>
                                    <td className="text-right text-gray-600">{r.transaction_count}</td>
                                    <td className="text-right text-red-600 font-medium">{fmt(r.total_debit)}</td>
                                    <td className="text-right text-green-600 font-medium">{fmt(r.total_credit)}</td>
                                    <td className={`text-right font-bold ${r.balance > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                        {fmt(r.balance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {rows.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                                    <td colSpan={5} className="px-4 py-3 text-gray-700">Total Outstanding</td>
                                    <td className={`text-right px-4 py-3 font-bold ${grandTotal > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                                        {fmt(grandTotal)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            );
        }

        // ── SERVICES SCHEDULE ─────────────────────────────────────────────
        if (activeTab === 'services') {
            const overdue = data.overdue || [];
            const upcoming = data.upcoming || [];
            return (
                <div className="divide-y divide-gray-100">
                    {/* Overdue */}
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                            <h3 className="font-semibold text-gray-900">Overdue Services ({overdue.length})</h3>
                        </div>
                        {overdue.length === 0 ? (
                            <p className="text-gray-400 text-sm">No overdue services.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th>Truck</th>
                                            <th>Service Description</th>
                                            <th>Was Due</th>
                                            <th className="text-right">Days Overdue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {overdue.map((r) => (
                                            <tr key={r.id}>
                                                <td className="font-semibold text-gray-900">{r.plate_no}</td>
                                                <td className="text-gray-700">{r.description || '-'}</td>
                                                <td className="text-gray-600">{fmtDate(r.next_service_date)}</td>
                                                <td className="text-right font-bold text-red-600">
                                                    {Math.abs(daysUntil(r.next_service_date))} days ago
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Upcoming */}
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                            <h3 className="font-semibold text-gray-900">Upcoming — Next 60 Days ({upcoming.length})</h3>
                        </div>
                        {upcoming.length === 0 ? (
                            <p className="text-gray-400 text-sm">No services due in the next 60 days.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th>Truck</th>
                                            <th>Service Description</th>
                                            <th>Due Date</th>
                                            <th className="text-right">Days Remaining</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {upcoming.map((r) => {
                                            const days = daysUntil(r.next_service_date);
                                            return (
                                                <tr key={r.id}>
                                                    <td className="font-semibold text-gray-900">{r.plate_no}</td>
                                                    <td className="text-gray-700">{r.description || '-'}</td>
                                                    <td className="text-gray-600">{fmtDate(r.next_service_date)}</td>
                                                    <td className={`text-right font-bold ${days <= 7 ? 'text-red-600' : days <= 14 ? 'text-amber-600' : 'text-green-600'}`}>
                                                        {days} days
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
        }

        // ── PARTS EXPIRY ──────────────────────────────────────────────────
        if (activeTab === 'parts') {
            const expired = data.expired || [];
            const expiring = data.expiring || [];
            return (
                <div className="divide-y divide-gray-100">
                    {/* Expired */}
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                            <h3 className="font-semibold text-gray-900">Expired Parts / Documents ({expired.length})</h3>
                        </div>
                        {expired.length === 0 ? (
                            <p className="text-gray-400 text-sm">No expired parts or documents.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th>Truck</th>
                                            <th>Part / Document</th>
                                            <th>Part Number</th>
                                            <th>Expired On</th>
                                            <th className="text-right">Days Expired</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expired.map((r) => (
                                            <tr key={r.id}>
                                                <td className="font-semibold text-gray-900">{r.plate_no}</td>
                                                <td className="text-gray-700">{r.part_name}</td>
                                                <td className="text-gray-500 text-xs font-mono">{r.part_number || '-'}</td>
                                                <td className="text-gray-600">{fmtDate(r.expiry_date)}</td>
                                                <td className="text-right font-bold text-red-600">
                                                    {Math.abs(daysUntil(r.expiry_date))} days ago
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Expiring soon */}
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                            <h3 className="font-semibold text-gray-900">Expiring — Next 90 Days ({expiring.length})</h3>
                        </div>
                        {expiring.length === 0 ? (
                            <p className="text-gray-400 text-sm">No parts expiring in the next 90 days.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th>Truck</th>
                                            <th>Part / Document</th>
                                            <th>Part Number</th>
                                            <th>Expiry Date</th>
                                            <th className="text-right">Days Left</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expiring.map((r) => {
                                            const days = daysUntil(r.expiry_date);
                                            return (
                                                <tr key={r.id}>
                                                    <td className="font-semibold text-gray-900">{r.plate_no}</td>
                                                    <td className="text-gray-700">{r.part_name}</td>
                                                    <td className="text-gray-500 text-xs font-mono">{r.part_number || '-'}</td>
                                                    <td className="text-gray-600">{fmtDate(r.expiry_date)}</td>
                                                    <td className={`text-right font-bold ${days <= 14 ? 'text-red-600' : days <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
                                                        {days} days
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
        }

        // ── MONTHLY OVERVIEW ──────────────────────────────────────────────
        if (activeTab === 'monthly') {
            const totals = data.totals || {};
            const prevTotals = data.prevTotals || {};
            const byType = data.byType || [];
            const byVehicle = data.byVehicle || [];
            const change = totals.total_debit - (prevTotals.total_debit || 0);
            const changePct = prevTotals.total_debit > 0
                ? Math.round((change / prevTotals.total_debit) * 100)
                : null;
            const TYPE_LABELS = { fuel: 'Fuel', maintenance: 'Maintenance', insurance: 'Insurance', parts: 'Parts', other: 'Other' };

            return (
                <div>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-100">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Transactions</p>
                            <p className="text-2xl font-bold text-gray-900">{totals.transaction_count || 0}</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4">
                            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Total Debit</p>
                            <p className="text-2xl font-bold text-red-700">{fmt(totals.total_debit)}</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4">
                            <p className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-1">Total Credit</p>
                            <p className="text-2xl font-bold text-green-700">{fmt(totals.total_credit)}</p>
                        </div>
                        <div className={`rounded-xl p-4 ${change > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                vs Last Month
                            </p>
                            <p className={`text-2xl font-bold ${change > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                {change > 0 ? '+' : ''}{changePct !== null ? `${changePct}%` : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {change > 0 ? '▲' : '▼'} {fmt(Math.abs(change))}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x divide-gray-100">
                        {/* By Type */}
                        <div className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Breakdown by Category</h3>
                            {byType.length === 0 ? (
                                <p className="text-gray-400 text-sm">No transactions this month.</p>
                            ) : (
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th className="text-right">Count</th>
                                            <th className="text-right">Debit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {byType.map((r, i) => (
                                            <tr key={i}>
                                                <td className="font-medium text-gray-900">{TYPE_LABELS[r.expense_type] || r.expense_type}</td>
                                                <td className="text-right text-gray-600">{r.count}</td>
                                                <td className="text-right text-red-600 font-medium">{fmt(r.total_debit)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* By Vehicle */}
                        <div className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Breakdown by Truck</h3>
                            {byVehicle.length === 0 ? (
                                <p className="text-gray-400 text-sm">No transactions this month.</p>
                            ) : (
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th>Truck</th>
                                            <th className="text-right">Count</th>
                                            <th className="text-right">Debit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {byVehicle.map((r, i) => (
                                            <tr key={i}>
                                                <td className="font-semibold text-gray-900">{r.plate_no}</td>
                                                <td className="text-right text-gray-600">{r.count}</td>
                                                <td className="text-right text-red-600 font-medium">{fmt(r.total_debit)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <>
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 12mm 14mm; }
                    .no-print { display: none !important; }
                    aside, nav, header { display: none !important; }
                    main { margin-left: 0 !important; padding: 0 !important; }
                    body { background: white !important; font-size: 11px; }
                    .card { box-shadow: none !important; border: 1px solid #d1d5db !important; break-inside: avoid; }
                    .print-letterhead { display: block !important; }
                    table { font-size: 10px; width: 100%; }
                    th, td { padding: 4px 6px !important; }
                    .overflow-x-auto { overflow: visible !important; }
                }
                .print-letterhead { display: none; }
            `}</style>

            {/* Letterhead — visible only when printing */}
            <div className="print-letterhead" style={{ borderBottom: '2px solid #1e3a5f', paddingBottom: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e3a5f', letterSpacing: '0.5px' }}>
                            Jifs Company &amp; Gen Supp Ltd
                        </div>
                        <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '3px' }}>Fleet Management Report</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '11px', color: '#4b5563', lineHeight: '1.6' }}>
                        <div>P.O.Box 14, Ngara</div>
                        <div>+255 784 223 819</div>
                        <div>Printed: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            <div className="animate-fade-in">
                {/* Error */}
                {error && (
                    <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 no-print">
                        <span className="text-sm">{error}</span>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-6 no-print">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                        <p className="text-gray-500 mt-1">Analyse fleet performance and financial data</p>
                    </div>
                    {data && (
                        <button onClick={() => window.print()} className="btn btn-primary no-print">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                        </button>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="no-print mb-6">
                    <div className="flex gap-2 flex-wrap">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter bar */}
                {(activeTabDef?.hasDate || activeTabDef?.hasMonth) && (
                    <div className="card p-4 mb-6 no-print">
                        <div className="flex flex-wrap items-end gap-4">
                            {activeTabDef.hasDate && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">From</label>
                                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">To</label>
                                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
                                    </div>
                                </>
                            )}
                            {activeTabDef.hasMonth && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
                                    <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input" />
                                </div>
                            )}
                            <button onClick={handleGenerate} disabled={loading} className="btn btn-primary">
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                )}
                                Refresh
                            </button>
                        </div>
                    </div>
                )}

                {/* Report card */}
                <div className="card overflow-hidden">
                    {/* Report header (visible in print) */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-blue-600">{activeTabDef?.icon}</span>
                                <h2 className="font-bold text-gray-900">{activeTabDef?.label}</h2>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">{activeTabDef?.desc}</p>
                        </div>
                        {activeTabDef?.hasDate && (
                            <p className="text-sm text-gray-500 no-print">
                                {fmtDate(startDate)} – {fmtDate(endDate)}
                            </p>
                        )}
                        {activeTabDef?.hasMonth && (
                            <p className="text-sm text-gray-500 no-print">
                                {new Date(month + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                            </p>
                        )}
                        {/* For fixed reports, show a refresh button inside the card */}
                        {!activeTabDef?.hasDate && !activeTabDef?.hasMonth && (
                            <button onClick={handleGenerate} disabled={loading} className="btn btn-secondary text-sm no-print">
                                {loading
                                    ? <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                }
                                Refresh
                            </button>
                        )}
                    </div>

                    {renderContent()}

                    {!loading && !data && !error && (
                        <div className="text-center py-12 text-gray-400">Select a report above to view data.</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Reports;
