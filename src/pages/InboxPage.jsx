import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { approvalApi } from '../api/approvalApi';

const InboxPage = () => {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'
    const navigate = useNavigate();

    useEffect(() => {
        approvalApi.getApprovals()
            .then((data) => {
                setApprovals(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch approvals:', err);
                setLoading(false);
            });
    }, []);

    const handleRowClick = (id) => {
        navigate(`/approvals/${id}`);
    };

    // Filter logic
    const filteredApprovals = approvals.filter(app => {
        if (activeTab === 'pending') {
            return app.status === 'pending' || app.status === 'draft';
        } else {
            return app.status === 'approved' || app.status === 'rejected';
        }
    });

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="page-container">
            <header className="page-header header-main" style={{ marginBottom: '0' }}>
                <div>
                    <h1>Inbox</h1>
                    <p className="subtitle">Manage your approval requests</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="tabs">
                <button 
                    className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending ({approvals.filter(a => a.status === 'pending' || a.status === 'draft').length})
                </button>
                <button 
                    className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                >
                    Completed ({approvals.filter(a => a.status !== 'pending' && a.status !== 'draft').length})
                </button>
            </div>

            {filteredApprovals.length === 0 ? (
                <div className="empty-state">
                    <p>No {activeTab} approvals found.</p>
                </div>
            ) : (
                <div className="inbox_table_container">
                    <table className="inbox_table">
                        <thead>
                            <tr>
                                <th style={{ width: '100px' }}>Status</th>
                                <th style={{ width: '40%' }}>Title</th>
                                <th>Requester</th>
                                <th>Current Node</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApprovals.map((approval) => {
                                // Safe access to steps
                                const currentStepIdx = (approval.flow_process.current_step || 1) - 1;
                                const steps = approval.flow_process.steps || [];
                                const currentStepName = steps[currentStepIdx]?.name || "End";

                                // Format Date
                                const dateStr = new Date(approval.created_at || Date.now()).toLocaleDateString();

                                return (
                                    <tr key={approval.id} onClick={() => handleRowClick(approval.id)}>
                                        <td>
                                            <span className={`badge ${approval.status}`}>
                                                {approval.status}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{approval.title}</td>
                                        <td>
                                            <div style={{ display:'flex', alignItems:'center', gap:'8px'}}>
                                                <div className="avatar-placeholder" style={{ width:'24px', height:'24px', fontSize:'0.7rem'}}>
                                                    {approval.requester_id.substring(0,1).toUpperCase()}
                                                </div>
                                                <span className="text-muted" style={{ fontSize:'0.9rem' }}>
                                                    {approval.requester_id.substring(0,8)}...
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-muted">{currentStepName}</td>
                                        <td className="text-muted" style={{ fontSize: '0.85rem' }}>{dateStr}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InboxPage;
