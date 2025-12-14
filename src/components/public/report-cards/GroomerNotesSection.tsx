'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { GroomerSignature } from './GroomerSignature';

interface GroomerNotesSectionProps {
  notes: string | null;
  groomerName: string | null;
  date: string;
}

/**
 * GroomerNotesSection - Displays personal notes from the groomer
 * Only shown if groomer notes exist
 */
export function GroomerNotesSection({
  notes,
  groomerName,
  date,
}: GroomerNotesSectionProps) {
  if (!notes) {
    return null;
  }

  return (
    <section className="bg-[#F8EEE5] py-12 lg:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#434E54] mb-3">
            Groomer's Notes
          </h2>
          <p className="text-[#6B7280]">
            Personal insights from your pet's groomer
          </p>
        </div>

        {/* Notes Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 lg:p-10 rounded-xl shadow-lg"
        >
          {/* Quote Icon */}
          <div className="mb-6">
            <div className="inline-flex p-3 bg-[#EAE0D5] rounded-lg">
              <Quote className="w-6 h-6 text-[#434E54]" />
            </div>
          </div>

          {/* Notes Content */}
          <div className="prose prose-lg max-w-none mb-6">
            <p className="text-[#434E54] leading-relaxed whitespace-pre-wrap">
              {notes}
            </p>
          </div>

          {/* Groomer Signature */}
          {groomerName && (
            <GroomerSignature groomerName={groomerName} date={date} />
          )}
        </motion.div>
      </div>
    </section>
  );
}
