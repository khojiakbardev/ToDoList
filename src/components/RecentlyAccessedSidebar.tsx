import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Issue, RecentlyAccessed } from '@/types/issue';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { issueApi } from '@/api/issueApi';

interface RecentlyAccessedSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const RecentlyAccessedSidebar: React.FC<RecentlyAccessedSidebarProps> = ({
  isOpen,
  onClose
}) => {
  const [recentlyAccessed] = useLocalStorage<RecentlyAccessed[]>('recently-accessed-issues', []);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && recentlyAccessed.length > 0) {
      loadRecentIssues();
    }
  }, [isOpen, recentlyAccessed]);

  const loadRecentIssues = async () => {
    setLoading(true);
    try {
      const allIssues = await issueApi.getAllIssues();
      const recentIssues = recentlyAccessed
        .map(recent => ({
          ...allIssues.find(issue => issue.id === recent.issueId),
          accessedAt: recent.accessedAt
        }))
        .filter(Boolean) as (Issue & { accessedAt: Date })[];
      
      setIssues(recentIssues);
    } catch (error) {
      console.error('Error loading recent issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Hozir';
    if (minutes < 60) return `${minutes} daqiqa oldin`;
    if (hours < 24) return `${hours} soat oldin`;
    return `${days} kun oldin`;
  };

  const getSeverityColor = (severity: Issue['severity']) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">So'ngi ko'rilganlar</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
              <p className="text-gray-600">Yuklanmoqda...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Hozircha hech narsa ko'rilmagan</p>
              <p className="text-sm text-gray-500 mt-1">
                Issue'larga kirib ko'ring, ular shu yerda paydo bo'ladi
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="group bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      to={`/issue/${issue.id}`}
                      onClick={onClose}
                      className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {issue.id}
                    </Link>
                    <Badge variant="secondary" className={`text-xs ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </Badge>
                  </div>

                  <Link
                    to={`/issue/${issue.id}`}
                    onClick={onClose}
                    className="block group-hover:text-blue-900"
                  >
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {issue.title}
                    </h3>
                  </Link>

                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                    {issue.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{issue.assignee}</span>
                    <span>{formatRelativeTime((issue as any).accessedAt)}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-end">
                    <Link
                      to={`/issue/${issue.id}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Ko'rish
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RecentlyAccessedSidebar;