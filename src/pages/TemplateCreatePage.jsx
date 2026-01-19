import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const TemplateCreatePage = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [activeTab, setActiveTab] = useState('form'); // 'form' or 'workflow'
    const [editorMode, setEditorMode] = useState('visual'); // 'visual' or 'json'
    const [loading, setLoading] = useState(false);

    // Default JSON Schemas
    const defaultFormSchema = JSON.stringify({
        title: "Default Form Title",
        fields: [
            { id: "reason", type: "text", label: "Reason" },
            { id: "amount", type: "number", label: "Amount" }
        ]
    }, null, 2);

    const defaultWorkflow = JSON.stringify({
        steps: [
            {
                seq: 1,
                name: "Manager Approval",
                approver_id: "550e8400-e29b-41d4-a716-446655440001",
                status: "pending",
                timestamp: null
            }
        ],
        current_step: 1
    }, null, 2);

    const [formSchema, setFormSchema] = useState(defaultFormSchema);
    const [workflowSnapshot, setWorkflowSnapshot] = useState(defaultWorkflow);
    const [builderFields, setBuilderFields] = useState([]);

    // Sync JSON to Visual Builder state on load or switch
    useEffect(() => {
        try {
            const parsed = JSON.parse(formSchema);
            if (parsed.fields && Array.isArray(parsed.fields)) {
                setBuilderFields(parsed.fields);
            }
        } catch (e) {
            // Ignore parse errors if in JSON mode, but standardizing state is good
        }
    }, []); // Run once on mount, later sync is manual on toggle

    const handleModeSwitch = (mode) => {
        if (mode === 'visual') {
            // JSON -> Visual
            try {
                const parsed = JSON.parse(formSchema);
                if (parsed.fields && Array.isArray(parsed.fields)) {
                    setBuilderFields(parsed.fields);
                }
                setEditorMode('visual');
            } catch (e) {
                alert("Invalid JSON. Fix syntax before switching to Visual Builder.");
            }
        } else {
            // Visual -> JSON
            // Reconstruct JSON from builderFields
            try {
                const currentJSON = JSON.parse(formSchema);
                currentJSON.fields = builderFields;
                setFormSchema(JSON.stringify(currentJSON, null, 2));
                setEditorMode('json');
            } catch(e) {
                // If formSchema was broken, ignore, just use default wrapper
                const newJSON = { title: name || "Form Request", fields: builderFields };
                setFormSchema(JSON.stringify(newJSON, null, 2));
                setEditorMode('json');
            }
        }
    };

    // Builder Actions
    const addField = (type) => {
        const newField = { 
            id: `field_${Date.now()}`, 
            type: type, 
            label: `New ${type} Field` 
        };
        const newFields = [...builderFields, newField];
        setBuilderFields(newFields);
        
        // Auto-sync to JSON for background
        updateJsonFromFields(newFields);
    };

    const updateField = (index, key, value) => {
        const newFields = [...builderFields];
        newFields[index][key] = value;
        setBuilderFields(newFields);
        updateJsonFromFields(newFields);
    };

    const removeField = (index) => {
        const newFields = builderFields.filter((_, i) => i !== index);
        setBuilderFields(newFields);
        updateJsonFromFields(newFields);
    };

    const updateJsonFromFields = (fields) => {
        try {
            const currentJSON = JSON.parse(formSchema);
            currentJSON.fields = fields;
            setFormSchema(JSON.stringify(currentJSON, null, 2));
        } catch (e) {
            const newJSON = { title: name || "Form Request", fields: fields };
            setFormSchema(JSON.stringify(newJSON, null, 2));
        }
    };

    const handleSubmit = async () => {
        if (!name) {
            alert('Please enter a template name');
            return;
        }

        try {
            setLoading(true);
            
            const parsedForm = JSON.parse(formSchema);
            const parsedWorkflow = JSON.parse(workflowSnapshot);

            const payload = {
                name,
                description,
                form_schema: parsedForm,
                workflow_snapshot: parsedWorkflow
            };

            await api.post('/templates', payload);

            navigate('/templates');
        } catch (err) {
            console.error(err);
            alert(`Failed to create template: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1>Create New Template</h1>
                    <p className="subtitle">Design your approval form and workflow.</p>
                </div>
            </header>

            <div className="detail_container" style={{ display: 'block' }}>
                <div className="card">
                    <h2>Basic Information</h2>
                    <div className="form-field">
                        <label className="form-label">Template Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="e.g., Equipment Purchase Request"
                        />
                    </div>
                    <div className="form-field">
                        <label className="form-label">Description</label>
                        <input 
                            type="text" 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="Short description of this workflow"
                        />
                    </div>
                </div>

                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                        <button 
                            className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
                            onClick={() => setActiveTab('form')}
                            style={tabStyle(activeTab === 'form')}
                        >
                            Form Builder
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'workflow' ? 'active' : ''}`}
                            onClick={() => setActiveTab('workflow')}
                            style={tabStyle(activeTab === 'workflow')}
                        >
                            Workflow Definition
                        </button>
                    </div>

                    <div style={{ padding: '0' }}>
                        {activeTab === 'form' && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '10px 20px', display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.1)', borderBottom: '1px solid var(--border-subtle)', justifyContent: 'flex-end' }}>
                                    <button 
                                        onClick={() => handleModeSwitch('visual')}
                                        style={toggleStyle(editorMode === 'visual')}
                                    >
                                        Visual
                                    </button>
                                    <button 
                                        onClick={() => handleModeSwitch('json')}
                                        style={toggleStyle(editorMode === 'json')}
                                    >
                                        JSON
                                    </button>
                                </div>

                                {editorMode === 'json' ? (
                                    <textarea 
                                        className="code-editor" 
                                        value={formSchema}
                                        onChange={(e) => setFormSchema(e.target.value)}
                                        style={{ border: 'none', borderRadius: 0, minHeight: '500px' }}
                                    />
                                ) : (
                                    <div style={{ padding: '2rem' }}>
                                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                                            <button className="btn-primary" onClick={() => addField('text')}>+ Text Field</button>
                                            <button className="btn-primary" onClick={() => addField('number')}>+ Number Field</button>
                                            <button className="btn-primary" onClick={() => addField('date')}>+ Date Field</button>
                                        </div>

                                        <div className="builder-fields" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {builderFields.map((field, index) => (
                                                <div key={index} style={{ 
                                                    background: 'var(--bg-app)', 
                                                    border: '1px solid var(--border-subtle)', 
                                                    padding: '1rem', 
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    gap: '1rem',
                                                    alignItems: 'center'
                                                }}>
                                                    <div style={{ padding: '4px 8px', background: 'var(--bg-surface)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        {field.type.toUpperCase()}
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Label</label>
                                                            <input 
                                                                type="text" 
                                                                value={field.label} 
                                                                onChange={(e) => updateField(index, 'label', e.target.value)}
                                                            />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Field ID</label>
                                                            <input 
                                                                type="text" 
                                                                value={field.id} 
                                                                onChange={(e) => updateField(index, 'id', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => removeField(index)}
                                                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                            {builderFields.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No fields added.</div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'workflow' && (
                            <textarea 
                                className="code-editor" 
                                value={workflowSnapshot}
                                onChange={(e) => setWorkflowSnapshot(e.target.value)}
                                style={{ border: 'none', borderRadius: 0, minHeight: '500px' }}
                            />
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-subtle)' }} onClick={() => navigate('/templates')}>
                        Cancel
                    </button>
                    <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Template'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const tabStyle = (isActive) => ({
    padding: '16px 24px', 
    background: 'transparent', 
    border: 'none',
    borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
    color: isActive ? 'white' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontWeight: '600'
});

const toggleStyle = (isActive) => ({
    padding: '6px 12px',
    background: isActive ? 'var(--accent-primary)' : 'transparent',
    color: isActive ? 'white' : 'var(--text-secondary)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem'
});

export default TemplateCreatePage;
