import React, { useState } from 'react';

export default function NewSkillModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description, content);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>New Skill</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="my-skill" autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="What this skill does" />
          </div>
          <div className="form-group">
            <label>Content (Markdown)</label>
            <textarea rows={6} value={content} onChange={e => setContent(e.target.value)} placeholder="Skill instructions..." />
          </div>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary" disabled={!name.trim()}>Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
