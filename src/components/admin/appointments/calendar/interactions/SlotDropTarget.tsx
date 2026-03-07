'use client';

interface SlotDropTargetProps {
  time: Date;
  groomerId: string | null;
  isActive: boolean;
  onClick: (time: Date, groomerId: string | null) => void;
}

export function SlotDropTarget({ time, groomerId, isActive, onClick }: SlotDropTargetProps) {
  return (
    <div
      className={`absolute inset-0 transition-colors ${
        isActive ? 'bg-[#434E54]/10 border-2 border-dashed border-[#434E54]/30 rounded' : ''
      }`}
      onClick={() => onClick(time, groomerId)}
    />
  );
}
