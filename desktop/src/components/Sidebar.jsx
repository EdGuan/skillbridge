import React from 'react';

export default function Sidebar({ skills, projects, selectedSkill, view, onSelectSkill, onSetView, onAddProject, onNewSkill }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">⚡ SkillBridge</div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Global Skills</div>
        {skills.map(s => (
          <div
            key={s.name}
            className={`sidebar-item ${selectedSkill === s.name && view === 'editor' ? 'active' : ''}`}
            onClick={() => onSelectSkill(s.name)}
          >
            {s.name}
          </div>
        ))}
        {skills.length === 0 && (
          <div className="sidebar-item" style={{ color: 'var(--text-muted)', cursor: 'default' }}>No skills yet</div>
        )}
        <div className="sidebar-actions">
          <button className="ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={onNewSkill}>+ New Skill</button>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Projects</div>
        {projects.map(p => (
          <div key={p} className="sidebar-item" title={p}>
            📁 {p.split('/').pop()}
          </div>
        ))}
        <div className="sidebar-actions">
          <button className="ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={onAddProject}>+ Add Project</button>
        </div>
      </div>

      <div className="sidebar-nav">
        <div
          className={`sidebar-item ${view === 'skills' ? 'active' : ''}`}
          onClick={() => onSetView('skills')}
        >
          🏠 All Skills
        </div>
        <div
          className={`sidebar-item ${view === 'config' ? 'active' : ''}`}
          onClick={() => onSetView('config')}
        >
          ⚙️ Settings
        </div>
      </div>
    </div>
  );
}
