import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errMsg = await response.text();
                throw new Error(errMsg || 'Login failed');
            }

            const data = await response.json();
            login(data.user, data.token);
            navigate('/');
        } catch (err) {
            setError('Invalid credentials');
            console.error(err);
        }
    };

    return (
        <div style={{ 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            height: '100vh', background: 'var(--bg-app)' 
        }}>
            <div className="card" style={{ width: '400px', padding: '40px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>pxm</h1>
                <h2 style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '32px', color: 'var(--text-secondary)' }}>Sign in to your account</h2>
                
                {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label className="form-label">Email</label>
                        <input 
                            type="email" 
                            className="form-input" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@pxm.com"
                        />
                    </div>
                    <div className="form-field" style={{ marginTop: '16px' }}>
                        <label className="form-label">Password</label>
                        <input 
                            type="password" 
                            className="form-input" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="password123"
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }}>
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
