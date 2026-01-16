import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const InboxPage = () => {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/approvals')
            .then((res) => res.json())
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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Inbox</h1>
                <p className="subtitle">Tasks requiring your attention</p>
            </header>

            {approvals.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '3rem', color: '#64748b' }}>
                    <p>No pending approvals found.</p>
                </div>
            ) : (
                <div className="inbox_table_container">
                    <table className="inbox_table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Title</th>
                                <th>Requester ID</th>
                                <th>Current Step</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvals.map((approval) => (
                                <tr key={approval.id} onClick={() => handleRowClick(approval.id)}>
                                    <td>
                                        <span className={`badge ${approval.status}`}>
                                            {approval.status}
                                        </span>
                                    </td>
                                    <td>{approval.title}</td>
                                    <td>{approval.requester_id}</td>
                                    <td>
                                        {approval.flow_process.steps[approval.flow_process.current_step - 1]?.name || "Completed"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InboxPage;
