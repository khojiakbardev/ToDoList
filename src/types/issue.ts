export type IssueStatus = 'backlog' | 'in-progress' | 'done';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type UserRole = 'admin' | 'contributor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  severity: IssueSeverity;
  assignee: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  userDefinedRank: number;
}

export interface MoveOperation {
  issueId: string;
  fromStatus: IssueStatus;
  toStatus: IssueStatus;
  timestamp: Date;
}

export interface RecentlyAccessed {
  issueId: string;
  accessedAt: Date;
}

export interface IssueFilters {
  search: string;
  assignee: string;
  severity: IssueSeverity | '';
  sortBy: 'priority' | 'created' | 'updated';
}