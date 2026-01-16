import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FormImportPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId');
  const { user } = useAuth();
  
  const [jsonInput, setJsonInput] = useState("");
  const [formData, setFormData] = useState({});
  const [formFields, setFormFields] = useState([]);
  const [templateName, setTemplateName] = useState("");
  const [workflowSnapshot, setWorkflowSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [managerInfo, setManagerInfo] = useState(null);

  // Fetch Manager Info on Load
  useEffect(() => {
    if (user?.id) {
        fetch(`/api/org/my-manager/${user.id}`)
            .then(res => {
                if(res.ok) return res.json();
                console.warn("No manager found for user");
                return null;
            })
            .then(data => setManagerInfo(data))
            .catch(err => console.error("Failed to fetch manager", err));
    }
  }, [user]);

  // Load Template
  useEffect(() => {
    if (templateId) {
        setLoading(true);
        fetch(`/api/templates/${templateId}`)
            .then(res => res.json())
            .then(template => {
                setTemplateName(template.name);
                setWorkflowSnapshot(template.workflow_snapshot);

                // Setup visual form if schema exists
                if (template.form_schema && template.form_schema.fields) {
                    setFormFields(template.form_schema.fields);
                    const initialData = {};
                    template.form_schema.fields.forEach(field => {
                        initialData[field.id] = "";
                    });
                    setFormData(initialData);
                } else {
                    setFormFields([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load template:", err);
                setError("Failed to load template definition.");
                setLoading(false);
            });
    }
  }, [templateId]);

  const handleInputChange = (id, value) => {
      setFormData(prev => ({
          ...prev,
          [id]: value
      }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let payload;

      if (templateId && formFields.length > 0) {
          // Clone workflow to modify it
          let finalWorkflow = JSON.parse(JSON.stringify(workflowSnapshot));
          
          // Auto-assign Manager to Step 1 (MVP Logic)
          // If we have manager info, and the first step is pending, assign it.
          if (managerInfo && finalWorkflow.steps.length > 0) {
              // Assume Step 1 is Manager Approval for now.
              // In future, check step role requirements.
              finalWorkflow.steps[0].approver_id = managerInfo.manager_id;
          }

          payload = {
              title: `${templateName} - ${user?.full_name} (${new Date().toLocaleDateString()})`,
              requester_id: user?.id || "anonymous", 
              form_data: formData,
              flow_process: finalWorkflow 
          };
      } else {
          // Use Raw JSON Input
          payload = JSON.parse(jsonInput || "{}");
          // Overwrite requester if authenticated
          if (user?.id) payload.requester_id = user.id;
      }
      
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      console.log('Success:', result);
      navigate('/');
      
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Invalid Data or Server Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>{templateId ? `New Request: ${templateName}` : 'New Approval Request'}</h1>
        <p className="subtitle">Fill out the details below to submit your request.</p>
      </header>

      {templateId && formFields.length > 0 ? (
          // Visual Form Renderer
          <div className="detail_container" style={{ display: 'block', maxWidth: '800px' }}>
             <div className="card">
                <h2>Request Details</h2>
                {formFields.map(field => (
                    <div key={field.id} className="form-field">
                        <label className="form-label">{field.label}</label>
                        <input 
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            value={formData[field.id] || ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            placeholder={`Enter ${field.label}`}
                            style={{ width: '100%' }}
                        />
                    </div>
                ))}
            </div>
             <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button 
                    className="btn-primary" 
                    onClick={handleSubmit} 
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit Request'}
                </button>
                {error && <div className="error-msg" style={{ marginTop: '10px' }}>{error}</div>}
             </div>
          </div>
      ) : (
          // Raw JSON Editor Fallback
          <div className="json-editor-container">
            <div className="editor-controls">
              <button 
                className="btn-primary" 
                onClick={handleSubmit} 
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              {error && <span className="error-msg">{error}</span>}
            </div>
            
            <textarea
              className="code-editor"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              spellCheck="false"
            />
          </div>
      )}
    </div>
  );
};

export default FormImportPage;
