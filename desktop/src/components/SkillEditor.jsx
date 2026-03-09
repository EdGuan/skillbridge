import React, { useState, useEffect } from 'react';

export default function SkillEditor({ name, onBack, onSave, onRemove, showToast }) {
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const skill = await window.api.skills.read(name);
        setContent(skill.content || '');
        setDescription(skill.data?.description || '');
      } catch (e) {
        showToast('Failed to load skill', 'error');
      }
      setLoading(false);
    })();
  }, [name]);

  const handleSave = async () => {
    try {
      await window.api.skills.update(name, content, { description });
      onSave();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading) return <div className="main-content"><p>Loading…</p></div>;

  return (
    <>
      <div className="main-header">
        <h2>
          <span style={{ cursor: 'pointer', color: 'var(--text-secondary)', marginRight: 8 }} onClick={onBack}>←</span>
          {name}
        </h2>
        <div className="main-header-actions">
          {confirmDelete ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--danger)' }}>Delete this skill?</span>
              <button className="danger" onClick={onRemove}>Yes, delete</button>
              <button className="ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button className="ghost" onClick={() => setConfirmDelete(true)}>🗑 Delete</button>
              <button className="primary" onClick={handleSave}>💾 Save</button>
            </>
          )}
        </div>
      </div>
      <div className="main-content">
        <div className="editor">
          <div className="editor-row">
            <label>
              Description
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of this skill"
              />
            </label>
          </div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Content (Markdown)</label>
          <textarea
            className="content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your skill content in markdown..."
          />
        </div>
      </div>
    </>
  );
}
