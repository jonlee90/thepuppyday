'use client';

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PriceAdjustment } from '@/stores/bookingStore';

interface PriceAdjustmentFormProps {
  adjustments: PriceAdjustment[];
  onAdd: (adj: Omit<PriceAdjustment, 'id'>) => void;
  onRemove: (id: string) => void;
}

export const PriceAdjustmentForm = memo(function PriceAdjustmentForm({
  adjustments,
  onAdd,
  onRemove,
}: PriceAdjustmentFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: '', amount: '', isDiscount: false, note: '' });

  const handleAdd = () => {
    const numAmount = parseFloat(form.amount);
    if (!form.label.trim() || !numAmount || numAmount === 0) return;
    onAdd({
      label: form.label.trim(),
      amount: form.isDiscount ? -Math.abs(numAmount) : Math.abs(numAmount),
      note: form.note.trim() || undefined,
    });
    setForm({ label: '', amount: '', isDiscount: false, note: '' });
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-xl border border-[#434E54]/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 text-[#434E54]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h4 className="text-sm font-semibold text-[#434E54]">Price Adjustments</h4>
      </div>

      <AnimatePresence initial={false}>
        {adjustments.map((adj, index) => (
          <motion.div
            key={adj.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: index * 0.05 }}
            className="group flex justify-between items-center text-sm py-1.5 border-b border-[#F0EAE0] last:border-0"
          >
            <div>
              <span className="text-[#434E54]">{adj.label}</span>
              {adj.note ? (
                <div className="text-[10px] text-[#9CA3AF]">{adj.note}</div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span className={adj.amount < 0 ? 'text-green-600' : 'text-[#434E54]'}>
                {adj.amount < 0
                  ? `-$${Math.abs(adj.amount).toFixed(2)}`
                  : `+$${adj.amount.toFixed(2)}`}
              </span>
              <button
                onClick={() => onRemove(adj.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-red-400 hover:text-red-600"
                aria-label="Remove adjustment"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs text-[#434E54]/60 hover:text-[#434E54] transition-colors mt-1"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add adjustment
        </button>
      ) : (
        <div className="pt-3 border-t border-[#F0EAE0] space-y-2">
          <input
            type="text"
            placeholder="Label (e.g. Matted coat surcharge)"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-[#434E54]/20 focus:ring-2 focus:ring-[#434E54]/30 focus:outline-none text-sm w-full"
          />
          <div className="flex gap-2 items-center">
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-[#434E54]/20 focus:ring-2 focus:ring-[#434E54]/30 focus:outline-none text-sm w-32"
            />
            <div className="flex rounded-lg overflow-hidden border border-[#434E54]/20 text-xs">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isDiscount: false }))}
                className={`px-3 py-2 transition-colors ${
                  !form.isDiscount
                    ? 'bg-[#434E54] text-white'
                    : 'text-[#434E54]/60 hover:bg-[#F0EAE0]'
                }`}
              >
                + Surcharge
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isDiscount: true }))}
                className={`px-3 py-2 transition-colors ${
                  form.isDiscount
                    ? 'bg-green-600 text-white'
                    : 'text-[#434E54]/60 hover:bg-[#F0EAE0]'
                }`}
              >
                &minus; Discount
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder="Note (optional)"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-[#434E54]/20 focus:ring-2 focus:ring-[#434E54]/30 focus:outline-none text-sm w-full"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 bg-[#434E54] text-white rounded-lg text-xs hover:bg-[#434E54]/90"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setForm({ label: '', amount: '', isDiscount: false, note: '' });
              }}
              className="px-3 py-1.5 text-[#434E54]/60 hover:text-[#434E54] rounded-lg text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
