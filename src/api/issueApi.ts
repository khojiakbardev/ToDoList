import { Issue, IssueStatus, IssueSeverity, MoveOperation } from '@/types/issue';
import issuesData from '@/data/issues.json';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate random API errors (5% chance)
const shouldSimulateError = () => Math.random() < 0.05;

class IssueAPI {
  private issues: Issue[] = [];
  private moveHistory: MoveOperation[] = [];

  constructor() {
    // Load issues from JSON and convert date strings to Date objects
    this.issues = issuesData.map(issue => ({
      ...issue,
      status: issue.status as IssueStatus,
      severity: issue.severity as IssueSeverity,
      createdAt: new Date(issue.createdAt),
      updatedAt: new Date(issue.updatedAt)
    }));
  }

  async getAllIssues(): Promise<Issue[]> {
    await delay(300);
    
    if (shouldSimulateError()) {
      throw new Error('Ma\'lumotlar bazasi bilan bog\'lanishda xatolik');
    }
    
    return [...this.issues];
  }

  async getIssueById(id: string): Promise<Issue | null> {
    await delay(200);
    
    if (shouldSimulateError()) {
      throw new Error('Issue topilmadi');
    }
    
    return this.issues.find(issue => issue.id === id) || null;
  }

  async moveIssue(issueId: string, newStatus: IssueStatus, skipDelay = false): Promise<Issue> {
    if (!skipDelay) {
      await delay(500); // Optimistic UI delay
    }
    
    if (shouldSimulateError()) {
      throw new Error('Issue harakatlantirish amalga oshmadi');
    }

    const issueIndex = this.issues.findIndex(issue => issue.id === issueId);
    if (issueIndex === -1) {
      throw new Error('Issue topilmadi');
    }

    const issue = this.issues[issueIndex];
    const oldStatus = issue.status;

    // Store move operation for undo functionality
    const moveOperation: MoveOperation = {
      issueId,
      fromStatus: oldStatus,
      toStatus: newStatus,
      timestamp: new Date()
    };
    this.moveHistory.push(moveOperation);

    // Update issue
    this.issues[issueIndex] = {
      ...issue,
      status: newStatus,
      updatedAt: new Date()
    };

    return this.issues[issueIndex];
  }

  async undoLastMove(): Promise<Issue | null> {
    await delay(200);
    
    if (this.moveHistory.length === 0) {
      return null;
    }

    const lastMove = this.moveHistory.pop()!;
    
    // Check if the move was recent (within 5 seconds)
    const now = new Date();
    const timeDiff = now.getTime() - lastMove.timestamp.getTime();
    if (timeDiff > 5000) {
      throw new Error('Undo muddati tugagan (5 soniya)');
    }

    return this.moveIssue(lastMove.issueId, lastMove.fromStatus, true);
  }

  async markAsResolved(issueId: string): Promise<Issue> {
    return this.moveIssue(issueId, 'done');
  }

  async updateIssue(issueId: string, updates: Partial<Issue>): Promise<Issue> {
    await delay(300);
    
    if (shouldSimulateError()) {
      throw new Error('Issue yangilash amalga oshmadi');
    }

    const issueIndex = this.issues.findIndex(issue => issue.id === issueId);
    if (issueIndex === -1) {
      throw new Error('Issue topilmadi');
    }

    this.issues[issueIndex] = {
      ...this.issues[issueIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.issues[issueIndex];
  }

  getLastSyncTime(): Date {
    return new Date();
  }

  canUndo(): boolean {
    if (this.moveHistory.length === 0) return false;
    
    const lastMove = this.moveHistory[this.moveHistory.length - 1];
    const now = new Date();
    const timeDiff = now.getTime() - lastMove.timestamp.getTime();
    
    return timeDiff <= 5000;
  }
}

export const issueApi = new IssueAPI();