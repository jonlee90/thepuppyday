'use client';

import React, { useId } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, dragHandle: React.ReactNode, isDragging: boolean) => React.ReactNode;
  direction?: 'vertical' | 'grid';
  className?: string;
}

export function useSortableItem(id: string) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return {
    ref: setNodeRef,
    style: {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    },
    isDragging,
    dragHandleProps: { ...attributes, ...listeners },
  };
}

export function DragHandle({ dragHandleProps }: { dragHandleProps: Record<string, unknown> }) {
  return (
    <button
      type="button"
      className="p-1 text-[#434E54]/40 hover:text-[#434E54] cursor-grab active:cursor-grabbing rounded touch-none"
      aria-label="Drag to reorder"
      {...dragHandleProps}
    >
      <GripVertical className="w-4 h-4" />
    </button>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  direction = 'vertical',
  className,
}: SortableListProps<T>) {
  const announcerId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  }

  return (
    <>
      <div id={announcerId} aria-live="assertive" className="sr-only" />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={direction === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
        >
          <div className={className}>
            {items.map((item) => (
              <SortableItemWrapper key={item.id} id={item.id} renderItem={renderItem} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}

function SortableItemWrapper<T extends { id: string }>({
  id,
  item,
  renderItem,
}: {
  id: string;
  item: T;
  renderItem: (item: T, dragHandle: React.ReactNode, isDragging: boolean) => React.ReactNode;
}) {
  const { ref, style, isDragging, dragHandleProps } = useSortableItem(id);
  const dragHandle = <DragHandle dragHandleProps={dragHandleProps as Record<string, unknown>} />;
  return (
    <div ref={ref} style={style}>
      {renderItem(item, dragHandle, isDragging)}
    </div>
  );
}
