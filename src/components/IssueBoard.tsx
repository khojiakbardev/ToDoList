import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Search, Filter, RotateCcw, Clock, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Issue, IssueStatus, IssueFilters } from '@/types/issue';
import { currentUser } from '@/data/currentUser';
import { issueApi } from '@/api/issueApi';
import { usePolling } from '@/hooks/usePolling';
import IssueColumn from './IssueColumn';
import IssueCard from './IssueCard';
import RecentlyAccessedSidebar from './RecentlyAccessedSidebar';
import { ThemeToggle } from './ThemeToggle';

const IssueBoard = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [pendingMoves, setPendingMoves] = useState<Set<string>>(new Set());
  const [canUndo, setCanUndo] = useState(false);
  const [showRecentSidebar, setShowRecentSidebar] = useState(false);
  
  const [filters, setFilters] = useState<IssueFilters>({
    search: '',
    assignee: '',
    severity: '',
    sortBy: 'priority'
  });

  // Polling for real-time updates
  const { data: polledIssues, error: pollingError, lastSync, isLoading } = usePolling(
    () => issueApi.getAllIssues(),
    { interval: 10000, enabled: true }
  );

  useEffect(() => {
    if (polledIssues) {
      setIssues(polledIssues);
    }
  }, [polledIssues]);

  useEffect(() => {
    if (pollingError) {
      toast({
        title: "Connection Error",
        description: pollingError.message,
        variant: "destructive"
      });
    }
  }, [pollingError]);

  // Calculate priority score for sorting
  const calculatePriorityScore = (issue: Issue): number => {
    const severityScores = { low: 1, medium: 2, high: 3 };
    const daysSinceCreated = Math.floor((Date.now() - issue.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    return (severityScores[issue.severity] * 10) + (-daysSinceCreated) + issue.userDefinedRank;
  };

  // Filter and sort issues
  const filteredIssues = React.useMemo(() => {
    let filtered = issues.filter(issue => {
      const matchesSearch = filters.search === '' || 
        issue.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        issue.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));
      
      const matchesAssignee = filters.assignee === '' || issue.assignee === filters.assignee;
      const matchesSeverity = filters.severity === '' || issue.severity === filters.severity;
      
      return matchesSearch && matchesAssignee && matchesSeverity;
    });

    // Sort by priority score
    if (filters.sortBy === 'priority') {
      filtered.sort((a, b) => {
        const scoreA = calculatePriorityScore(a);
        const scoreB = calculatePriorityScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA; // Higher score first
        return b.createdAt.getTime() - a.createdAt.getTime(); // Newer first for same score
      });
    } else if (filters.sortBy === 'created') {
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (filters.sortBy === 'updated') {
      filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    return filtered;
  }, [issues, filters]);

  // Group issues by status
  const issuesByStatus = React.useMemo(() => {
    const grouped = {
      backlog: filteredIssues.filter(issue => issue.status === 'backlog'),
      'in-progress': filteredIssues.filter(issue => issue.status === 'in-progress'),
      done: filteredIssues.filter(issue => issue.status === 'done')
    };
    return grouped;
  }, [filteredIssues]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const issue = issues.find(issue => issue.id === active.id);
    setActiveIssue(issue || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);

    if (!over || !currentUser || currentUser.role !== 'admin') return;

    const issueId = active.id as string;
    const newStatus = over.id as IssueStatus;
    const issue = issues.find(i => i.id === issueId);
    
    if (!issue || issue.status === newStatus) return;

    // Optimistic update
    setIssues(prev => prev.map(i => 
      i.id === issueId ? { ...i, status: newStatus, updatedAt: new Date() } : i
    ));
    
    setPendingMoves(prev => new Set(prev).add(issueId));

    try {
      await issueApi.moveIssue(issueId, newStatus);
      setCanUndo(issueApi.canUndo());
      
      toast({
        title: "Issue moved",
        description: `${issue.title} moved to ${newStatus === 'backlog' ? 'Backlog' : newStatus === 'in-progress' ? 'In Progress' : 'Done'}`,
        action: canUndo ? (
          <Button variant="outline" size="sm" onClick={handleUndo}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Undo
          </Button>
        ) : undefined
      });
    } catch (error) {
      // Revert optimistic update on error
      setIssues(prev => prev.map(i => 
        i.id === issueId ? { ...i, status: issue.status } : i
      ));
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to move issue",
        variant: "destructive"
      });
    } finally {
      setPendingMoves(prev => {
        const newSet = new Set(prev);
        newSet.delete(issueId);
        return newSet;
      });
    }
  };

  const handleUndo = async () => {
    try {
      const restoredIssue = await issueApi.undoLastMove();
      if (restoredIssue) {
        setIssues(prev => prev.map(i => 
          i.id === restoredIssue.id ? restoredIssue : i
        ));
        setCanUndo(false);
        toast({
          title: "Action undone",
          description: "Last action successfully undone"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to undo action",
        variant: "destructive"
      });
    }
  };

  const columns = [
    { id: 'backlog', title: 'Backlog', status: 'backlog' as IssueStatus, color: 'bg-gray-500' },
    { id: 'in-progress', title: 'In Progress', status: 'in-progress' as IssueStatus, color: 'bg-blue-500' },
    { id: 'done', title: 'Done', status: 'done' as IssueStatus, color: 'bg-green-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V3H13V9H21Z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Issue Board
                </h1>
                <span className="text-sm text-gray-500 dark:text-gray-400">admin</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Last sync: {lastSync ? lastSync.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <Button
              variant="outline"
              onClick={() => setShowRecentSidebar(!showRecentSidebar)}
            >
              <Clock className="w-4 h-4 mr-2" />
              Recently Viewed
            </Button>
            
            {canUndo && (
              <Button variant="outline" onClick={handleUndo}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Undo
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search issues by title or tags..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 h-9"
            />
          </div>
          
          <Select value={filters.assignee || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, assignee: value === 'all' ? '' : value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Array.from(new Set(issues.map(i => i.assignee))).map(assignee => (
                <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.severity || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value === 'all' ? '' : value as any }))}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">By Priority</SelectItem>
              <SelectItem value="created">Created Date</SelectItem>
              <SelectItem value="updated">Updated Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User Role Info */}
        {currentUser.role === 'contributor' && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Notice:</strong> You have "contributor" role. You can only view issues.
              Admin role is required to move issues.
            </p>
          </div>
        )}

        {/* Issue Board */}
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {columns.map(column => (
              <IssueColumn
                key={column.id}
                column={column}
                issues={issuesByStatus[column.status]}
                pendingMoves={pendingMoves}
                disabled={currentUser.role !== 'admin'}
              />
            ))}
          </div>

          <DragOverlay>
            {activeIssue ? (
              <div className="transform rotate-3 opacity-90">
                <IssueCard
                  issue={activeIssue}
                  isPending={false}
                  disabled={currentUser.role !== 'admin'}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Recently Accessed Sidebar */}
        <RecentlyAccessedSidebar 
          isOpen={showRecentSidebar}
          onClose={() => setShowRecentSidebar(false)}
        />
      </div>
    </div>
  );
};

export default IssueBoard;