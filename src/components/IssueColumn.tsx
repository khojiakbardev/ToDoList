import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Issue, IssueStatus } from '@/types/issue';
import IssueCard from './IssueCard';

interface Column {
  id: string;
  title: string;
  status: IssueStatus;
  color: string;
}

interface IssueColumnProps {
  column: Column;
  issues: Issue[];
  pendingMoves: Set<string>;
  disabled?: boolean;
}

const IssueColumn: React.FC<IssueColumnProps> = ({
  column,
  issues,
  pendingMoves,
  disabled = false
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
    disabled
  });

  const getEmptyStateIcon = () => {
    switch (column.status) {
      case 'backlog': return '📋';
      case 'in-progress': return '⚡';
      case 'done': return '✅';
      default: return '📝';
    }
  };

  const getEmptyStateText = () => {
    switch (column.status) {
      case 'backlog': return 'No tasks in backlog';
      case 'in-progress': return 'Nothing in progress';
      case 'done': return 'Nothing completed';
      default: return 'Empty';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[600px] transition-all duration-300 border border-gray-200 dark:border-gray-700 ${
        isOver && !disabled ? 'ring-2 ring-blue-400 ring-opacity-50 shadow-lg' : ''
      } ${disabled ? 'opacity-75' : ''}`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${column.color}`} />
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">{column.title}</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
            {issues.length}
          </span>
        </div>
        {disabled && (
          <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
            View Only
          </span>
        )}
      </div>

      {/* Issues */}
      <SortableContext
        items={issues.map(issue => issue.id)}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="w-10 h-10 mx-auto mb-2 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-lg">{getEmptyStateIcon()}</span>
              </div>
              <p className="text-xs">{getEmptyStateText()}</p>
            </div>
          ) : (
            issues.map((issue, index) => (
              <div
                key={issue.id}
                className="animate-slide-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both'
                }}
              >
                <IssueCard
                  issue={issue}
                  isPending={pendingMoves.has(issue.id)}
                  disabled={disabled}
                />
              </div>
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default IssueColumn;