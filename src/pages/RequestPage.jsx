import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { approvalApi } from '../api/approvalApi';
import api from '../api/axiosConfig';

const RequestPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine Template ID from URL query params
    const queryParams = new URLSearchParams(location.search);
    const templateId = queryParams.get('templateId');

    const [loading, setLoading] = useState(false);
    const [pageTitle, setPageTitle] = useState('New Approval Request');
    
    // Form State
    const [title, setTitle] = useState('');
    // Dynamic Form Data (instead of simple content string)
    // We will store values as keys in this object
    const [formData, setFormData] = useState({});
    
    // Template Definition
    const [templateSchema, setTemplateSchema] = useState(null);
    
    // Workflow State
    const [users, setUsers] = useState([]); 
    const [approvers, setApprovers] = useState([]); 
    const [selectedUser, setSelectedUser] = useState('');

    // Load available users 
    useEffect(() => {
        api.get('/org/users')
            .then(res => setUsers(res.data))
            .catch(err => console.error("Failed to load users", err));
    }, []);

    // Load Template if ID exists
    useEffect(() => {
        if (templateId) {
            setLoading(true);
            api.get(`/templates/${templateId}`)
                .then(res => {
                    const tpl = res.data;
                    setPageTitle(tpl.name); // Set page title to template name
                    
                    // 1. Set Form Schema
                    if (tpl.form_schema) {
                        setTemplateSchema(tpl.form_schema);
                        // Initialize formData keys? Optional.
                    }

                    // 2. Set Workflow (Prefill approvers)
                    if (tpl.workflow_snapshot && Array.isArray(tpl.workflow_snapshot.steps)) {
                        // We need to map approver_ids to names if possible, but we might not have users loaded yet
                        // Ideally we wait for users, but for now let's just push IDs.
                        // The UI needs names to display.
                        
                        // Let's resolve names in rendering or fetch them.
                        // For MVP: We will try to match with 'users' state if loaded.
                        // If users list is not loaded yet, we might miss names.
                        
                        const prefills = tpl.workflow_snapshot.steps.map(step => ({
                            name: step.name,
                            approver_id: step.approver_id,
                            approver_name: "Loading...", // Placeholder
                            type: 'approval'
                        }));
                        setApprovers(prefills);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    alert("Failed to load template");
                    setLoading(false);
                });
        }
    }, [templateId]);

    // Update Approver Names once users are loaded
    useEffect(() => {
        if (users.length > 0 && approvers.length > 0) {
            const updated = approvers.map(a => {
                if (a.approver_name === "Loading..." || !a.approver_name) {
                    const u = users.find(user => user.id === a.approver_id);
                    return { ...a, approver_name: u ? u.full_name : "Unknown User" };
                }
                return a;
            });
            // Only update if changes found to avoid loop
            if (JSON.stringify(updated) !== JSON.stringify(approvers)) {
                setApprovers(updated);
            }
        }
    }, [users, approvers]);


    const handleAddApprover = () => {
        if (!selectedUser) return;
        const user = users.find(u => u.id === selectedUser);
        if (user) {
            if (approvers.some(a => a.approver_id === user.id)) {
                alert("User already added!");
                return;
            }
            setApprovers([...approvers, {
                name: `Approver ${approvers.length + 1}`,
                approver_id: user.id,
                approver_name: user.full_name,
                type: 'approval'
            }]);
            setSelectedUser('');
        }
    };

    const handleRemoveApprover = (index) => {
        const newList = [...approvers];
        newList.splice(index, 1);
        setApprovers(newList);
    };

    // Update dynamic form value
    const handleFormChange = (fieldId, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (approvers.length === 0) {
            alert("Please add at least one approver.");
            return;
        }

        setLoading(true);
        try {
            // Use formData state for form_data payload
            // If templateSchema is null (default mode), construct a simple content object
            // But wait, if NO template, we want the old 'content' behavior?
            // Let's decide: If templateSchema exists, use formData. Else use "content" field.
            
            let finalFormData = formData;
            if (!templateSchema) {
                 // Fallback for non-template request (if we support it)
                 // But current UI only shows dynamic if schema exists.
                 // We should render a default 'Content' box if no schema.
                 if (formData['default_content']) {
                     finalFormData = { content: formData['default_content'] };
                 }
            }

            const payload = {
                title: title,
                form_data: finalFormData, 
                flow_process: {
                    steps: approvers.map((a, idx) => ({
                        seq: idx + 1,
                        name: a.name,
                        approver_id: a.approver_id,
                        status: 'pending',
                        timestamp: null
                    })),
                    current_step: 1
                }
            };

            await approvalApi.createApproval(payload);
            alert("Request submitted!");
            navigate('/inbox');
        } catch (err) {
            console.error(err);
            alert("Failed to submit.");
        } finally {
            setLoading(false);
        }
    };

    // Render Form Fields
    const renderFormFields = () => {
        if (!templateSchema || !templateSchema.fields || templateSchema.fields.length === 0) {
            // Default View if no template Selected or Template has no fields
            return (
                <div className="form-group">
                    <label>Content</label>
                    <textarea 
                        className="input-field" 
                        rows={4}
                        value={formData['default_content'] || ''}
                        onChange={e => handleFormChange('default_content', e.target.value)}
                        placeholder="Describe your request..."
                    />
                </div>
            );
        }

        return templateSchema.fields.map(field => (
            <div className="form-group" key={field.id}>
                <label>{field.label}</label>
                {field.type === 'textarea' ? (
                    <textarea
                        className="input-field"
                        rows={3}
                        value={formData[field.id] || ''}
                        onChange={e => handleFormChange(field.id, e.target.value)}
                    />
                ) : (
                    <input 
                        type={field.type || 'text'}
                        className="input-field"
                        value={formData[field.id] || ''}
                        onChange={e => handleFormChange(field.id, e.target.value)}
                    />
                )}
            </div>
        ));
    };

    return (
        <div className="page-container">
            <header className="page-header header-main">
                <div>
                    <h1>{pageTitle}</h1>
                    <p className="subtitle">Submit a new request</p>
                </div>
            </header>

            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>
                    {/* Basic Info */}
                    <div className="form-group">
                        <label>Request Title</label>
                        <input 
                            type="text" 
                            className="input-field"
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            placeholder="e.g. Vacation Request for Oct" 
                            required 
                        />
                    </div>

                    {/* Dynamic Form Area */}
                    {renderFormFields()}

                    <hr className="divider" />

                    {/* Workflow Editor */}
                    <div className="form-group">
                        <label>Approval Workflow</label>
                        <div className="workflow-editor">
                            {/* Step 0: Requester (You) */}
                            <div className="step-card requester">
                                <span className="step-badge">1</span>
                                <div>
                                    <strong>Requester (You)</strong>
                                    <div className="text-muted">Drafting</div>
                                </div>
                            </div>
                            
                            <div className="connector-line">↓</div>

                            {/* Added Approvers */}
                            {approvers.map((approver, index) => (
                                <React.Fragment key={approver.approver_id}>
                                    <div className="step-card">
                                        <span className="step-badge">{index + 2}</span>
                                        <div style={{ flex: 1 }}>
                                            <strong>{approver.approver_name}</strong>
                                            <div className="text-muted">{approver.type === 'approval' ? 'Approver' : 'Reference'}</div>
                                        </div>
                                        <button 
                                            type="button" 
                                            className="btn-icon danger"
                                            onClick={() => handleRemoveApprover(index)}
                                            title="Remove"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="connector-line">↓</div>
                                </React.Fragment>
                            ))}
                            
                            {/* Add Button */}
                            <div className="add-approver-box">
                                <select 
                                    className="input-field" 
                                    value={selectedUser}
                                    onChange={e => setSelectedUser(e.target.value)}
                                    style={{ marginBottom: '8px' }}
                                >
                                    <option value="">Select User...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.full_name} ({u.position})
                                        </option>
                                    ))}
                                </select>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary w-100"
                                    onClick={handleAddApprover}
                                    disabled={!selectedUser}
                                >
                                    + Add Approver
                                </button>
                            </div>

                        </div>
                    </div>

                    <div className="form-actions" style={{ marginTop: '2rem' }}>
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={() => navigate('/inbox')}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={loading || approvers.length === 0}
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestPage;
