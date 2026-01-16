import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TemplateListPage = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/templates')
            .then((res) => res.json())
            .then((data) => {
                setTemplates(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch templates:', err);
                setLoading(false);
            });
    }, []);

    const handleCreateTemplate = () => {
        navigate('/templates/new');
    };

    const handleUseTemplate = (templateId) => {
        // Navigate to the request creation page with this template
        // For now, we'll placeholder this
        navigate(`/new?templateId=${templateId}`);
    };

    if (loading) return <div className="loading">Loading templates...</div>;

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1>Templates</h1>
                    <p className="subtitle">Select a template to start a new request or manage existing ones.</p>
                </div>
                <button className="btn-primary" onClick={handleCreateTemplate}>
                    + Create Template
                </button>
            </header>

            {templates.length === 0 ? (
                <div className="empty-state">
                    <p>No templates found. Create your first approval template.</p>
                </div>
            ) : (
                <div className="template-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {templates.map((template) => (
                        <div key={template.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', borderBottom: 'none' }}>{template.name}</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
                                    {template.description || "No description provided."}
                                </p>
                            </div>
                            
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button 
                                    className="btn-primary" 
                                    style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                                    onClick={() => handleUseTemplate(template.id)}
                                >
                                    Use Template
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TemplateListPage;
