'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Loader2, CheckCircle } from '@/components/icons';
import type { HealthEntryInput, AddEntryResponse, ApiError } from '@/lib/types';

interface AddMetricFormProps {
  onSuccess?: (healthScore: number) => void;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

const DEFAULT_VALUES: HealthEntryInput = {
  date:       new Date().toISOString().split('T')[0],
  steps:      0,
  sleepHours: 8,
  heartRate:  70,
  weight:     70,
  calories:   undefined,
  notes:      '',
};

export function AddMetricForm({ onSuccess }: AddMetricFormProps) {
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState<HealthEntryInput>({ ...DEFAULT_VALUES });
  const [state, setState]     = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => { setState('idle'); setErrorMsg(''); setForm({ ...DEFAULT_VALUES }); }, 300);
  };

  const handleChange = (field: keyof HealthEntryInput, raw: string) => {
    const numFields = ['steps', 'sleepHours', 'heartRate', 'weight', 'calories'];
    setForm((prev) => ({
      ...prev,
      [field]: numFields.includes(field) ? (raw === '' ? undefined : Number(raw)) : raw,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err: ApiError = await res.json();
        throw new Error(err.error ?? 'Ошибка сервера');
      }
      const data: AddEntryResponse = await res.json();
      setState('success');
      onSuccess?.(data.healthScore);
      setTimeout(handleClose, 1500);
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Неизвестная ошибка');
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#6b8dd6] text-white text-sm font-semibold rounded-full shadow-sm hover:bg-[#5a7cc5] transition-colors"
      >
        <Plus className="w-4 h-4" />
        Добавить запись
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: 60, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#6b8dd6]/10">
                <div>
                  <h2 className="text-xl font-bold text-[#1a1e5e]">Добавить запись</h2>
                  <p className="text-sm text-[#4a5a8a] mt-0.5">Введите показатели за день</p>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleClose}
                  className="w-9 h-9 rounded-xl bg-[#eef2ff] hover:bg-[#c5d3f0] flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-[#4a5a8a]" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <Field label="Дата" required>
                  <input type="date" value={form.date} max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleChange('date', e.target.value)} required className={inputClass} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Field label="Шаги" required>
                    <input type="number" min={0} max={100000} placeholder="10 000"
                      value={form.steps || ''} onChange={(e) => handleChange('steps', e.target.value)} required className={inputClass} />
                  </Field>
                  <Field label="Сон (часов)" required>
                    <input type="number" min={0} max={24} step={0.5} placeholder="8"
                      value={form.sleepHours || ''} onChange={(e) => handleChange('sleepHours', e.target.value)} required className={inputClass} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Field label="Пульс (уд/мин)" required>
                    <input type="number" min={30} max={250} placeholder="70"
                      value={form.heartRate || ''} onChange={(e) => handleChange('heartRate', e.target.value)} required className={inputClass} />
                  </Field>
                  <Field label="Вес (кг)" required>
                    <input type="number" min={20} max={300} step={0.1} placeholder="70"
                      value={form.weight || ''} onChange={(e) => handleChange('weight', e.target.value)} required className={inputClass} />
                  </Field>
                </div>

                <Field label="Калории (необязательно)">
                  <input type="number" min={0} max={10000} placeholder="2000"
                    value={form.calories ?? ''} onChange={(e) => handleChange('calories', e.target.value)} className={inputClass} />
                </Field>

                <Field label="Заметки (необязательно)">
                  <textarea rows={2} placeholder="Как прошёл день..." value={form.notes ?? ''}
                    onChange={(e) => handleChange('notes', e.target.value)} className={`${inputClass} resize-none`} />
                </Field>

                <AnimatePresence>
                  {state === 'error' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                      {errorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button type="submit" disabled={state === 'loading' || state === 'success'}
                  whileHover={state === 'idle' ? { scale: 1.02 } : {}}
                  whileTap={state === 'idle' ? { scale: 0.98 } : {}}
                  className="w-full py-3 rounded-full font-semibold text-white bg-[#6b8dd6] hover:bg-[#5a7cc5] disabled:opacity-70 transition-colors flex items-center justify-center gap-2">
                  {state === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {state === 'success' && <CheckCircle className="w-4 h-4" />}
                  {state === 'loading' ? 'Сохраняем...' : state === 'success' ? 'Сохранено!' : 'Сохранить запись'}
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#1a1e5e]">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = 'w-full px-4 py-2.5 bg-[#f5f8ff] border border-[#6b8dd6]/20 rounded-xl text-[#1a1e5e] text-sm placeholder:text-[#c5d3f0] focus:outline-none focus:border-[#6b8dd6] focus:ring-2 focus:ring-[#6b8dd6]/15 transition-colors';
