import { useState, useEffect } from 'react';
import api from '../api/client';

const Statement = () => {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const [suppliers, setSuppliers] = useState([]);
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [startDate, setStartDate] = useState(firstOfMonth);
    const [endDate, setEndDate] = useState(todayStr);
    const [statement, setStatement] = useState([]);
    const [summary, setSummary] = useState({ total_debit: 0, total_credit: 0, final_balance: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generated, setGenerated] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const res = await api.get('/suppliers');
                setSuppliers(res.data.suppliers || []);
            } catch {
                setError('Failed to load suppliers.');
            }
            // Auto-generate current month statement on page load
            try {
                const params = new URLSearchParams({ start: firstOfMonth, end: todayStr });
                const res = await api.get(`/expenses/statement?${params.toString()}`);
                setStatement(res.data.statement || []);
                setSummary(res.data.summary || { total_debit: 0, total_credit: 0, final_balance: 0 });
                setGenerated(true);
            } catch {
                // silently fail auto-load, user can still click Generate
            }
        };
        init();
    }, []);

    const toggleSupplier = (id) => {
        setSelectedSuppliers(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start', startDate);
            if (endDate) params.append('end', endDate);
            if (selectedSuppliers.length > 0) {
                params.append('supplier_id', selectedSuppliers.join(','));
            }

            const res = await api.get(`/expenses/statement?${params.toString()}`);
            setStatement(res.data.statement || []);
            setSummary(res.data.summary || { total_debit: 0, total_credit: 0, final_balance: 0 });
            setGenerated(true);
        } catch {
            setError('Failed to generate statement. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (amount) => {
        if (amount === null || amount === undefined || amount === '') return '-';
        return new Intl.NumberFormat('en-TZ').format(amount);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
    };

    const selectedSupplierNames = selectedSuppliers.length === 0
        ? 'All Suppliers'
        : suppliers
            .filter(s => selectedSuppliers.includes(s.id))
            .map(s => s.name)
            .join(', ');

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    aside, nav { display: none !important; }
                    main { margin-left: 0 !important; padding: 0 !important; }
                    body { background: white !important; }
                    .card { box-shadow: none !important; border: none !important; }
                    .statement-table th,
                    .statement-table td { font-size: 11px !important; padding: 4px 6px !important; }
                    .balance-negative { color: #dc2626 !important; }
                }
            `}</style>

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

                {/* Page Header */}
                <div className="flex items-center justify-between mb-8 no-print">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Supplier Statement</h1>
                        <p className="text-gray-500 mt-1">Generate a reconciliation statement per supplier</p>
                    </div>
                    {generated && statement.length > 0 && (
                        <button
                            onClick={() => window.print()}
                            className="btn btn-primary no-print"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="card p-6 mb-6 no-print">
                    <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>

                    {/* Date range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">From Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">To Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input"
                            />
                        </div>
                    </div>

                    {/* Supplier selection */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Suppliers</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedSuppliers([])}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                    selectedSuppliers.length === 0
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                }`}
                            >
                                All Suppliers
                            </button>
                            {suppliers.map(s => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => toggleSupplier(s.id)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                        selectedSuppliers.includes(s.id)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                    }`}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Generate Statement
                            </>
                        )}
                    </button>
                </div>

                {/* Statement output */}
                {generated && (
                    <div className="card overflow-hidden">
                        {/* Print header */}
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">JIFS Fleet Management</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Supplier Ledger Statement</p>
                                </div>
                                <div className="text-right text-sm text-gray-600">
                                    <p><span className="font-medium">Period:</span> {formatDate(startDate)} – {formatDate(endDate)}</p>
                                    <p><span className="font-medium">Supplier(s):</span> {selectedSupplierNames}</p>
                                    <p><span className="font-medium">Generated:</span> {formatDate(todayStr)}</p>
                                </div>
                            </div>
                        </div>

                        {statement.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-gray-500">No transactions found for the selected filters.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="table statement-table w-full">
                                        <thead>
                                            <tr>
                                                <th className="whitespace-nowrap">Date</th>
                                                <th className="whitespace-nowrap">Due Date</th>
                                                <th className="whitespace-nowrap">Document No</th>
                                                <th className="whitespace-nowrap">Reference</th>
                                                <th>Item Description</th>
                                                <th className="whitespace-nowrap">Truck No</th>
                                                <th className="text-right whitespace-nowrap">QTY</th>
                                                <th className="whitespace-nowrap">UOM</th>
                                                <th className="text-right whitespace-nowrap">Debit</th>
                                                <th className="text-right whitespace-nowrap">Credit</th>
                                                <th className="text-right whitespace-nowrap">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {statement.map((row) => (
                                                <tr key={row.id}>
                                                    <td className="text-gray-600 whitespace-nowrap">{formatDate(row.date)}</td>
                                                    <td className="text-gray-600 whitespace-nowrap">{formatDate(row.due_date)}</td>
                                                    <td className="text-gray-500 text-xs font-mono whitespace-nowrap">{row.document_no || '-'}</td>
                                                    <td className="text-gray-600 whitespace-nowrap">{row.reference_no || '-'}</td>
                                                    <td className="text-gray-700">{row.item_description || row.expense_type || '-'}</td>
                                                    <td className="font-medium text-gray-900 whitespace-nowrap">{row.plate_no || '-'}</td>
                                                    <td className="text-right text-gray-600">{row.quantity != null ? formatNumber(row.quantity) : '-'}</td>
                                                    <td className="text-gray-600">{row.unit || '-'}</td>
                                                    <td className="text-right font-medium text-red-600 whitespace-nowrap">
                                                        {row.debit ? formatNumber(row.debit) : '-'}
                                                    </td>
                                                    <td className="text-right font-medium text-green-600 whitespace-nowrap">
                                                        {row.credit ? formatNumber(row.credit) : '-'}
                                                    </td>
                                                    <td className={`text-right font-semibold whitespace-nowrap ${row.running_balance < 0 ? 'text-red-600 balance-negative' : 'text-gray-900'}`}>
                                                        {formatNumber(row.running_balance)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                                                <td colSpan={8} className="text-gray-700 px-4 py-3">Totals</td>
                                                <td className="text-right text-red-600 px-4 py-3 whitespace-nowrap">
                                                    {formatNumber(summary.total_debit)}
                                                </td>
                                                <td className="text-right text-green-600 px-4 py-3 whitespace-nowrap">
                                                    {formatNumber(summary.total_credit)}
                                                </td>
                                                <td className={`text-right px-4 py-3 whitespace-nowrap ${summary.final_balance < 0 ? 'text-red-600 balance-negative' : 'text-gray-900'}`}>
                                                    {formatNumber(summary.final_balance)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Summary cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-t border-gray-100 no-print">
                                    <div className="bg-red-50 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Total Debit</p>
                                        <p className="text-xl font-bold text-red-700">{formatNumber(summary.total_debit)}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-1">Total Credit</p>
                                        <p className="text-xl font-bold text-green-700">{formatNumber(summary.total_credit)}</p>
                                    </div>
                                    <div className={`rounded-lg p-4 ${summary.final_balance < 0 ? 'bg-red-50' : 'bg-blue-50'}`}>
                                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${summary.final_balance < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                            Closing Balance
                                        </p>
                                        <p className={`text-xl font-bold ${summary.final_balance < 0 ? 'text-red-700' : 'text-blue-700'}`}>
                                            {formatNumber(summary.final_balance)}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default Statement;
