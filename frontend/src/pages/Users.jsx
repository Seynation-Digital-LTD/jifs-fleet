import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const DEFAULT_OPERATOR_PERMS = [
    'expenses.create', 'expenses.edit',
    'services.create', 'services.edit',
    'parts.create',    'parts.edit',
    'documents.create','documents.edit',
];

const PERM_GROUPS = [
    {
        label: 'Expenses',
        perms: [
            { key: 'expenses.create', label: 'Add expenses' },
            { key: 'expenses.edit',   label: 'Edit expenses' },
            { key: 'expenses.delete', label: 'Delete expenses' },
        ],
    },
    {
        label: 'Services',
        perms: [
            { key: 'services.create', label: 'Add services' },
            { key: 'services.edit',   label: 'Edit services' },
            { key: 'services.delete', label: 'Delete services' },
        ],
    },
    {
        label: 'Parts',
        perms: [
            { key: 'parts.create', label: 'Add parts' },
            { key: 'parts.edit',   label: 'Edit parts' },
            { key: 'parts.delete', label: 'Delete parts' },
        ],
    },
    {
        label: 'Documents',
        perms: [
            { key: 'documents.create', label: 'Add documents' },
            { key: 'documents.edit',   label: 'Edit documents' },
            { key: 'documents.delete', label: 'Delete documents' },
        ],
    },
    {
        label: 'Vehicles',
        perms: [
            { key: 'vehicles.write', label: 'Add / edit vehicles' },
        ],
    },
    {
        label: 'Suppliers',
        perms: [
            { key: 'suppliers.write', label: 'Add / edit suppliers' },
        ],
    },
];

const ALL_PERM_KEYS = PERM_GROUPS.flatMap(g => g.perms.map(p => p.key));

const Check = ({ ok }) => ok
    ? <span className="text-green-600 font-bold">✓</span>
    : <span className="text-red-400">✗</span>;

const PermCheckbox = ({ permKey, label, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer select-none text-sm py-0.5">
        <input
            type="checkbox"
            checked={checked}
            onChange={e => onChange(permKey, e.target.checked)}
            className="w-4 h-4 rounded accent-amber-600"
        />
        <span className={checked ? 'text-gray-800' : 'text-gray-400'}>{label}</span>
    </label>
);

const Users = () => {
    const { user: me } = useAuth();
    const [users, setUsers]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);
    const [success, setSuccess] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ username: '', password: '', role: 'operator', permissions: [...DEFAULT_OPERATOR_PERMS] });
    const [formBusy, setFormBusy] = useState(false);

    const [editUser, setEditUser]     = useState(null);
    const [editRole, setEditRole]     = useState('');
    const [editPerms, setEditPerms]   = useState([]);
    const [newPassword, setNewPassword] = useState('');
    const [editBusy, setEditBusy]     = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data.users);
        } catch {
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    const notify = (msg, isErr = false) => {
        if (isErr) setError(msg); else setSuccess(msg);
        setTimeout(() => { setError(null); setSuccess(null); }, 4000);
    };

    const togglePerm = (perms, key, on) =>
        on ? [...perms, key] : perms.filter(p => p !== key);

    const handleCreate = async (e) => {
        e.preventDefault();
        setFormBusy(true);
        try {
            const payload = {
                username: form.username,
                password: form.password,
                role:     form.role,
                permissions: form.role === 'operator' ? form.permissions : null,
            };
            await api.post('/auth/users', payload);
            notify('User created successfully.');
            setForm({ username: '', password: '', role: 'operator', permissions: [...DEFAULT_OPERATOR_PERMS] });
            setShowForm(false);
            fetchUsers();
        } catch (err) {
            notify(err.response?.data?.error || 'Failed to create user.', true);
        } finally {
            setFormBusy(false);
        }
    };

    const openEdit = (u) => {
        setEditUser(u);
        setEditRole(u.role);
        setEditPerms(u.permissions || [...DEFAULT_OPERATOR_PERMS]);
        setNewPassword('');
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setEditBusy(true);
        try {
            const payload = {};
            if (editRole !== editUser.role) payload.role = editRole;
            payload.permissions = editRole === 'operator' ? editPerms : null;
            if (newPassword) payload.password = newPassword;
            await api.put(`/auth/users/${editUser.id}`, payload);
            notify('User updated.');
            setEditUser(null);
            fetchUsers();
        } catch (err) {
            notify(err.response?.data?.error || 'Update failed.', true);
        } finally {
            setEditBusy(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/auth/users/${deleteTarget.id}`);
            notify(`User "${deleteTarget.username}" deleted.`);
            setDeleteTarget(null);
            fetchUsers();
        } catch (err) {
            notify(err.response?.data?.error || 'Delete failed.', true);
            setDeleteTarget(null);
        }
    };

    const fmtDate = (d) => d
        ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    return (
        <div className="animate-fade-in">
            {/* Alerts */}
            {error && (
                <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
            {success && (
                <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-6 text-sm">
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-1">Create accounts and control exactly what each operator can do</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                    {showForm
                        ? <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Cancel</>
                        : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add User</>
                    }
                </button>
            </div>

            {/* Create user form */}
            {showForm && (
                <div className="card p-6 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-900 mb-4">New User</h3>
                    <form onSubmit={handleCreate}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username *</label>
                                <input type="text" className="input" placeholder="e.g. john"
                                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                                    required autoComplete="off" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                                <input type="password" className="input" placeholder="Min 8 chars, 1 number"
                                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                    required autoComplete="new-password" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
                                <select className="input select" value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}>
                                    <option value="operator">Operator</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        {/* Permissions for operator */}
                        {form.role === 'operator' && (
                            <div className="mb-5 rounded-xl border border-gray-200 p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-semibold text-gray-700">Operator Permissions</p>
                                    <div className="flex gap-3 text-xs">
                                        <button type="button" className="font-medium hover:underline"
                                            style={{ color: '#c47f17' }}
                                            onClick={() => setForm({ ...form, permissions: [...ALL_PERM_KEYS] })}>
                                            Select all
                                        </button>
                                        <button type="button" className="font-medium text-gray-400 hover:underline"
                                            onClick={() => setForm({ ...form, permissions: [] })}>
                                            Clear all
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                                    {PERM_GROUPS.map(group => (
                                        <div key={group.label}>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{group.label}</p>
                                            {group.perms.map(p => (
                                                <PermCheckbox key={p.key} permKey={p.key} label={p.label}
                                                    checked={form.permissions.includes(p.key)}
                                                    onChange={(key, on) => setForm({ ...form, permissions: togglePerm(form.permissions, key, on) })} />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button type="submit" className="btn btn-success" disabled={formBusy}>
                                {formBusy ? 'Creating...' : 'Create User'}
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #c47f17', borderTopColor: 'transparent' }}></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Permissions</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const isMe = u.id === me?.id;
                                    const locked = u.locked_until && new Date(u.locked_until) > new Date();
                                    const permCount = u.permissions ? u.permissions.length : null;
                                    return (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold">
                                                        {u.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{u.username}</span>
                                                    {isMe && <span className="text-xs font-medium" style={{ color: '#c47f17' }}>(you)</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : ''}`}
                                                    style={u.role === 'operator' ? { background: 'rgba(196,127,23,0.12)', color: '#a86c10' } : {}}
                                                >
                                                    {u.role === 'admin' ? 'Admin' : 'Operator'}
                                                </span>
                                            </td>
                                            <td className="text-sm text-gray-500">
                                                {u.role === 'admin'
                                                    ? <span className="text-purple-600 font-medium">Full access</span>
                                                    : permCount !== null
                                                        ? <span>{permCount} of {ALL_PERM_KEYS.length} actions allowed</span>
                                                        : <span className="text-gray-400">Default</span>
                                                }
                                            </td>
                                            <td>
                                                {locked
                                                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Locked</span>
                                                    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                                                }
                                            </td>
                                            <td className="text-gray-500 text-sm">{fmtDate(u.created_at)}</td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => openEdit(u)} className="link text-sm">Edit</button>
                                                    {!isMe && (
                                                        <button onClick={() => setDeleteTarget(u)} className="link link-danger text-sm">Delete</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit modal */}
            {editUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-gray-900 text-lg mb-4">Edit — {editUser.username}</h3>
                        <form onSubmit={handleEdit}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                                    <select className="input select" value={editRole}
                                        onChange={e => { setEditRole(e.target.value); if (e.target.value === 'operator' && editPerms.length === 0) setEditPerms([...DEFAULT_OPERATOR_PERMS]); }}>
                                        <option value="operator">Operator — custom permissions</option>
                                        <option value="admin">Admin — full access</option>
                                    </select>
                                </div>

                                {/* Granular permissions — only for operators */}
                                {editRole === 'operator' && (
                                    <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-semibold text-gray-700">What this operator can do</p>
                                            <div className="flex gap-3 text-xs">
                                                <button type="button" className="font-medium hover:underline"
                                                    style={{ color: '#c47f17' }}
                                                    onClick={() => setEditPerms([...ALL_PERM_KEYS])}>
                                                    Select all
                                                </button>
                                                <button type="button" className="font-medium text-gray-400 hover:underline"
                                                    onClick={() => setEditPerms([])}>
                                                    Clear all
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                            {PERM_GROUPS.map(group => (
                                                <div key={group.label}>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{group.label}</p>
                                                    {group.perms.map(p => (
                                                        <PermCheckbox key={p.key} permKey={p.key} label={p.label}
                                                            checked={editPerms.includes(p.key)}
                                                            onChange={(key, on) => setEditPerms(prev => togglePerm(prev, key, on))} />
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Reset Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                                    </label>
                                    <input type="password" className="input"
                                        placeholder="New password (min 8 chars, 1 number)"
                                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                        autoComplete="new-password" />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn btn-success" disabled={editBusy}>
                                    {editBusy ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Delete User</p>
                                <p className="text-sm text-gray-500">This cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-gray-700 mb-6">Are you sure you want to delete <strong>{deleteTarget.username}</strong>?</p>
                        <div className="flex gap-3">
                            <button onClick={handleDelete} className="btn btn-danger flex-1">Delete</button>
                            <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost flex-1">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
