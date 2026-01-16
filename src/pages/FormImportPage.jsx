import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const FormImportPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId');
  
  // 기본 예시 JSON
  const defaultJson = JSON.stringify({
    title: "노트북 구매 요청",
    requester_id: "550e8400-e29b-41d4-a716-446655440000",
    form_data: {
      items: [
        { name: "MacBook Pro", price: 3500000 },
        { name: "Magic Mouse", price: 100000 }
      ],
      reason: "개발 업무용 장비 교체 필요",
      department: "IT Dev Team"
    },
    flow_process: {
      steps: [
        {
          seq: 1,
          name: "팀장 승인",
          approver_id: "550e8400-e29b-41d4-a716-446655440001",
          status: "pending",
          timestamp: null
        },
        {
          seq: 2,
          name: "CTO 승인",
          approver_id: "550e8400-e29b-41d4-a716-446655440002",
          status: "pending",
          timestamp: null
        }
      ],
      current_step: 1
    }
  }, null, 2);

  const [jsonInput, setJsonInput] = useState(defaultJson);
  const [formData, setFormData] = useState({});
  const [formFields, setFormFields] = useState([]);
  const [templateName, setTemplateName] = useState("");
  const [workflowSnapshot, setWorkflowSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
                    // Fallback to JSON mode if no schema fields
                    setFormFields([]);
                }

                // Still populate JSON input for debug/fallback or legacy logic
                // ... (existing logic for newJson could be kept or synced)
                
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
          // Construct payload from Visual Form Data
          payload = {
              title: `${templateName} - ${new Date().toLocaleDateString()}`,
              requester_id: "550e8400-e29b-41d4-a716-446655440000", // Default requester
              form_data: formData, // The actual data from inputs
              flow_process: workflowSnapshot
          };
      } else {
          // Use Raw JSON Input
          payload = JSON.parse(jsonInput);
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
