import { useState } from 'react';
import api from '../api/client';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/verify-password', { password });
            setPassword('');
            onClose();
            onConfirm();
        } catch (err) {
            setError(err.response?.data?.error || 'Incorrect password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-fade-in">
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
                        <p className="text-sm text-gray-500">This action cannot be undone.</p>
                    </div>
                </div>

                {itemName && (
                    <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-sm text-red-700">
                            You are about to permanently delete:{' '}
                            <span className="font-semibold">{itemName}</span>
                        </p>
                    </div>
                )}

                <form onSubmit={handleConfirm}>
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter your password to confirm
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            placeholder="Your login password"
                            className="input"
                            autoFocus
                            required
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                        >
                            {loading ? 'Verifying...' : 'Delete'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 btn btn-ghost"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
