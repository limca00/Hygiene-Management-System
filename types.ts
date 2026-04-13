export type CheckpointName = 
  | 'Manpower Skill'
  | 'Cleaning Schedule Followed'
  | 'Equipment Status'
  | 'Cobweb / Floor Cleaning & Hygiene'
  | 'Spillage'
  | 'GMP / GHP Compliance';

export type CheckpointStatus = 'PASS' | 'PARTIAL' | 'FAIL' | null;

export interface CheckpointResult {
  name: CheckpointName;
  status: CheckpointStatus;
  reason?: string;
}

export type SectionName = 'BISCUIT' | 'PC' | 'COMMON' | 'UTILITY';

export interface Area {
  id: string;
  name: string;
  section: SectionName;
  weightage: number;
}

export interface AreaAudit {
  areaId: string;
  checkpoints: CheckpointResult[];
  areaScore: number;
  areaPercentage: number;
}

export interface AuditRecord {
  id: string; // e.g. date_shift_uuid
  date: string;
  shift: 'P' | 'Q' | 'R';
  auditor: string;
  areas: AreaAudit[];
}

export type FPRStatus = 'OPEN' | 'IN PROGRESS' | 'CLOSED';

export interface FPR {
  id: string; // Internal id
  fprId: number; // auto-incremented serial number
  area: string;
  section: string;
  issue: string; // checkpoint name + reason description
  checkpointStatus: 'PARTIAL' | 'FAIL';
  assignPerson: string;
  targetDate: string;
  status: FPRStatus;
  actionTaken: string;
  openDate: string;
  closeDate: string | null;
  shift: string;
  auditor: string;
  date: string;
}

export interface PriorityAlert {
  id: string; // internal id
  recordId: string;
  areaId: string;
  areaName: string;
  section: string;
  date: string;
  shift: string;
  auditor: string;
  checkpointName: string;
  status: 'PARTIAL' | 'FAIL';
  reason?: string;
}

export interface ChronicIssue {
  areaId: string;
  checkpointName: CheckpointName;
}
