import React, { useState } from 'react';
import { Trash2, Pencil, Plus, RotateCcw, Undo2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import type { Person, HistoryEntry, Settings } from '../types';

interface RosterSectionProps {
  kind: 'contestant' | 'judge';
  people: Person[];
  history: HistoryEntry[];
  onAdd: (name: string) => string | null;
  onEdit: (id: string, name: string) => string | null;
  onRemove: (id: string) => void;
  onUndo: () => void;
  onReset: () => void;
}

const RosterSection: React.FC<RosterSectionProps> = ({
  kind, people, history, onAdd, onEdit, onRemove, onUndo, onReset,
}) => {
  const [addName, setAddName] = useState('');
  const [addError, setAddError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const title = kind === 'contestant' ? 'Contestants' : 'Evaluation';
  const kindLabel = kind === 'contestant' ? 'contestant' : 'evaluation';
  const selected = people.filter(p => p.selected).length;
  const confirmRemovePerson = people.find(p => p.id === confirmRemoveId);

  const handleAdd = () => {
    const err = onAdd(addName);
    if (err) { setAddError(err); return; }
    setAddName(''); setAddError('');
  };

  const startEdit = (p: Person) => {
    setEditId(p.id); setEditName(p.name); setEditError('');
  };

  const handleEdit = () => {
    if (!editId) return;
    const err = onEdit(editId, editName);
    if (err) { setEditError(err); return; }
    setEditId(null); setEditName(''); setEditError('');
  };

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '1.5rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {people.length} total · {selected} selected · {people.length - selected} remaining
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onUndo}
            disabled={history.length === 0}
            aria-label="Undo last selection"
            style={secondaryBtnStyle(history.length === 0)}
            title="Undo last selection"
          >
            <Undo2 size={14} />
            <span>Undo</span>
          </button>
          <button
            onClick={() => setConfirmReset(true)}
            aria-label={`Reset ${title}`}
            style={secondaryBtnStyle(false)}
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* People list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
        {people.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.6rem 0.75rem',
              background: p.selected ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
              borderRadius: '6px',
              border: `1px solid ${p.selected ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)'}`,
            }}
          >
            {editId === p.id ? (
              <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  value={editName}
                  onChange={e => { setEditName(e.target.value); setEditError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') { setEditId(null); setEditError(''); } }}
                  autoFocus
                  style={inputStyle}
                  aria-label="Edit name"
                />
                <button onClick={handleEdit} style={actionBtn('var(--gold)', '#080A0F')}>Save</button>
                <button onClick={() => { setEditId(null); setEditError(''); }} style={actionBtn('transparent', 'var(--text-muted)')}>Cancel</button>
                {editError && <span style={errorStyle}>{editError}</span>}
              </div>
            ) : (
              <>
                <span
                  style={{
                    flex: 1,
                    fontSize: '0.85rem',
                    color: p.selected ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: p.selected ? 'line-through' : 'none',
                    textDecorationColor: 'rgba(139,145,156,0.5)',
                  }}
                >
                  {p.name}
                </span>
                {p.selected && (
                  <span
                    style={{
                      fontSize: '0.6rem',
                      color: 'var(--gold)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Selected
                  </span>
                )}
                <button
                  onClick={() => startEdit(p)}
                  aria-label={`Edit ${p.name}`}
                  style={iconBtn}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setConfirmRemoveId(p.id)}
                  aria-label={`Remove ${p.name}`}
                  style={{ ...iconBtn, color: '#e57373' }}
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add person */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          value={addName}
          onChange={e => { setAddName(e.target.value); setAddError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          placeholder={`Add ${kindLabel}…`}
          style={{ ...inputStyle, flex: 1 }}
          aria-label={`Add new ${kindLabel} name`}
        />
        <button
          onClick={handleAdd}
          aria-label={`Add ${kindLabel}`}
          style={actionBtn('var(--gold)', '#080A0F')}
        >
          <Plus size={14} />
          Add
        </button>
      </div>
      {addError && <p style={{ ...errorStyle, marginTop: '0.4rem' }}>{addError}</p>}

      {/* Reset confirmation modal */}
      <Modal isOpen={confirmReset} onClose={() => setConfirmReset(false)} title={`Reset ${title}`}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          This will restore all {kind === 'contestant' ? '7 original contestants' : '4 original evaluations'} and clear selection history.
          This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={() => setConfirmReset(false)} style={actionBtn('transparent', 'var(--text-muted)')}>
            Cancel
          </button>
          <button
            onClick={() => { onReset(); setConfirmReset(false); }}
            style={actionBtn('#c0392b', '#fff')}
          >
            Reset {title}
          </button>
        </div>
      </Modal>

      {/* Remove confirmation modal */}
      <Modal
        isOpen={!!confirmRemoveId}
        onClose={() => setConfirmRemoveId(null)}
        title="Remove Person"
      >
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Remove <strong style={{ color: 'var(--text-primary)' }}>{confirmRemovePerson?.name}</strong> from {title}?
          Their history entry will be preserved.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={() => setConfirmRemoveId(null)} style={actionBtn('transparent', 'var(--text-muted)')}>
            Cancel
          </button>
          <button
            onClick={() => {
              if (confirmRemoveId) onRemove(confirmRemoveId);
              setConfirmRemoveId(null);
            }}
            style={actionBtn('#c0392b', '#fff')}
          >
            Remove
          </button>
        </div>
      </Modal>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
interface DashboardProps {
  contestantPeople: Person[];
  contestantHistory: HistoryEntry[];
  judgePeople: Person[];
  judgeHistory: HistoryEntry[];
  settings: Settings;
  onAddContestant: (name: string) => string | null;
  onEditContestant: (id: string, name: string) => string | null;
  onRemoveContestant: (id: string) => void;
  onUndoContestant: () => void;
  onResetContestants: () => void;
  onAddJudge: (name: string) => string | null;
  onEditJudge: (id: string, name: string) => string | null;
  onRemoveJudge: (id: string) => void;
  onUndoJudge: () => void;
  onResetJudges: () => void;
  onResetEntireEvent: () => void;
  onUpdateSettings: (partial: Partial<Settings>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  contestantPeople, contestantHistory,
  judgePeople, judgeHistory,
  settings,
  onAddContestant, onEditContestant, onRemoveContestant, onUndoContestant, onResetContestants,
  onAddJudge, onEditJudge, onRemoveJudge, onUndoJudge, onResetJudges,
  onResetEntireEvent, onUpdateSettings,
}) => {
  const [confirmResetEvent, setConfirmResetEvent] = useState(false);
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSaveSettings = () => {
    onUpdateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '1.8rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.25rem',
          }}
        >
          Control Panel
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
          Manage contestants, judges, and event settings
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Contestants */}
        <RosterSection
          kind="contestant"
          people={contestantPeople}
          history={contestantHistory}
          onAdd={onAddContestant}
          onEdit={onEditContestant}
          onRemove={onRemoveContestant}
          onUndo={onUndoContestant}
          onReset={onResetContestants}
        />

        {/* Judges */}
        <RosterSection
          kind="judge"
          people={judgePeople}
          history={judgeHistory}
          onAdd={onAddJudge}
          onEdit={onEditJudge}
          onRemove={onRemoveJudge}
          onUndo={onUndoJudge}
          onReset={onResetJudges}
        />
      </div>

      {/* Settings */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <h2
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '1.25rem',
          }}
        >
          Event Settings
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <SettingField label="Contest Name" value={form.contestName} onChange={v => setForm(f => ({ ...f, contestName: v }))} />
          <SettingField label="Club Name (optional)" value={form.clubName} onChange={v => setForm(f => ({ ...f, clubName: v }))} />
          <SettingField label="Date (optional)" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
          <SettingField label="Venue (optional)" value={form.venue} onChange={v => setForm(f => ({ ...f, venue: v }))} />
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={handleSaveSettings} style={actionBtn('var(--gold)', '#080A0F')}>
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Reset entire event */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setConfirmResetEvent(true)}
          style={actionBtn('#c0392b', '#fff')}
        >
          Reset Entire Event
        </button>
      </div>

      <Modal isOpen={confirmResetEvent} onClose={() => setConfirmResetEvent(false)} title="Reset Entire Event">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          This will reset BOTH rosters and ALL history. Settings are preserved.
          This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={() => setConfirmResetEvent(false)} style={actionBtn('transparent', 'var(--text-muted)')}>
            Cancel
          </button>
          <button
            onClick={() => { onResetEntireEvent(); setConfirmResetEvent(false); }}
            style={actionBtn('#c0392b', '#fff')}
          >
            Reset Everything
          </button>
        </div>
      </Modal>
    </div>
  );
};

// ─── Small helpers ────────────────────────────────────────────────────────────
const SettingField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
      {label}
    </label>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      style={inputStyle}
      aria-label={label}
    />
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
  borderRadius: '5px',
  padding: '0.55rem 0.75rem',
  fontSize: '0.85rem',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
};

function secondaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.45rem 0.85rem',
    background: 'transparent',
    border: '1px solid var(--border-subtle)',
    color: disabled ? 'rgba(139,145,156,0.4)' : 'var(--text-muted)',
    borderRadius: '5px',
    fontSize: '0.72rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.05em',
  };
}

function actionBtn(bg: string, color: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.5rem 1rem',
    background: bg,
    color,
    border: `1px solid ${bg === 'transparent' ? 'var(--border-subtle)' : bg}`,
    borderRadius: '5px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap' as const,
  };
}

const iconBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
};

const errorStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#e57373',
};
