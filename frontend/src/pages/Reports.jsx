import { useState, useEffect } from 'react';
import api from '../api/client';

const Reports = () => {
    const [reportType, setReportType] = useState('vehicle');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState([]);
    const [totals, setTotals] = useState({ debit: 0, credit: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        generateReport();
    }, []);

    const generateReport = async () => {
        setLoading(true);
        try {
            let response;
            if (reportType === 'vehicle') {
                response = await api.get('/reports/expenses-by-vehicle');
            } else if (reportType === 'type') {
                response = await api.get('/reports/expenses-by-type');
            } else {
                response = await api.get(`/reports/expenses-by-date?start=${startDate}&end=${endDate}`);
            }
            
            if (reportType === 'date') {
                setReportData(response.data.expenses || []);
                setTotals({
                    debit: response.data.totals?.total_debit || 0,
                    credit: response.data.totals?.total_credit || 0
                });
            } else {
                setReportData(response.data || []);
                const totalDebit = response.data.reduce((sum, item) => sum + (item.total_debit || 0), 0);
                const totalCredit = response.data.reduce((sum, item) => sum + (item.total_credit || 0), 0);
                setTotals({ debit: totalDebit, credit: totalCredit });
            }
        } catch (error) {
            alert('Failed to generate report');
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
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <p className="text-gray-500 mt-1">Generate expense reports</p>
            </div>

            {/* Filters */}
            <div className="card p-6 mb-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="input select min-w-[200px]"
                        >
                            <option value="vehicle">Expenses by Vehicle</option>
                            <option value="type">Expenses by Type</option>
                            <option value="date">Expenses by Date Range</option>
                        </select>
                    </div>
                    {reportType === 'date' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="input"
                                />
                            </div>
                        </>
                    )}
                    <button onClick={generateReport} className="btn btn-primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Debit</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.debit)}</p>
                        </div>
                    </div>
                </div>
                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Credit</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.credit)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : reportData.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500">No data available for this report</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                {reportType === 'vehicle' && (
                                    <>
                                        <th>Vehicle</th>
                                        <th>Make/Model</th>
                                        <th className="text-right">Expense Count</th>
                                    </>
                                )}
                                {reportType === 'type' && (
                                    <>
                                        <th>Expense Type</th>
                                        <th className="text-right">Count</th>
                                    </>
                                )}
                                {reportType === 'date' && (
                                    <>
                                        <th>Date</th>
                                        <th>Vehicle</th>
                                        <th>Type</th>
                                        <th>Reference</th>
                                    </>
                                )}
                                <th className="text-right">Total Debit</th>
                                <th className="text-right">Total Credit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((item, index) => (
                                <tr key={index}>
                                    {reportType === 'vehicle' && (
                                        <>
                                            <td className="font-medium text-gray-900">{item.plate_no}</td>
                                            <td className="text-gray-600">{item.make_model || '-'}</td>
                                            <td className="text-right text-gray-600">{item.expense_count}</td>
                                        </>
                                    )}
                                    {reportType === 'type' && (
                                        <>
                                            <td className="font-medium text-gray-900 capitalize">{item.expense_type}</td>
                                            <td className="text-right text-gray-600">{item.expense_count}</td>
                                        </>
                                    )}
                                    {reportType === 'date' && (
                                        <>
                                            <td className="text-gray-600">{formatDate(item.date)}</td>
                                            <td className="font-medium text-gray-900">{item.plate_no}</td>
                                            <td className="capitalize text-gray-600">{item.expense_type}</td>
                                            <td className="text-gray-600">{item.reference_no || '-'}</td>
                                        </>
                                    )}
                                    <td className="text-right font-medium text-red-600">
                                        {formatCurrency(item.total_debit || item.debit)}
                                    </td>
                                    <td className="text-right font-medium text-green-600">
                                        {formatCurrency(item.total_credit || item.credit)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-semibold">
                            <tr>
                                <td colSpan={reportType === 'date' ? 4 : reportType === 'type' ? 2 : 3} className="text-gray-900">
                                    Total
                                </td>
                                <td className="text-right text-red-600">{formatCurrency(totals.debit)}</td>
                                <td className="text-right text-green-600">{formatCurrency(totals.credit)}</td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Reports;
