import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const ApprovalDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [approval, setApproval] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    
    const [processing, setProcessing] = useState(false);

    const [logs, setLogs] = useState([]);
    
    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [approvalRes, logsRes] = await Promise.all([
                api.get(`/approvals/${id}`),
                api.get(`/approvals/${id}/logs`)
            ]);

            setApproval(approvalRes.data);
            setLogs(logsRes.data);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action) => {
        if (!confirm(`Are you sure you want to ${action} this request?`)) return;
        
        setProcessing(true);
        try {
            let body = {};
            if (action === 'reject') {
                const reason = prompt("Enter rejection reason:");
                if (!reason) {
                    setProcessing(false);
                    return;
                }
                body = { reason };
            }

            await api.post(`/approvals/${id}/${action}`, body);
            
            alert(`Successfully ${action}ed!`);
            fetchData();
        } catch (e) {
            console.error(e);
            alert(`Error processing request`);
        } finally {
            setProcessing(false);
        }
    };

    const handlePostComment = async () => {
        if (!comment.trim()) return;
        setProcessing(true);
        try {
            await api.post(`/approvals/${id}/comments`, { content: comment });
            setComment("");
            fetchData(); // Refresh logs
        } catch (e) {
            console.error(e);
            alert("Failed to post comment");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="loading">Loading details...</div>;
    if (!approval) return <div className="error">Approval request not found.</div>;

    const { flow_process } = approval;
    const currentStepIndex = flow_process.current_step - 1; 

    // Helper to format generic form data keys
    const formatKey = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

    return (
        <div className="page-container">
            <button className="back-btn" onClick={() => navigate('/')}>
                ← Back to Inbox
            </button>

            <header className="page-header header-main">
                <div>
                    <h1>{approval.title}</h1>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span className={`badge ${approval.status}`}>{approval.status}</span>
                        <span className="subtitle">Requested by {approval.requester_id}</span>
                    </div>
                </div>
            </header>

            <div className="detail_container">
                {/* Left Column: Form Content */}
                <div className="detail-section">
                    <div className="card">
                        <h2>Request Data</h2>
                        <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
                            {approval.form_data && typeof approval.form_data === 'object' ? (
                                Object.entries(approval.form_data).map(([key, value]) => (
                                    <div key={key} className="form-field">
                                        <label className="form-label">{formatKey(key)}</label>
                                        <div className="form-value">
                                            {typeof value === 'object' ? (
                                                <pre style={{ margin: 0, fontSize: '0.85rem' }}>
                                                    {JSON.stringify(value, null, 2)}
                                                </pre>
                                            ) : (
                                                value.toString()
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted">No form data available.</p>
                            )}
                        </div>
                    </div>

                    {/* Activity Log Section */}
                    <div className="card" style={{ marginTop: '20px' }}>
                        <h2>Activity Log</h2>
                        <div className="activity-log">
                            {logs.length === 0 && <p className="text-muted">No activity yet.</p>}
                            {logs.map((log) => (
                                <div key={log.id} className="log-item" style={{ 
                                    padding: '12px 0', 
                                    borderBottom: '1px solid var(--border-subtle)',
                                    display: 'flex', gap: '12px'
                                }}>
                                    <div className="log-icon" style={{ 
                                        width: '32px', height: '32px', borderRadius: '50%', 
                                        background: log.action_type === 'APPROVED' ? 'var(--status-approved-text)' : 
                                                    log.action_type === 'REJECTED' ? 'var(--status-rejected-text)' : 'var(--bg-surface)',
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.8rem'
                                    }}>
                                        {log.action_type[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: '600' }}>
                                                {log.action_type}
                                                {log.action_type === 'COMMENT' && 'ED'}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {formatDate(log.created_at)}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                                            {log.content || (log.action_type === 'CREATED' ? 'Request created' : '')}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            By: {log.actor_id}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Workflow Timeline */}
                <div className="detail-section">
                    <div className="card">
                        <h2>Approval Workflow</h2>
                        <div className="workflow-list">
                            {flow_process.steps.map((step, index) => {
                                const isCurrent = index === currentStepIndex && approval.status === 'pending';
                                const isPast = index < currentStepIndex;
                                const isRejected = approval.status === 'rejected' && index === currentStepIndex;
                                
                                return (
                                    <div 
                                        key={step.seq} 
                                        className={`workflow-step ${isCurrent ? 'active' : ''}`}
                                        style={{ 
                                            opacity: (isPast || isCurrent || isRejected) ? 1 : 0.5,
                                            borderColor: isRejected ? 'var(--status-rejected-text)' : undefined
                                        }}
                                    >
                                        <div className="step-number" style={{
                                            background: isPast ? 'var(--accent-primary)' : isCurrent ? 'var(--accent-primary)' : 'var(--bg-app)',
                                            color: isPast || isCurrent ? 'white' : 'var(--text-secondary)',
                                            width: '28px', height: '28px', fontSize: '0.8rem', marginRight: '12px'
                                        }}>
                                            {index + 1}
                                        </div>
                                        <div className="step-info">
                                            <div className="step-name">{step.name}</div>
                                            <div className="step-meta">Approver: {step.approver_id.substring(0, 8)}...</div>
                                            <div className="step-status" style={{ 
                                                marginTop: '4px', 
                                                color: step.status === 'approved' ? 'var(--status-approved-text)' : 
                                                       step.status === 'rejected' ? 'var(--status-rejected-text)' : '' 
                                            }}>
                                                {step.status.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            {/* Always show footer to allow comments even if closed? For now only if pending for actions. 
               But comments should be allowed always? Let's keep it restricted to pending for MVP simplicity or allow always.
               Let's allow comments always, but actions only if pending.
            */}
            <div className="action-footer">
                <div className="page-container action-btns">
                    <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                        <input 
                            type="text" 
                            placeholder="Add a comment..." 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            style={{ flex: 1 }}
                        />
                         <button 
                            className="btn" 
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                            onClick={handlePostComment}
                            disabled={processing || !comment.trim()}
                        >
                            Comment
                        </button>
                    </div>
                   
                   {approval.status === 'pending' && (
                       <>
                        <div style={{ width: '1px', background: 'var(--border-subtle)', margin: '0 10px' }}></div>
                        <button 
                            className="btn btn-reject" 
                            onClick={() => handleAction('reject')}
                            disabled={processing}
                        >
                            Reject
                        </button>
                        <button 
                            className="btn btn-approve" 
                            onClick={() => handleAction('approve')}
                            disabled={processing}
                        >
                            Approve
                        </button>
                       </>
                   )}
                </div>
            </div>
        </div>
    );
};

export default ApprovalDetailPage;


