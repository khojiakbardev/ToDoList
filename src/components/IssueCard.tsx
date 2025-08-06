import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import { Calendar, User, Tag, AlertCircle, Loader2 } from 'lucide-react';
import { Issue } from '@/types/issue';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { RecentlyAccessed } from '@/types/issue';

interface IssueCardProps {
  issue: Issue;
  isPending?: boolean;
  disabled?: boolean;
}

const IssueCard: React.FC<IssueCardProps> = ({ 
  issue, 
  isPending = false, 
  disabled = false 
}) => {
  const [recentlyAccessed, setRecentlyAccessed] = useLocalStorage<RecentlyAccessed[]>('recently-accessed-issues', []);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: issue.id,
    disabled 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = () => {
    // Add to recently accessed
    const newAccess: RecentlyAccessed = {
      issueId: issue.id,
      accessedAt: new Date()
    };
    
    const filtered = recentlyAccessed.filter(item => item.issueId !== issue.id);
    const updated = [newAccess, ...filtered].slice(0, 5);
    setRecentlyAccessed(updated);
  };

  const getSeverityColor = (severity: Issue['severity']) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getSeverityIcon = (severity: Issue['severity']) => {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('uz-UZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0 : 1,
      }}
      {...(disabled ? {} : { ...attributes, ...listeners })}
      className={`
        group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 transition-all duration-200
        ${!disabled ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
        ${isPending ? 'opacity-50' : ''}
        ${disabled ? 'opacity-75' : ''}
        relative overflow-hidden
      `}
    >
      {/* Pending indicator */}
      {isPending && (
        <div className="absolute top-2 right-2">
          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
        </div>
      )}

      {/* Header with ID and Severity */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
            {issue.assignee.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <Link 
            to={`/issue/${issue.id}`}
            onClick={handleClick}
            className="text-xs font-mono text-gray-500 hover:text-blue-600"
          >
            {issue.id}
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <Badge 
            variant="secondary" 
            className={`text-xs px-2 py-0.5 ${getSeverityColor(issue.severity)}`}
          >
            {issue.severity.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Title */}
      <Link 
        to={`/issue/${issue.id}`}
        onClick={handleClick}
        className="block"
      >
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 text-sm line-clamp-2 group-hover:text-blue-900 transition-colors">
          {issue.title}
        </h3>
      </Link>

      {/* Description */}
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
        {issue.description}
      </p>

      {/* Tags */}
      {issue.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {issue.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              {tag}
            </span>
          ))}
          {issue.tags.length > 2 && (
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              +{issue.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{formatDate(issue.updatedAt)}</span>
        {issue.severity === 'high' && (
          <AlertCircle className="w-3 h-3 text-red-500" />
        )}
      </div>

      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
          <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
            View Only
          </span>
        </div>
      )}
    </div>
  );
};

export default IssueCard;