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
        title: "Bog'lanish xatosi",
        description: pollingError.message,
        variant: "destructive"
      });
    }
  }, [pollingError]);

  // Calculate priority score for sorting
  const calculatePriorityScore = (issue: Issue): number => {
    const severityScores = { low: 1, medium: 2, high: 3, critical: 4 };
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
        title: "Issue harakatlandi",
        description: `${issue.title} ${newStatus === 'backlog' ? 'Backlog' : newStatus === 'in-progress' ? 'In Progress' : 'Done'} ga o'tkazildi`,
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
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Issue harakatlantirish amalga oshmadi",
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
          title: "Harakat bekor qilindi",
          description: "Oxirgi harakat muvaffaqiyatli bekor qilindi"
        });
      }
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Bekor qilish amalga oshmadi",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
              Issue Board
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {isLoading ? (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Yangilanmoqda...</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Oxirgi yangilanish: {lastSync?.toLocaleTimeString('uz-UZ')}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRecentSidebar(!showRecentSidebar)}
            >
              <Clock className="w-4 h-4 mr-2" />
              So'ngi ko'rilganlar
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-6 bg-white rounded-2xl shadow-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Qidirish (title yoki tag)..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
          
          <Select value={filters.assignee || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, assignee: value === 'all' ? '' : value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Assignee bo'yicha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hammasi</SelectItem>
              {Array.from(new Set(issues.map(i => i.assignee))).map(assignee => (
                <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.severity || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value === 'all' ? '' : value as any }))}>
            <SelectTrigger>
              <SelectValue placeholder="Severity bo'yicha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hammasi</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}>
            <SelectTrigger>
              <SelectValue placeholder="Saralash" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority bo'yicha</SelectItem>
              <SelectItem value="created">Yaratilgan vaqt</SelectItem>
              <SelectItem value="updated">Yangilangan vaqt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User Role Info */}
        {currentUser.role === 'contributor' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              <strong>Diqqat:</strong> Siz "contributor" roliga egasiz. Faqat ko'rish imkoniyatingiz bor.
              Issue'larni harakatlantirish uchun admin roli kerak.
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