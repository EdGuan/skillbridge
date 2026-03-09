import React, { useState } from 'react';

export default function ConfigPanel({ config, projects, onReload, onAddProject, onRemoveProject, showToast }) {
  const targets = config?.targets || {};

  const handleToggle = async (name, field, value) => {
    await window.api.config.set(`targets.${name}.${field}`, value);
    onReload();
  };

  const handlePathChange = async (name, value) => {
    await window.api.config.set(`targets.${name}.globalPath`, value);
    onReload();
    showToast(`Updated ${name} path`);
  };

  return (
    <>
      <div className="main-header">
        <h2>Settings</h2>
      </div>
      <div className="main-content">
        <div className="config-section">
          <h3>Sync Targets</h3>
          {Object.entries(targets).map(([name, t]) => (
            <div key={name}>
              <div className="config-row">
                <label style={{ fontWeight: 600 }}>{name}</label>
                <label style={{ minWidth: 'auto', fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={t.enabled}
                    onChange={e => handleToggle(name, 'enabled', e.target.checked)}
                  /> Enabled
                </label>
              </div>
              <div className="config-row">
                <label>Path</label>
                <input
                  type="text"
                  defaultValue={t.globalPath}
                  onBlur={e => {
                    if (e.target.value !== t.globalPath) handlePathChange(name, e.target.value);
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="config-section">
          <h3>Tracked Projects</h3>
          {projects.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No projects tracked yet.</p>}
          {projects.map(p => (
            <div key={p} className="project-item">
              <span className="path">{p}</span>
              <button className="ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => onRemoveProject(p)}>Remove</button>
            </div>
          ))}
          <button className="ghost" style={{ marginTop: 8 }} onClick={onAddProject}>+ Add Project Directory</button>
        </div>
      </div>
    </>
  );
}
