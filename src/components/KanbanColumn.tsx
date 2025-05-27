
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Task } from '@/types/kanban';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  column: Column;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onDeleteTask,
  onUpdateTask
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-2xl shadow-lg p-6 min-h-[500px] transition-all duration-300 ${
        isOver ? 'ring-2 ring-blue-400 ring-opacity-50 shadow-xl scale-[1.02]' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-4 h-4 rounded-full ${column.color}`} />
        <h2 className="text-xl font-bold text-gray-800">{column.title}</h2>
        <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
          {column.tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <SortableContext
        items={column.tasks.map(task => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {column.tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">
                {column.status === 'todo' && '📝'}
                {column.status === 'doing' && '⚡'}
                {column.status === 'done' && '✅'}
              </div>
              <p>No tasks here yet</p>
            </div>
          ) : (
            column.tasks.map((task, index) => (
              <div
                key={task.id}
                className="animate-slide-in"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both'
                }}
              >
                <TaskCard
                  task={task}
                  onDelete={onDeleteTask}
                  onUpdate={onUpdateTask}
                />
              </div>
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default KanbanColumn;
