import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar.jsx';
import SkillList from './components/SkillList.jsx';
import SkillEditor from './components/SkillEditor.jsx';
import ConfigPanel from './components/ConfigPanel.jsx';
import NewSkillModal from './components/NewSkillModal.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [config, setConfig] = useState(null);
  const [view, setView] = useState('skills'); // skills | editor | config
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSkills = useCallback(async () => {
    try {
      const list = await window.api.skills.list();
      setSkills(list);
    } catch (e) {
      showToast('Failed to load skills', 'error');
    }
  }, []);

  const loadProjects = useCallback(async () => {
    const list = await window.api.projects.list();
    setProjects(list);
  }, []);

  const loadConfig = useCallback(async () => {
    const cfg = await window.api.config.load();
    setConfig(cfg);
  }, []);

  useEffect(() => {
    loadSkills();
    loadProjects();
    loadConfig();
  }, [loadSkills, loadProjects, loadConfig]);

  const handleSelectSkill = (name) => {
    setSelectedSkill(name);
    setView('editor');
  };

  const handleBack = () => {
    setSelectedSkill(null);
    setView('skills');
    loadSkills();
  };

  const handleCreateSkill = async (name, description, content) => {
    try {
      await window.api.skills.create(name, content, { description });
      showToast(`Created "${name}"`);
      setShowNewModal(false);
      loadSkills();
    } catch (e) {
      showToast(e.message || 'Failed to create skill', 'error');
    }
  };

  const handleRemoveSkill = async (name) => {
    try {
      await window.api.skills.remove(name);
      showToast(`Removed "${name}"`);
      if (selectedSkill === name) handleBack();
      else loadSkills();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleSync = async (target) => {
    try {
      const opts = target ? { target } : {};
      const results = await window.api.sync.run(opts);
      showToast(`Synced to ${results.length} target(s)`);
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleAddProject = async () => {
    const dir = await window.api.dialog.openDirectory();
    if (dir) {
      await window.api.projects.add(dir);
      loadProjects();
      showToast(`Added project: ${dir.split('/').pop()}`);
    }
  };

  const handleRemoveProject = async (dir) => {
    await window.api.projects.remove(dir);
    loadProjects();
  };

  return (
    <div className="app">
      <Sidebar
        skills={skills}
        projects={projects}
        selectedSkill={selectedSkill}
        view={view}
        onSelectSkill={handleSelectSkill}
        onSetView={setView}
        onAddProject={handleAddProject}
        onNewSkill={() => setShowNewModal(true)}
      />
      <div className="main">
        {view === 'skills' && (
          <SkillList
            skills={skills}
            config={config}
            onSelect={handleSelectSkill}
            onRemove={handleRemoveSkill}
            onSync={handleSync}
            onNew={() => setShowNewModal(true)}
          />
        )}
        {view === 'editor' && selectedSkill && (
          <SkillEditor
            name={selectedSkill}
            onBack={handleBack}
            onSave={() => { loadSkills(); showToast('Saved'); }}
            onRemove={() => handleRemoveSkill(selectedSkill)}
            showToast={showToast}
          />
        )}
        {view === 'config' && (
          <ConfigPanel
            config={config}
            projects={projects}
            onReload={loadConfig}
            onAddProject={handleAddProject}
            onRemoveProject={handleRemoveProject}
            showToast={showToast}
          />
        )}
      </div>
      {showNewModal && (
        <NewSkillModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateSkill}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
