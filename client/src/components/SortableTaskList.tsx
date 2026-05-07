import { type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { positionBetween } from "@/lib/tasks";
import type { Task, UpdateTaskInput } from "@/api/tasks";

export function SortableTaskList({
  tasks,
  onUpdateTask,
  children,
}: {
  tasks: Task[];
  onUpdateTask: (id: number, input: UpdateTaskInput) => Promise<unknown>;
  children: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeIdx = tasks.findIndex((t) => t.id === active.id);
    const overIdx = tasks.findIndex((t) => t.id === over.id);
    if (activeIdx === -1 || overIdx === -1) return;
    const reordered = arrayMove(tasks, activeIdx, overIdx);
    const prev = reordered[overIdx - 1];
    const next = reordered[overIdx + 1];
    const pos = positionBetween(prev?.position, next?.position);
    void onUpdateTask(Number(active.id), { position: pos });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}
