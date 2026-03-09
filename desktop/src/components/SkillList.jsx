import React from 'react';

export default function SkillList({ skills, config, onSelect, onRemove, onSync, onNew }) {
  const targets = config?.targets || {};

  return (
    <>
      <div className="main-header">
        <h2>Skills</h2>
        <div className="main-header-actions">
          <button className="ghost" onClick={() => onSync()}>⟳ Sync All</button>
          <button className="ghost" onClick={() => onSync('claude')}>Sync → Claude</button>
          <button className="ghost" onClick={() => onSync('codex')}>Sync → Codex</button>
          <button className="primary" onClick={onNew}>+ New Skill</button>
        </div>
      </div>
      <div className="main-content">
        {skills.length === 0 ? (
          <div className="empty-state">
            <h3>No skills yet</h3>
            <p>Create your first skill to get started.</p>
          </div>
        ) : (
          <div className="skill-grid">
            {skills.map(s => (
              <div key={s.name} className="skill-card" onClick={() => onSelect(s.name)}>
                <h3>{s.name}</h3>
                <p>{s.data?.description || 'No description'}</p>
                <div className="tags">
                  {Object.entries(targets).map(([name, t]) => (
                    <span key={name} className={`tag ${t.enabled ? 'active' : ''}`}>{name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
