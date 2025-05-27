
import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Task, Column } from '@/types/kanban';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import AddTaskModal from './AddTaskModal';

const KanbanBoard = () => {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'todo',
      title: 'TO DO',
      status: 'todo',
      color: 'bg-blue-500',
      tasks: []
    },
    {
      id: 'doing',
      title: 'DOING',
      status: 'doing',
      color: 'bg-yellow-500',
      tasks: []
    },
    {
      id: 'done',
      title: 'DONE',
      status: 'done',
      color: 'bg-green-500',
      tasks: []
    }
  ]);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('kanban-tasks');
    if (savedTasks) {
      try {
        const tasks: Task[] = JSON.parse(savedTasks);
        const updatedColumns = columns.map(column => ({
          ...column,
          tasks: tasks.filter(task => task.status === column.status)
        }));
        setColumns(updatedColumns);
      } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
      }
    }
  }, []);

  // Save tasks to localStorage whenever columns change
  useEffect(() => {
    const allTasks = columns.flatMap(column => column.tasks);
    localStorage.setItem('kanban-tasks', JSON.stringify(allTasks));
  }, [columns]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = columns
      .flatMap(column => column.tasks)
      .find(task => task.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as 'todo' | 'doing' | 'done';

    setColumns(prevColumns => {
      const updatedColumns = prevColumns.map(column => {
        // Remove task from its current column
        const tasksWithoutDragged = column.tasks.filter(task => task.id !== taskId);
        
        if (column.status === newStatus) {
          // Add task to the new column
          const draggedTask = prevColumns
            .flatMap(col => col.tasks)
            .find(task => task.id === taskId);
          
          if (draggedTask) {
            const updatedTask = {
              ...draggedTask,
              status: newStatus,
              updatedAt: new Date()
            };
            return {
              ...column,
              tasks: [...tasksWithoutDragged, updatedTask]
            };
          }
        }
        
        return {
          ...column,
          tasks: tasksWithoutDragged
        };
      });

      return updatedColumns;
    });

    toast({
      title: "Task moved!",
      description: `Task moved to ${newStatus.toUpperCase()}`
    });
  };

  const addTask = (title: string, description?: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      description,
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setColumns(prevColumns =>
      prevColumns.map(column =>
        column.status === 'todo'
          ? { ...column, tasks: [...column.tasks, newTask] }
          : column
      )
    );

    toast({
      title: "Task added!",
      description: "New task has been added to your board."
    });
  };

  const deleteTask = (taskId: string) => {
    setColumns(prevColumns =>
      prevColumns.map(column => ({
        ...column,
        tasks: column.tasks.filter(task => task.id !== taskId)
      }))
    );

    toast({
      title: "Task deleted",
      description: "Task has been removed from your board."
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setColumns(prevColumns =>
      prevColumns.map(column => ({
        ...column,
        tasks: column.tasks.map(task =>
          task.id === taskId
            ? { ...task, ...updates, updatedAt: new Date() }
            : task
        )
      }))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            Kanban Board
          </h1>
          <p className="text-gray-600 mb-6">
            Organize your tasks with drag & drop
          </p>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Task
          </Button>
        </div>

        {/* Kanban Board */}
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                onDeleteTask={deleteTask}
                onUpdateTask={updateTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="transform rotate-3 opacity-90">
                <TaskCard
                  task={activeTask}
                  onDelete={() => {}}
                  onUpdate={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Add Task Modal */}
        <AddTaskModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddTask={addTask}
        />
      </div>
    </div>
  );
};

export default KanbanBoard;
