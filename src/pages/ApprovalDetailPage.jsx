import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ApprovalDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [approval, setApproval] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchApproval();
    }, [id]);

    const fetchApproval = () => {
        fetch(`/api/approvals/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Approval not found");
                return res.json();
            })
            .then((data) => {
                setApproval(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch approval:', err);
                setLoading(false);
            });
    };

    const handleAction = async (action) => {
        if (!confirm(`Are you sure you want to ${action} this request?`)) return;
        
        setProcessing(true);
        try {
            let body = null;
            if (action === 'reject') {
                const reason = prompt("Enter rejection reason:");
                if (!reason) {
                    setProcessing(false);
                    return;
                }
                body = JSON.stringify({ reason });
            }

            const response = await fetch(`/api/approvals/${id}/${action}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: body
            });

            if (response.ok) {
                alert(`Successfully ${action}ed!`);
                fetchApproval();
            } else {
                const errMsg = await response.text();
                alert(`Failed to ${action}: ${errMsg}`);
            }
        } catch (e) {
            console.error(e);
            alert(`Error processing request`);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="loading">Loading details...</div>;
    if (!approval) return <div className="error">Approval request not found.</div>;

    const { flow_process } = approval;
    const currentStepIndex = flow_process.current_step - 1; // 1-based to 0-based

    // Helper to format generic form data keys
    const formatKey = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

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
                        {/* Generic Form Data Renderer */}
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

            {/* Action Footer (Only if pending) */}
            {approval.status === 'pending' && (
                <div className="action-footer">
                    <div className="page-container action-btns">
                        <div style={{ flex: 1 }}>
                            {/* Comment Input Placeholder */}
                            <input 
                                type="text" 
                                placeholder="Add a comment (optional)..." 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalDetailPage;
