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
      case 'backlog': return 'Hech qanday vazifa yo\'q';
      case 'in-progress': return 'Hech narsa bajarilmayapti';
      case 'done': return 'Hech narsa tugallanmagan';
      default: return 'Bo\'sh';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-2xl shadow-lg p-6 min-h-[600px] transition-all duration-300 ${
        isOver && !disabled ? 'ring-2 ring-blue-400 ring-opacity-50 shadow-xl scale-[1.02]' : ''
      } ${disabled ? 'opacity-75' : ''}`}
    >
      {/* Column Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-4 h-4 rounded-full ${column.color}`} />
        <h2 className="text-xl font-bold text-gray-800">{column.title}</h2>
        <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
          {issues.length}
        </span>
        {disabled && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Faqat ko'rish
          </span>
        )}
      </div>

      {/* Issues */}
      <SortableContext
        items={issues.map(issue => issue.id)}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <div className="space-y-4">
          {issues.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">
                {getEmptyStateIcon()}
              </div>
              <p>{getEmptyStateText()}</p>
            </div>
          ) : (
            issues.map((issue, index) => (
              <div
                key={issue.id}
                className="animate-slide-in"
                style={{
                  animationDelay: `${index * 100}ms`,
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