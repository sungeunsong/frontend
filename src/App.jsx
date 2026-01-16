import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import InboxPage from './pages/InboxPage';
import ApprovalDetailPage from './pages/ApprovalDetailPage';
import FormImportPage from './pages/FormImportPage';
import TemplateListPage from './pages/TemplateListPage';
import TemplateCreatePage from './pages/TemplateCreatePage';
import './App.css';

function App() {
  return (
    <Router>
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
        </nav>
        
        {/* Main Content Area */}
        <main className="main_content">
          <Routes>
            <Route path="/" element={<InboxPage />} />
            <Route path="/new" element={<FormImportPage />} />
            <Route path="/approvals/:id" element={<ApprovalDetailPage />} />
            <Route path="/templates" element={<TemplateListPage />} />
            <Route path="/templates/new" element={<TemplateCreatePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;