import { useState, useEffect } from 'react';
import api from '../api/client';

const JIFS = {
    name:    'JIFS COMPANY & GEN SUPP LTD',
    sub:     'General Supplies & Fleet Operations',
    address: 'Ngara - Kagera, Tanzania',
    pobox:   'P.O.Box 14, Ngara',
    phone:   '+255 767 223 819',
    tin:     '120-617-982',
    vrn:     '',
    currency:'TZS',
};

const Statement = () => {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const [suppliers, setSuppliers] = useState([]);
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [startDate, setStartDate] = useState(firstOfMonth);
    const [endDate, setEndDate] = useState(todayStr);
    const [statement, setStatement] = useState([]);
    const [openingBalance, setOpeningBalance] = useState(0);
    const [summary, setSummary] = useState({ total_debit: 0, total_credit: 0, final_balance: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generated, setGenerated] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const res = await api.get('/suppliers');
                setSuppliers(res.data.suppliers || []);
            } catch { setError('Failed to load suppliers.'); }
            try {
                const params = new URLSearchParams({ start: firstOfMonth, end: todayStr });
                const res = await api.get(`/expenses/statement?${params}`);
                setStatement(res.data.statement || []);
                setOpeningBalance(res.data.opening_balance || 0);
                setSummary(res.data.summary || { total_debit: 0, total_credit: 0, final_balance: 0 });
                setGenerated(true);
            } catch { /* silent */ }
        };
        init();
    }, []);

    const toggleSupplier = (id) =>
        setSelectedSuppliers(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

    const handleGenerate = async () => {
        setLoading(true); setError(null);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start', startDate);
            if (endDate)   params.append('end', endDate);
            if (selectedSuppliers.length > 0) params.append('supplier_id', selectedSuppliers.join(','));
            const res = await api.get(`/expenses/statement?${params}`);
            setStatement(res.data.statement || []);
            setOpeningBalance(res.data.opening_balance || 0);
            setSummary(res.data.summary || { total_debit: 0, total_credit: 0, final_balance: 0 });
            setGenerated(true);
        } catch {
            setError('Failed to generate statement.');
        } finally { setLoading(false); }
    };

    const fmt = (n) => {
        if (n === null || n === undefined || n === '') return '-';
        return new Intl.NumberFormat('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    };
    const fmtDate = (d) => {
        if (!d) return '-';
        const dt = new Date(d);
        return `${String(dt.getUTCDate()).padStart(2,'0')}/${String(dt.getUTCMonth()+1).padStart(2,'0')}/${dt.getUTCFullYear()}`;
    };

    const singleSupplier = selectedSuppliers.length === 1
        ? suppliers.find(s => s.id === selectedSuppliers[0])
        : null;

    const selectedSupplierNames = selectedSuppliers.length === 0
        ? 'All Suppliers'
        : suppliers.filter(s => selectedSuppliers.includes(s.id)).map(s => s.name).join(', ');

    const printedOn = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

    /* ── The printed header block (shown on every page via CSS repeat-header) ── */
    const PrintHeader = () => (
        <div className="print-letterhead">
            {/* Gold top stripe */}
            <div style={{ height: '5px', background: 'linear-gradient(90deg,#c47f17,#a86c10,#7a4f0d)', marginBottom: '0' }}></div>

            {/* Company row */}
            <table style={{ width:'100%', borderCollapse:'collapse', padding:'8px 0 6px' }}><tbody><tr>
                <td style={{ verticalAlign:'middle', paddingTop:'8px', paddingBottom:'4px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        {/* Logo or icon */}
                        {singleSupplier?.logo_data && singleSupplier.logo_data.startsWith('data:')
                            ? <img src={singleSupplier.logo_data} alt="logo" style={{ width:'52px', height:'52px', objectFit:'contain', borderRadius:'6px', border:'1px solid #e5e7eb', background:'#fff', padding:'2px' }} />
                            : <div style={{ width:'52px', height:'52px', background:'linear-gradient(135deg,#c47f17,#7a4f0d)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <svg width="30" height="30" fill="none" stroke="white" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0V9a4 4 0 014-4h0a4 4 0 014 4v4" />
                                </svg>
                              </div>
                        }
                        <div>
                            <div style={{ fontSize:'20px', fontWeight:'900', color:'#1a1200', lineHeight:'1.1', letterSpacing:'0.2px' }}>{JIFS.name}</div>
                            <div style={{ fontSize:'10px', fontWeight:'700', color:'#7a4f0d', letterSpacing:'1px', textTransform:'uppercase', marginTop:'2px' }}>{JIFS.sub}</div>
                            <div style={{ fontSize:'9.5px', color:'#6b7280', marginTop:'1px' }}>
                                {JIFS.address} &nbsp;·&nbsp; {JIFS.pobox} &nbsp;·&nbsp; {JIFS.phone}
                            </div>
                        </div>
                    </div>
                </td>
                <td style={{ textAlign:'right', verticalAlign:'top', paddingTop:'8px', fontSize:'10px', color:'#4b5563', lineHeight:'1.75' }}>
                    <div style={{ fontWeight:'700' }}>TIN NO. : <span style={{ fontWeight:'400' }}>{JIFS.tin}</span></div>
                    {JIFS.vrn && <div style={{ fontWeight:'700' }}>VRN NO. : <span style={{ fontWeight:'400' }}>{JIFS.vrn}</span></div>}
                    <div style={{ fontWeight:'700' }}>PHONE : <span style={{ fontWeight:'400' }}>{JIFS.phone}</span></div>
                    <div style={{ fontWeight:'700' }}>DATE : <span style={{ fontWeight:'400' }}>{printedOn}</span></div>
                </td>
            </tr></tbody></table>

            {/* Gold rule */}
            <div style={{ height:'2px', background:'linear-gradient(90deg,#c47f17,rgba(196,127,23,0.1))', marginBottom:'8px' }}></div>

            {/* CUSTOMER STATEMENT title bar */}
            <div style={{ border:'1.5px solid #1a1200', textAlign:'center', padding:'4px 0', marginBottom:'7px', borderRadius:'2px' }}>
                <div style={{ fontSize:'13px', fontWeight:'800', color:'#1a1200', letterSpacing:'1.5px' }}>SUPPLIER ACCOUNT STATEMENT</div>
                <div style={{ fontSize:'10px', color:'#6b7280', marginTop:'1px' }}>
                    From &nbsp;<strong>{fmtDate(startDate)}</strong>&nbsp; To &nbsp;<strong>{fmtDate(endDate)}</strong>
                </div>
            </div>

            {/* Supplier info grid — mirrors Bakhresa's customer info block */}
            {singleSupplier && (
                <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #d1d5db', fontSize:'10px', marginBottom:'8px' }}>
                    <tbody>
                        <tr>
                            <td style={{ width:'50%', padding:'3px 8px', borderRight:'1px solid #d1d5db', borderBottom:'1px solid #d1d5db' }}>
                                <strong>SUPPLIER NAME</strong> : {singleSupplier.name}
                            </td>
                            <td style={{ padding:'3px 8px', borderBottom:'1px solid #d1d5db' }}>
                                <strong>DATE</strong> : {printedOn}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding:'3px 8px', borderRight:'1px solid #d1d5db', borderBottom:'1px solid #d1d5db' }}>
                                <strong>TIN NO.</strong> : {singleSupplier.tin_no || '—'}
                                &nbsp;&nbsp;&nbsp;&nbsp;<strong>VRN NO.</strong> : {singleSupplier.vrn_no || '—'}
                            </td>
                            <td style={{ padding:'3px 8px', borderBottom:'1px solid #d1d5db' }}>
                                <strong>CURRENCY</strong> : {JIFS.currency}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding:'3px 8px', borderRight:'1px solid #d1d5db', borderBottom:'1px solid #d1d5db' }}>
                                <strong>BILLING ADDRESS</strong> : {singleSupplier.billing_address || '—'}
                            </td>
                            <td style={{ padding:'3px 8px', borderBottom:'1px solid #d1d5db' }}>
                                <strong>CREDIT EXPOSED</strong> : {fmt(summary.total_debit)}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding:'3px 8px', borderRight:'1px solid #d1d5db', borderBottom:'1px solid #d1d5db' }}>
                                <strong>PHONE</strong> : {singleSupplier.contact || '—'}
                                &nbsp;&nbsp;&nbsp;&nbsp;<strong>EMAIL</strong> : {singleSupplier.email || '—'}
                            </td>
                            <td style={{ padding:'3px 8px', borderBottom:'1px solid #d1d5db' }}>
                                <strong>AMOUNT DUE</strong> : {fmt(Math.abs(summary.final_balance))}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding:'3px 8px', borderRight:'1px solid #d1d5db' }}>
                                <strong>SALESMAN</strong> : {singleSupplier.salesman || '—'}
                            </td>
                            <td style={{ padding:'3px 8px' }}>
                                <strong>SALESMAN CONTACT</strong> : {singleSupplier.salesman_contact || '—'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            )}
            {!singleSupplier && (
                <div style={{ fontSize:'10px', color:'#374151', marginBottom:'8px', padding:'4px 8px', border:'1px solid #d1d5db', borderRadius:'2px' }}>
                    <strong>SUPPLIERS:</strong> {selectedSupplierNames} &nbsp;·&nbsp; <strong>CURRENCY:</strong> {JIFS.currency} &nbsp;·&nbsp; <strong>AMOUNT DUE:</strong> {fmt(Math.abs(summary.final_balance))}
                </div>
            )}
        </div>
    );

    return (
        <>
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 8mm 10mm; }
                    .no-print { display: none !important; }
                    aside, nav, header { display: none !important; }
                    main { margin-left: 0 !important; padding: 0 !important; }
                    body { background: white !important; font-size: 10px; }
                    .card { box-shadow: none !important; border: none !important; }
                    .print-letterhead { display: block !important; }
                    .statement-table { font-size: 9.5px; }
                    .statement-table th, .statement-table td { padding: 3px 5px !important; }
                    .overflow-x-auto { overflow: visible !important; }
                    tr { page-break-inside: avoid; }
                }
                .print-letterhead { display: none; }
            `}</style>

            {/* Print header — hidden on screen, shown when printing */}
            <PrintHeader />

            <div className="animate-fade-in">
                {error && (
                    <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 no-print">
                        <span className="text-sm">{error}</span>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                {/* Screen header */}
                <div className="flex items-center justify-between mb-8 no-print">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Supplier Statement</h1>
                        <p className="text-gray-500 mt-1">Generate a reconciliation statement per supplier</p>
                    </div>
                    {generated && statement.length > 0 && (
                        <button onClick={() => window.print()} className="btn btn-primary no-print">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Statement
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="card p-6 mb-6 no-print">
                    <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">From Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">To Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
                        </div>
                    </div>
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setSelectedSuppliers([])}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
                                style={selectedSuppliers.length === 0
                                    ? { background:'linear-gradient(135deg,#c47f17,#a86c10)', color:'#fff', borderColor:'#c47f17' }
                                    : { background:'#fff', color:'#374151', borderColor:'#d1d5db' }}>
                                All Suppliers
                            </button>
                            {suppliers.map(s => (
                                <button key={s.id} type="button" onClick={() => toggleSupplier(s.id)}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
                                    style={selectedSuppliers.includes(s.id)
                                        ? { background:'linear-gradient(135deg,#c47f17,#a86c10)', color:'#fff', borderColor:'#c47f17' }
                                        : { background:'#fff', color:'#374151', borderColor:'#d1d5db' }}>
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleGenerate} disabled={loading} className="btn btn-primary">
                        {loading
                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Generating...</>
                            : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Generate Statement</>
                        }
                    </button>
                </div>

                {/* Statement output */}
                {generated && (
                    <div className="card overflow-hidden">
                        {/* Screen sub-header */}
                        <div className="px-6 pt-5 pb-4 border-b border-gray-100 no-print">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{JIFS.name}</h2>
                                    <p className="text-sm text-gray-500">Supplier Ledger Statement</p>
                                </div>
                                <div className="text-right text-sm text-gray-600">
                                    <p><span className="font-medium">Period:</span> {fmtDate(startDate)} – {fmtDate(endDate)}</p>
                                    <p><span className="font-medium">Supplier(s):</span> {selectedSupplierNames}</p>
                                    <p><span className="font-medium">Generated:</span> {fmtDate(todayStr)}</p>
                                </div>
                            </div>
                        </div>

                        {statement.length === 0 ? (
                            <div className="text-center py-12">
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
                                            {/* Opening balance row */}
                                            <tr style={{ background:'#f8f9fa' }}>
                                                <td colSpan={8} className="font-semibold text-gray-600 italic">Opening Balance</td>
                                                <td className="text-right text-gray-400">—</td>
                                                <td className="text-right text-gray-400">—</td>
                                                <td className={`text-right font-bold whitespace-nowrap ${openingBalance < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                                    {fmt(openingBalance)}
                                                </td>
                                            </tr>

                                            {/* Transactions */}
                                            {statement.map(row => (
                                                <tr key={row.id}>
                                                    <td className="text-gray-600 whitespace-nowrap">{fmtDate(row.date)}</td>
                                                    <td className="text-gray-600 whitespace-nowrap">{fmtDate(row.due_date)}</td>
                                                    <td className="text-gray-500 text-xs font-mono whitespace-nowrap">{row.document_no || '-'}</td>
                                                    <td className="text-gray-600 whitespace-nowrap">{row.reference_no || '-'}</td>
                                                    <td className="text-gray-700">{row.item_description || row.expense_type || '-'}</td>
                                                    <td className="font-medium text-gray-900 whitespace-nowrap">{row.plate_no || '-'}</td>
                                                    <td className="text-right text-gray-600">{row.quantity != null ? fmt(row.quantity).replace('.00','') : '-'}</td>
                                                    <td className="text-gray-600">{row.unit || '-'}</td>
                                                    <td className="text-right font-medium text-red-600 whitespace-nowrap">{row.debit ? fmt(row.debit) : '-'}</td>
                                                    <td className="text-right font-medium text-green-600 whitespace-nowrap">{row.credit ? fmt(row.credit) : '-'}</td>
                                                    <td className={`text-right font-semibold whitespace-nowrap ${row.running_balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {fmt(row.running_balance)}
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* Totals row */}
                                            <tr className="font-bold border-t-2 border-gray-300" style={{ background:'#f1f5f9' }}>
                                                <td colSpan={8} className="text-gray-700 px-4 py-2">Period Totals</td>
                                                <td className="text-right text-red-600 px-4 py-2 whitespace-nowrap">{fmt(summary.total_debit)}</td>
                                                <td className="text-right text-green-600 px-4 py-2 whitespace-nowrap">{fmt(summary.total_credit)}</td>
                                                <td className="text-right px-4 py-2 whitespace-nowrap text-gray-500">—</td>
                                            </tr>

                                            {/* Closing balance row */}
                                            <tr style={{ background:'#fdf8f0', borderTop:'2px solid #c47f17' }}>
                                                <td colSpan={8} className="font-bold px-4 py-2.5" style={{ color:'#7a4f0d' }}>Closing Balance</td>
                                                <td className="text-right text-gray-400 px-4 py-2.5">—</td>
                                                <td className="text-right text-gray-400 px-4 py-2.5">—</td>
                                                <td className={`text-right font-bold text-base px-4 py-2.5 whitespace-nowrap ${summary.final_balance < 0 ? 'text-red-700' : 'text-amber-700'}`}>
                                                    {fmt(summary.final_balance)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Summary cards — screen only */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-t border-gray-100 no-print">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Opening Balance</p>
                                        <p className={`text-xl font-bold ${openingBalance < 0 ? 'text-red-700' : 'text-gray-800'}`}>{fmt(openingBalance)}</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Total Debit (Period)</p>
                                        <p className="text-xl font-bold text-red-700">{fmt(summary.total_debit)}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-1">Total Credit (Period)</p>
                                        <p className="text-xl font-bold text-green-700">{fmt(summary.total_credit)}</p>
                                    </div>
                                    <div className={`md:col-span-3 rounded-lg p-4 ${summary.final_balance < 0 ? 'bg-red-50' : 'bg-amber-50'}`}>
                                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${summary.final_balance < 0 ? 'text-red-500' : 'text-amber-600'}`}>
                                            Closing Balance
                                        </p>
                                        <p className={`text-2xl font-bold ${summary.final_balance < 0 ? 'text-red-700' : 'text-amber-700'}`}>
                                            TZS {fmt(summary.final_balance)}
                                        </p>
                                        {summary.final_balance < 0 && (
                                            <p className="text-sm text-red-500 mt-1">Jifs owes this supplier TZS {fmt(Math.abs(summary.final_balance))}</p>
                                        )}
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
