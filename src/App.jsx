import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import InboxPage from './pages/InboxPage';
import ApprovalDetailPage from './pages/ApprovalDetailPage';
import FormImportPage from './pages/FormImportPage';
import TemplateListPage from './pages/TemplateListPage';
import TemplateCreatePage from './pages/TemplateCreatePage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();
    const location = useLocation();

    if (!token) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <LoginPage />;
    }

    return children;
};

const Layout = ({ children }) => {
    const { logout, user } = useAuth();
    
    // Parse user from local storage if state is empty on refresh (simple fix)
    const displayUser = user || JSON.parse(localStorage.getItem('user') || '{}');

    return (
      <div className="app_layout">
        {/* Sidebar */}
        <nav className="sidebar">
          <div className="sidebar_logo">pxm</div>
          
          <div className="sidebar_menu">
            <NavLink to="/new" className={({ isActive }) => isActive ? "menu_item active" : "menu_item"}>
              <span className="icon">＋</span>
              <span className="label">New Request</span>
            </NavLink>
            
            <NavLink to="/" className={({ isActive }) => isActive ? "menu_item active" : "menu_item"} end>
              <span className="icon">📥</span>
              <span className="label">Inbox</span>
            </NavLink>

            <NavLink to="/templates" className={({ isActive }) => isActive ? "menu_item active" : "menu_item"}>
              <span className="icon">📄</span>
              <span className="label">Templates</span>
            </NavLink>
          </div>

          <div style={{ marginTop: 'auto', padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{displayUser.email}</div>
              <button 
                onClick={logout}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, marginTop: '8px', fontSize: '0.8rem' }}
              >
                  Sign Out
              </button>
          </div>
        </nav>
        
        {/* Main Content Area */}
        <main className="main_content">
          {children}
        </main>
      </div>
    );
};

function App() {
  return (
    <Router>
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/*" element={
                    <ProtectedRoute>
                        <Layout>
                            <Routes>
                                <Route path="/" element={<InboxPage />} />
                                <Route path="/new" element={<FormImportPage />} />
                                <Route path="/approvals/:id" element={<ApprovalDetailPage />} />
                                <Route path="/templates" element={<TemplateListPage />} />
                                <Route path="/templates/new" element={<TemplateCreatePage />} />
                            </Routes>
                        </Layout>
                    </ProtectedRoute>
                } />
            </Routes>
        </AuthProvider>
    </Router>
  );
}

export default App;