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
        group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200
        ${!disabled ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer' : 'cursor-default'}
        ${isPending ? 'opacity-50' : ''}
        ${disabled ? 'opacity-75' : ''}
        relative overflow-hidden
      `}
    >
      {/* Pending indicator */}
      {isPending && (
        <div className="absolute top-2 right-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        </div>
      )}

      {/* Issue ID and Severity */}
      <div className="flex items-center justify-between mb-2">
        <Link 
          to={`/issue/${issue.id}`}
          onClick={handleClick}
          className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline"
        >
          {issue.id}
        </Link>
        <div className="flex items-center gap-1">
          <span className="text-sm">{getSeverityIcon(issue.severity)}</span>
          <Badge variant="secondary" className={getSeverityColor(issue.severity)}>
            {issue.severity}
          </Badge>
        </div>
      </div>

      {/* Title */}
      <Link 
        to={`/issue/${issue.id}`}
        onClick={handleClick}
        className="block"
      >
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-900 transition-colors">
          {issue.title}
        </h3>
      </Link>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {issue.description}
      </p>

      {/* Tags */}
      {issue.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {issue.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
          {issue.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{issue.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[100px]">{issue.assignee}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(issue.updatedAt)}</span>
        </div>
      </div>

      {/* Status indicator line */}
      <div className={`
        absolute bottom-0 left-0 right-0 h-1 transition-all duration-200
        ${issue.status === 'backlog' ? 'bg-gray-500' : ''}
        ${issue.status === 'in-progress' ? 'bg-blue-500' : ''}
        ${issue.status === 'done' ? 'bg-green-500' : ''}
      `} />

      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
          <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
            Faqat ko'rish
          </span>
        </div>
      )}
    </div>
  );
};

export default IssueCard;