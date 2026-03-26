export type UserRole = 'FM' | 'TC' | 'BDM' | 'BO' | 'BDO';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  active: boolean;
  teamId?: string;
  authId?: string;
}

export type NumberStatus = 'Connected' | 'Not Connected' | 'Mobile Off' | 'Incoming Barred' | 'Invalid Number' | '';
export type LeadStatus = 'Interested' | 'Not Interested' | 'Eligible' | 'Not Eligible' | 'Pending' | 'Language Barrier' | 'Ringing' | '';
export type LeadType = 'Client' | 'DSA' | '';
export type MeetingStep1Status = 'Meeting Done' | 'Pending' | 'Reject';
export type MeetingStatus = 'Scheduled' | 'Meeting Done' | 'Not Done' | 'Pending' | 'Reject' | 'Converted' | 'Follow-Up' | '';
export type BDOStatus = 'Converted by BDM' | 'Converted' | 'Walk-in Done' | 'Follow-up' | '';
export type WalkingStatus = 'Walking Done' | 'Invalid' | '';
export type ProductType = 'Term Loan' | 'Equity' | 'Term+Equity' | 'Unsecure' | 'Project Funding' | '';

export interface Lead {
  id: string;
  clientName: string;
  phoneNumber: string;
  loanRequirement: string;
  address?: string;
  numberStatus: NumberStatus;
  leadStatus: LeadStatus;
  leadType: LeadType;
  assignedBOId: string;
  assignedDate: string;
  meetingRequested: boolean;
  meetingApproved: boolean;
  meetingId?: string;
}

export interface LeadRemark {
  id: string;
  leadId: string;
  remark: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingRemark {
  id: string;
  meetingId: string;
  remark: string;
  createdBy: string;
  createdAt: string;
}

export interface LoginHistory {
  id: string;
  meetingId: string;
  loginType: 'Mini Login' | 'Full Login' | 'Both';
  createdBy: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  leadId: string;
  bdmId: string;
  tcId: string;
  boId: string;
  date: string;
  timeSlot: string;
  status: MeetingStatus;
  meetingType?: 'Virtual' | 'Walk-in';
  walkinDate?: string;
  bdoStatus?: BDOStatus;
  bdoId?: string;
  miniLogin?: boolean;
  fullLogin?: boolean;
  walkingStatus?: WalkingStatus;
  // TC scheduling details
  clientName?: string;
  location?: string;
  state?: string;
  productType?: ProductType;
  finalRequirement?: string;
  collateralValue?: string;
}

export interface Team {
  id: string;
  name: string;
  tcId: string;
  boIds: string[];
}

export interface MeetingRequest {
  id: string;
  leadId: string;
  boId: string;
  tcId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface DuplicateLead {
  id: string;
  clientName: string;
  phoneNumber: string;
  loanRequirement: string;
  address?: string;
  originalLeadId?: string;
  originalBoName?: string;
  uploadedBy?: string;
  uploadedAt: string;
}
