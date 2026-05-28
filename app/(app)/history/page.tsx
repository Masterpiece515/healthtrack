'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Footprints, Moon, Heart, Weight, Trash2, Pencil,
  Check, X, ChevronDown, ChevronUp, ClipboardList,
} from '@/components/icons';
import { AddMetricForm } from '@/components/dashboard/AddMetricForm';
import { useToast } from '@/lib/toast-context';
import type { HealthEntry } from '@/lib/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function pluralRecords(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'запись';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'записи';
  return 'записей';
}

function EmptyHistory({ onAdd }: { onAdd: (score: number) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-20 h-20 bg-[#6b8dd6]/10 rounded-3xl flex items-center justify-center mb-6">
        <ClipboardList className="w-10 h-10 text-[#6b8dd6]" />
      </div>
      <h3 className="text-xl font-bold text-[#1a1e5e] mb-2">Нет записей</h3>
      <p className="text-[#4a5a8a] mb-6 max-w-xs">Начните вести дневник здоровья — добавьте первую запись</p>
      <AddMetricForm onSuccess={onAdd} />
    </motion.div>
  );
}

interface RowProps {
  entry: HealthEntry;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<HealthEntry>) => Promise<void>;
}

function EntryRow({ entry, onDelete, onUpdate }: RowProps) {
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    steps:      String(entry.steps),
    sleepHours: String(entry.sleepHours),
    heartRate:  String(entry.heartRate),
    weight:     String(entry.weight),
    calories:   String(entry.calories ?? ''),
    notes:      entry.notes ?? '',
  });

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(entry.id, {
      steps:      Number(form.steps),
      sleepHours: Number(form.sleepHours),
      heartRate:  Number(form.heartRate),
      weight:     Number(form.weight),
      calories:   form.calories ? Number(form.calories) : undefined,
      notes:      form.notes || undefined,
    });
    setSaving(false);
    setEditing(false);
  };

  const metrics = [
    { icon: Footprints, value: entry.steps.toLocaleString('ru-RU'), unit: 'шаг', color: '#6b8dd6' },
    { icon: Moon,       value: String(entry.sleepHours),            unit: 'ч',   color: '#93b4e8' },
    { icon: Heart,      value: String(entry.heartRate),             unit: 'уд',  color: '#4a5a8a' },
    { icon: Weight,     value: String(entry.weight),                unit: 'кг',  color: '#eef2ff' },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: deleting ? 0 : 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl overflow-hidden border border-[#c5d3f0]/20 shadow-sm"
    >
      {/* Заголовок строки */}
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="font-semibold text-[#1a1e5e]">{formatDate(entry.date)}</p>
          {entry.notes && !editing && (
            <p className="text-xs text-[#4a5a8a] mt-0.5 truncate max-w-[140px] sm:max-w-[200px]">{entry.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <button
                onClick={handleSave} disabled={saving}
                className="p-2 rounded-xl bg-[#6b8dd6]/20 text-[#6b8dd6] hover:bg-[#6b8dd6]/40 transition-colors disabled:opacity-50"
              ><Check className="w-4 h-4" /></button>
              <button
                onClick={() => setEditing(false)}
                className="p-2 rounded-xl bg-[#c5d3f0]/20 text-[#4a5a8a] hover:bg-[#c5d3f0]/40 transition-colors"
              ><X className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-xl text-[#4a5a8a] hover:bg-[#6b8dd6]/10 hover:text-[#6b8dd6] transition-colors"
              ><Pencil className="w-4 h-4" /></button>
              <button
                onClick={() => { setDeleting(true); onDelete(entry.id); }}
                className="p-2 rounded-xl text-[#4a5a8a] hover:bg-red-500/10 hover:text-red-500 transition-colors"
              ><Trash2 className="w-4 h-4" /></button>
            </>
          )}
        </div>
      </div>

      {/* Метрики / форма редактирования */}
      {!editing ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#c5d3f0]/15 border-t border-[#c5d3f0]/20">
          {metrics.map(m => {
            const Icon = m.icon;
            return (
              <div key={m.unit} className="bg-white px-4 py-3 flex items-center gap-2">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: m.color }} />
                <span className="font-semibold text-[#1a1e5e] text-sm">{m.value}</span>
                <span className="text-xs text-[#4a5a8a]">{m.unit}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 pb-5 pt-3 border-t border-[#c5d3f0]/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'steps',      label: 'Шаги',     type: 'number', step: undefined },
              { key: 'sleepHours', label: 'Сон (ч)',  type: 'number', step: '0.1'    },
              { key: 'heartRate',  label: 'Пульс',    type: 'number', step: undefined },
              { key: 'weight',     label: 'Вес (кг)', type: 'number', step: '0.1'    },
              { key: 'calories',   label: 'Калории',  type: 'number', step: undefined },
              { key: 'notes',      label: 'Заметки',  type: 'text',   step: undefined },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-[#4a5a8a] mb-1 block">{f.label}</label>
                <input
                  type={f.type} step={f.step}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3 py-3 sm:py-2 text-sm bg-white border border-[#c5d3f0]/40 rounded-xl
                             text-[#1a1e5e] focus:outline-none focus:border-[#6b8dd6] transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function HistoryPage() {
  const [entries,  setEntries]  = useState<HealthEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sortDesc, setSortDesc] = useState(true);
  const { toast } = useToast();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/health');
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      toast('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleDelete = async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    try {
      const res = await fetch(`/api/health/${id}`, { method: 'DELETE' });
      if (!res.ok) { await fetchEntries(); toast('Не удалось удалить запись', 'error'); }
      else toast('Запись удалена', 'success');
    } catch {
      await fetchEntries();
      toast('Ошибка удаления', 'error');
    }
  };

  const handleUpdate = async (id: string, data: Partial<HealthEntry>) => {
    try {
      const res = await fetch(`/api/health/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error ?? 'Ошибка обновления', 'error');
      } else {
        await fetchEntries();
        toast('Запись обновлена', 'success');
      }
    } catch {
      toast('Ошибка обновления', 'error');
    }
  };

  const handleAdd = () => { fetchEntries(); toast('Запись добавлена', 'success'); };

  const sorted = [...entries].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    return sortDesc ? -diff : diff;
  });

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1e5e] mb-1">История</h1>
            <p className="text-[#4a5a8a]">
              {loading ? 'Загрузка...' : `${entries.length} ${pluralRecords(entries.length)}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSortDesc(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c5d3f0]/30
                         rounded-xl text-sm text-[#4a5a8a] hover:text-[#1a1e5e] transition-colors"
            >
              {sortDesc ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              {sortDesc ? 'Новые сначала' : 'Старые сначала'}
            </button>
            <AddMetricForm onSuccess={handleAdd} />
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <EmptyHistory onAdd={handleAdd} />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {sorted.map(entry => (
              <EntryRow key={entry.id} entry={entry} onDelete={handleDelete} onUpdate={handleUpdate} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
