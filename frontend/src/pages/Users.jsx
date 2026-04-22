import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const PERMISSIONS = [
    { label: 'View dashboard & reports',         admin: true,  operator: true  },
    { label: 'View vehicles & suppliers',         admin: true,  operator: true  },
    { label: 'Add / edit expenses',              admin: true,  operator: true  },
    { label: 'Add / edit services & parts',      admin: true,  operator: true  },
    { label: 'Add / edit documents',             admin: true,  operator: true  },
    { label: 'Add / edit vehicles & suppliers',  admin: true,  operator: false },
    { label: 'Delete any record',                admin: true,  operator: false },
    { label: 'Manage users',                     admin: true,  operator: false },
];

const Check = ({ ok }) => ok
    ? <span className="text-green-600 font-bold">✓</span>
    : <span className="text-red-400">✗</span>;

const Users = () => {
    const { user: me } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // New user form
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ username: '', password: '', role: 'operator' });
    const [formBusy, setFormBusy] = useState(false);

    // Edit modal
    const [editUser, setEditUser] = useState(null); // { id, username, role }
    const [editRole, setEditRole] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [editBusy, setEditBusy] = useState(false);

    // Delete confirm
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

    const notify = (msg, isError = false) => {
        if (isError) setError(msg); else setSuccess(msg);
        setTimeout(() => { setError(null); setSuccess(null); }, 4000);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setFormBusy(true);
        try {
            await api.post('/auth/users', form);
            notify('User created successfully.');
            setForm({ username: '', password: '', role: 'operator' });
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
        setNewPassword('');
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setEditBusy(true);
        try {
            const payload = {};
            if (editRole !== editUser.role) payload.role = editRole;
            if (newPassword) payload.password = newPassword;
            if (!Object.keys(payload).length) {
                setEditUser(null);
                return;
            }
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

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

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
                    <p className="text-gray-500 mt-1">Create and manage system users and their access levels</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                    {showForm
                        ? <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Cancel</>
                        : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add User</>
                    }
                </button>
            </div>

            {/* Permission reference table */}
            <div className="card p-5 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Role Permissions</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left">
                                <th className="pb-2 font-medium text-gray-500 pr-6">What the user can do</th>
                                <th className="pb-2 font-medium text-center w-24">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">Admin</span>
                                </th>
                                <th className="pb-2 font-medium text-center w-24">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(196,127,23,0.12)", color: "#a86c10" }}>Operator</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {PERMISSIONS.map((p, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 text-gray-700 pr-6">{p.label}</td>
                                    <td className="py-2 text-center"><Check ok={p.admin} /></td>
                                    <td className="py-2 text-center"><Check ok={p.operator} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create user form */}
            {showForm && (
                <div className="card p-6 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-900 mb-4">New User</h3>
                    <form onSubmit={handleCreate}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username *</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. john"
                                    value={form.username}
                                    onChange={e => setForm({ ...form, username: e.target.value })}
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                                <input
                                    type="password"
                                    className="input"
                                    placeholder="Min 8 chars, 1 number"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
                                <select className="input select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                    <option value="operator">Operator</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
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
                        <div className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: '#c47f17', borderTopColor: 'transparent' }}></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Can Delete</th>
                                    <th>Can Manage Users</th>
                                    <th>Account Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const isMe = u.id === me?.id;
                                    const locked = u.locked_until && new Date(u.locked_until) > new Date();
                                    return (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold">
                                                        {u.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{u.username}</span>
                                                    {isMe && <span className="text-xs font-medium" style={{ color: "#c47f17" }}>(you)</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                    u.role === 'admin'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : '' } style={role === 'operator' ? { background: 'rgba(196,127,23,0.12)', color: '#a86c10' } : {}
                                                }`}>
                                                    {u.role === 'admin' ? 'Admin' : 'Operator'}
                                                </span>
                                            </td>
                                            <td className="text-center"><Check ok={u.role === 'admin'} /></td>
                                            <td className="text-center"><Check ok={u.role === 'admin'} /></td>
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
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
                        <h3 className="font-bold text-gray-900 text-lg mb-4">Edit — {editUser.username}</h3>
                        <form onSubmit={handleEdit}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                                    <select className="input select" value={editRole} onChange={e => setEditRole(e.target.value)}>
                                        <option value="operator">Operator — view + create/edit</option>
                                        <option value="admin">Admin — full access</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Reset Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="New password (min 8 chars, 1 number)"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        autoComplete="new-password"
                                    />
                                </div>

                                {/* Permission preview for chosen role */}
                                <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                        What <span className="text-gray-700">{editUser.username}</span> can do as <span className={editRole === 'admin' ? 'text-purple-600' : ''}>{editRole}</span>:
                                    </p>
                                    <ul className="space-y-1">
                                        {PERMISSIONS.map((p, i) => {
                                            const allowed = editRole === 'admin' ? p.admin : p.operator;
                                            return (
                                                <li key={i} className={`flex items-center gap-2 text-sm ${allowed ? 'text-gray-700' : 'text-gray-300'}`}>
                                                    <Check ok={allowed} />
                                                    {p.label}
                                                </li>
                                            );
                                        })}
                                    </ul>
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
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete <strong>{deleteTarget.username}</strong>?
                        </p>
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
