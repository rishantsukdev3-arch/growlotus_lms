import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { User, Lead, Team, Meeting, MeetingRequest, LeadRemark, DuplicateLead, MeetingRemark, LoginHistory } from '@/types/crm';
import { supabase } from '@/integrations/supabase/client';

interface CRMContextType {
  currentUser: User | null;
  users: User[];
  leads: Lead[];
  teams: Team[];
  meetings: Meeting[];
  meetingRequests: MeetingRequest[];
  leadRemarks: LeadRemark[];
  duplicateLeads: DuplicateLead[];
  meetingRemarks: MeetingRemark[];
  loginHistory: LoginHistory[];
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  addLeads: (newLeads: Lead[], duplicates?: DuplicateLead[]) => Promise<void>;
  updateLead: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  addUser: (user: User, password: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  addTeam: (team: Team) => Promise<void>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  updateTeamMembers: (teamId: string, boIds: string[]) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addMeeting: (meeting: Meeting) => Promise<void>;
  updateMeeting: (meetingId: string, updates: Partial<Meeting>) => Promise<void>;
  addMeetingRequest: (req: MeetingRequest) => Promise<void>;
  updateMeetingRequest: (reqId: string, updates: Partial<MeetingRequest>) => Promise<void>;
  addRemark: (remark: Omit<LeadRemark, 'id' | 'updatedAt'>) => Promise<void>;
  updateRemark: (remarkId: string, newText: string) => Promise<void>;
  deleteRemark: (remarkId: string) => Promise<void>;
  deleteDuplicateLead: (id: string) => Promise<void>;
  mergeDuplicateLead: (duplicateId: string) => Promise<void>;
  addMeetingRemark: (meetingId: string, remark: string, createdBy: string) => Promise<void>;
  addLoginUpdate: (meetingId: string, loginType: LoginHistory['loginType'], createdBy: string) => Promise<void>;
}

const CRMContext = createContext<CRMContextType | null>(null);

const mapProfile = (p: any): User => ({
  id: p.id, name: p.name, username: p.username, role: p.role,
  active: p.active, teamId: p.team_id || undefined, authId: p.auth_id || undefined,
});

const mapLead = (l: any): Lead => ({
  id: l.id, clientName: l.client_name, phoneNumber: l.phone_number,
  loanRequirement: String(l.loan_requirement), address: l.address || undefined,
  numberStatus: l.number_status || '', leadStatus: l.lead_status || '',
  leadType: l.lead_type || '', assignedBOId: l.assigned_bo_id,
  assignedDate: l.assigned_date, meetingRequested: l.meeting_requested,
  meetingApproved: l.meeting_approved, meetingId: l.meeting_id || undefined,
});

const mapMeeting = (m: any): Meeting => ({
  id: m.id, leadId: m.lead_id, bdmId: m.bdm_id, tcId: m.tc_id,
  boId: m.bo_id, date: m.date, timeSlot: m.time_slot,
  status: m.status || 'Scheduled', meetingType: m.meeting_type || undefined,
  walkinDate: m.walkin_date || undefined,
  bdoStatus: m.bdo_status || undefined,
  bdoId: m.bdo_id || undefined,
  miniLogin: m.mini_login || false,
  fullLogin: m.full_login || false,
  walkingStatus: m.walking_status || undefined,
  clientName: m.client_name || undefined,
  location: m.location || undefined,
  state: m.state || undefined,
  productType: m.product_type || undefined,
  finalRequirement: m.final_requirement != null ? String(m.final_requirement) : undefined,
  collateralValue: m.collateral_value != null ? String(m.collateral_value) : undefined,
});

const mapMeetingRequest = (r: any): MeetingRequest => ({
  id: r.id, leadId: r.lead_id, boId: r.bo_id, tcId: r.tc_id,
  status: r.status, createdAt: r.created_at?.split('T')[0] || '',
});

const mapRemark = (r: any): LeadRemark => ({
  id: r.id, leadId: r.lead_id, remark: r.remark, createdBy: r.created_by,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

const mapDuplicateLead = (d: any): DuplicateLead => ({
  id: d.id, clientName: d.client_name, phoneNumber: d.phone_number,
  loanRequirement: String(d.loan_requirement), address: d.address || undefined,
  originalLeadId: d.original_lead_id || undefined,
  originalBoName: d.original_bo_name || undefined,
  uploadedBy: d.uploaded_by || undefined,
  uploadedAt: d.uploaded_at,
});

const mapMeetingRemark = (r: any): MeetingRemark => ({
  id: r.id, meetingId: r.meeting_id, remark: r.remark,
  createdBy: r.created_by, createdAt: r.created_at,
});

const mapLoginHistory = (r: any): LoginHistory => ({
  id: r.id, meetingId: r.meeting_id, loginType: r.login_type,
  createdBy: r.created_by, createdAt: r.created_at,
});

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [leadRemarks, setLeadRemarks] = useState<LeadRemark[]>([]);
  const [duplicateLeads, setDuplicateLeads] = useState<DuplicateLead[]>([]);
  const [meetingRemarks, setMeetingRemarks] = useState<MeetingRemark[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const fetchAllData = useCallback(async () => {
    const [profilesRes, teamsRes, membersRes, leadsRes, meetingsRes, reqsRes, remarksRes, dupsRes, meetingRemarksRes, loginHistoryRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('teams').select('*'),
      supabase.from('team_members').select('*'),
      supabase.from('leads').select('*'),
      supabase.from('meetings').select('*'),
      supabase.from('meeting_requests').select('*'),
      supabase.from('lead_remarks').select('*').order('created_at', { ascending: false }),
      supabase.from('duplicate_leads').select('*').order('uploaded_at', { ascending: false }),
      supabase.from('meeting_remarks').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('login_history').select('*').order('created_at', { ascending: false }),
    ]);

    if (profilesRes.data) setUsers(profilesRes.data.map(mapProfile));
    if (leadsRes.data) setLeads(leadsRes.data.map(mapLead));
    if (meetingsRes.data) setMeetings(meetingsRes.data.map(mapMeeting));
    if (reqsRes.data) setMeetingRequests(reqsRes.data.map(mapMeetingRequest));
    if (remarksRes.data) setLeadRemarks(remarksRes.data.map(mapRemark));
    if (dupsRes.data) setDuplicateLeads(dupsRes.data.map(mapDuplicateLead));
    if (meetingRemarksRes.data) setMeetingRemarks(meetingRemarksRes.data.map(mapMeetingRemark));
    if (loginHistoryRes.data) setLoginHistory(loginHistoryRes.data.map(mapLoginHistory));

    if (teamsRes.data && membersRes.data) {
      const builtTeams: Team[] = teamsRes.data.map((t: any) => ({
        id: t.id, name: t.name, tcId: t.tc_id,
        boIds: membersRes.data!.filter((m: any) => m.team_id === t.id).map((m: any) => m.bo_id),
      }));
      setTeams(builtTeams);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      const savedUser = localStorage.getItem('crm_current_user');
      if (savedUser) {
        try { setCurrentUser(JSON.parse(savedUser)); } catch {
          localStorage.removeItem('crm_current_user');
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (savedUser && !session) {
        console.log('Supabase session expired, using anon access for data');
      }

      await fetchAllData();
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { });

    function applyEvent<T extends { id: string }>(
      prev: T[],
      payload: { eventType: string; new: any; old: any },
      mapper: (row: any) => T
    ): T[] {
      const { eventType, new: newRow, old: oldRow } = payload;
      if (eventType === 'INSERT') return [...prev, mapper(newRow)];
      if (eventType === 'UPDATE') return prev.map(item => item.id === newRow.id ? mapper(newRow) : item);
      if (eventType === 'DELETE') return prev.filter(item => item.id !== oldRow.id);
      return prev;
    }

    const channel = supabase.channel('crm-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        setLeads(prev => applyEvent(prev, payload as any, mapLead));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, (payload) => {
        setMeetings(prev => applyEvent(prev, payload as any, mapMeeting));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_requests' }, (payload) => {
        setMeetingRequests(prev => applyEvent(prev, payload as any, mapMeetingRequest));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_remarks' }, (payload) => {
        setLeadRemarks(prev => applyEvent(prev, payload as any, mapRemark));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duplicate_leads' }, (payload) => {
        setDuplicateLeads(prev => applyEvent(prev, payload as any, mapDuplicateLead));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_remarks' }, (payload) => {
        setMeetingRemarks(prev => applyEvent(prev, payload as any, mapMeetingRemark));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'login_history' } as any, (payload) => {
        setLoginHistory(prev => applyEvent(prev, payload as any, mapLoginHistory));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => fetchAllData())
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('crm_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('crm_current_user');
    }
  }, [currentUser]);

  // const login = useCallback(async (username: string, password: string) => {
  //   const email = `${username}@growlotus.crm`;
  //   const { data: profiles } = await supabase.from('profiles').select('*').eq('username', username);
  //   if (!profiles || profiles.length === 0) return false;
  //   const profile = mapProfile(profiles[0]);
  //   if (!profile.active) return false;

  //   const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  //   if (!signInError && signInData?.user) {
  //     if (!profile.authId) {
  //       await supabase.from('profiles').update({ auth_id: signInData.user.id }).eq('id', profile.id);
  //     }
  //     setCurrentUser(profile);
  //     return true;
  //   }

  //   const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  //   if (!signUpError && signUpData?.user) {
  //     await supabase.from('profiles').update({ auth_id: signUpData.user.id }).eq('id', profile.id);
  //     setCurrentUser(profile);
  //     return true;
  //   }

  //   return false;
  // }, []);
  const login = useCallback(async (username: string, password: string) => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username);

    if (!profiles || profiles.length === 0) return false;

    const profile = mapProfile(profiles[0]);
    if (!profile.active) return false;

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email: username, password });

    if (!signInError && signInData?.user) {
      if (!profile.authId) {
        await supabase.from('profiles').update({ auth_id: signInData.user.id }).eq('id', profile.id);
      }
      setCurrentUser(profile);
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    supabase.auth.signOut();
    setCurrentUser(null);
  }, []);

  const refreshData = fetchAllData;

  const addLeads = useCallback(async (newLeads: Lead[], duplicates?: DuplicateLead[]) => {
    if (newLeads.length > 0) {
      const rows = newLeads.map(l => ({
        id: l.id, client_name: l.clientName, phone_number: l.phoneNumber,
        loan_requirement: l.loanRequirement, address: l.address || null,
        number_status: l.numberStatus, lead_status: l.leadStatus,
        lead_type: l.leadType, assigned_bo_id: l.assignedBOId,
        assigned_date: l.assignedDate, meeting_requested: l.meetingRequested,
        meeting_approved: l.meetingApproved, meeting_id: l.meetingId || null,
      }));
      await supabase.from('leads').insert(rows);
    }
    if (duplicates && duplicates.length > 0) {
      const dupRows = duplicates.map(d => ({
        client_name: d.clientName, phone_number: d.phoneNumber,
        loan_requirement: d.loanRequirement, address: d.address || null,
        original_lead_id: d.originalLeadId || null,
        original_bo_name: d.originalBoName || null,
        uploaded_by: d.uploadedBy || null,
      }));
      await supabase.from('duplicate_leads').insert(dupRows);
    }
    await fetchAllData();
  }, [fetchAllData]);

  const updateLead = useCallback(async (leadId: string, updates: Partial<Lead>) => {
    const dbUpdates: any = {};
    if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
    if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
    if (updates.numberStatus !== undefined) dbUpdates.number_status = updates.numberStatus;
    if (updates.leadStatus !== undefined) dbUpdates.lead_status = updates.leadStatus;
    if (updates.leadType !== undefined) dbUpdates.lead_type = updates.leadType;
    if (updates.meetingRequested !== undefined) dbUpdates.meeting_requested = updates.meetingRequested;
    if (updates.meetingApproved !== undefined) dbUpdates.meeting_approved = updates.meetingApproved;
    if (updates.meetingId !== undefined) dbUpdates.meeting_id = updates.meetingId;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    await supabase.from('leads').update(dbUpdates).eq('id', leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
  }, []);

  const addUser = useCallback(async (user: User, password: string) => {
    const { error } = await supabase.functions.invoke('create-user', {
      body: {
        name: user.name,
        username: user.username,
        password: password,
        role: user.role,
        teamId: user.teamId || null,
      },
    });
    if (error) throw new Error(error.message);
    await fetchAllData();
  }, [fetchAllData]);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    const dbUpdates: any = {};
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    if (updates.teamId !== undefined) dbUpdates.team_id = updates.teamId;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    await fetchAllData();
  }, [fetchAllData]);

  const removeUser = useCallback(async (userId: string) => {
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { userId },
    });
    if (error) throw new Error(error.message);
    await fetchAllData();
  }, [fetchAllData]);

  const addTeam = useCallback(async (team: Team) => {
    await supabase.from('teams').insert({ id: team.id, name: team.name, tc_id: team.tcId });
    if (team.boIds.length > 0) {
      await supabase.from('team_members').insert(team.boIds.map(boId => ({ team_id: team.id, bo_id: boId })));
    }
    await fetchAllData();
  }, [fetchAllData]);

  const updateTeam = useCallback(async (teamId: string, updates: Partial<Team>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.tcId !== undefined) dbUpdates.tc_id = updates.tcId;
    await supabase.from('teams').update(dbUpdates).eq('id', teamId);
    await fetchAllData();
  }, [fetchAllData]);

  const updateTeamMembers = useCallback(async (teamId: string, boIds: string[]) => {
    await supabase.from('team_members').delete().eq('team_id', teamId);
    if (boIds.length > 0) {
      await supabase.from('team_members').insert(boIds.map(boId => ({ team_id: teamId, bo_id: boId })));
    }
    const { data: allProfiles } = await supabase.from('profiles').select('id, team_id').eq('role', 'BO');
    if (allProfiles) {
      for (const p of allProfiles) {
        if (boIds.includes(p.id) && p.team_id !== teamId) {
          await supabase.from('profiles').update({ team_id: teamId }).eq('id', p.id);
        }
      }
    }
    await fetchAllData();
  }, [fetchAllData]);

  const deleteTeam = useCallback(async (teamId: string) => {
    const { data: members } = await supabase.from('team_members').select('bo_id').eq('team_id', teamId);
    if (members) {
      for (const m of members) {
        await supabase.from('profiles').update({ team_id: null }).eq('id', m.bo_id);
      }
    }
    await supabase.from('team_members').delete().eq('team_id', teamId);
    const team = teams.find(t => t.id === teamId);
    if (team) {
      await supabase.from('profiles').update({ team_id: null }).eq('id', team.tcId);
    }
    await supabase.from('teams').delete().eq('id', teamId);
    await fetchAllData();
  }, [fetchAllData, teams]);

  const addMeeting = useCallback(async (meeting: Meeting) => {
    await supabase.from('meetings').insert({
      id: meeting.id, lead_id: meeting.leadId, bdm_id: meeting.bdmId,
      tc_id: meeting.tcId, bo_id: meeting.boId, date: meeting.date,
      time_slot: meeting.timeSlot, status: meeting.status,
      meeting_type: meeting.meetingType || null,
      walkin_date: meeting.walkinDate || null,
      client_name: meeting.clientName || null,
      location: meeting.location || null,
      state: meeting.state || null,
      product_type: meeting.productType || null,
      final_requirement: meeting.finalRequirement ?? null,
      collateral_value: meeting.collateralValue ?? null,
    });
    setMeetings(prev => [...prev, meeting]);
  }, []);

  const updateMeeting = useCallback(async (meetingId: string, updates: Partial<Meeting>) => {
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.bdmId !== undefined) dbUpdates.bdm_id = updates.bdmId;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.timeSlot !== undefined) dbUpdates.time_slot = updates.timeSlot;
    if (updates.meetingType !== undefined) dbUpdates.meeting_type = updates.meetingType;
    if (updates.walkinDate !== undefined) dbUpdates.walkin_date = updates.walkinDate;
    if (updates.bdoStatus !== undefined) dbUpdates.bdo_status = updates.bdoStatus;
    if (updates.bdoId !== undefined) dbUpdates.bdo_id = updates.bdoId;
    if (updates.miniLogin !== undefined) dbUpdates.mini_login = updates.miniLogin;
    if (updates.fullLogin !== undefined) dbUpdates.full_login = updates.fullLogin;
    if (updates.walkingStatus !== undefined) dbUpdates.walking_status = updates.walkingStatus;
    if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.productType !== undefined) dbUpdates.product_type = updates.productType;
    if (updates.finalRequirement !== undefined) dbUpdates.final_requirement = updates.finalRequirement;
    if (updates.collateralValue !== undefined) dbUpdates.collateral_value = updates.collateralValue;
    await supabase.from('meetings').update(dbUpdates).eq('id', meetingId);
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, ...updates } : m));
  }, []);

  const addMeetingRequest = useCallback(async (req: MeetingRequest) => {
    await supabase.from('meeting_requests').insert({
      id: req.id, lead_id: req.leadId, bo_id: req.boId,
      tc_id: req.tcId, status: req.status,
    });
    setMeetingRequests(prev => [...prev, req]);
  }, []);

  const updateMeetingRequest = useCallback(async (reqId: string, updates: Partial<MeetingRequest>) => {
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    await supabase.from('meeting_requests').update(dbUpdates).eq('id', reqId);
    setMeetingRequests(prev => prev.map(r => r.id === reqId ? { ...r, ...updates } : r));
  }, []);

  const addRemark = useCallback(async (remark: Omit<LeadRemark, 'id' | 'updatedAt'>) => {
    const { data } = await supabase
      .from('lead_remarks')
      .insert({ lead_id: remark.leadId, remark: remark.remark, created_by: remark.createdBy })
      .select().single();
    if (data) setLeadRemarks(prev => [mapRemark(data), ...prev]);
  }, []);

  const updateRemark = useCallback(async (remarkId: string, newText: string) => {
    await supabase.from('lead_remarks').update({ remark: newText, updated_at: new Date().toISOString() }).eq('id', remarkId);
    setLeadRemarks(prev => prev.map(r => r.id === remarkId ? { ...r, remark: newText } : r));
  }, []);

  const deleteRemark = useCallback(async (remarkId: string) => {
    await supabase.from('lead_remarks').delete().eq('id', remarkId);
    setLeadRemarks(prev => prev.filter(r => r.id !== remarkId));
  }, []);

  const deleteDuplicateLead = useCallback(async (id: string) => {
    await supabase.from('duplicate_leads').delete().eq('id', id);
    setDuplicateLeads(prev => prev.filter(d => d.id !== id));
  }, []);

  const mergeDuplicateLead = useCallback(async (duplicateId: string) => {
    // Merging means the duplicate is resolved: simply remove the duplicate record.
    // The original lead remains as the canonical entry.
    await supabase.from('duplicate_leads').delete().eq('id', duplicateId);
    setDuplicateLeads(prev => prev.filter(d => d.id !== duplicateId));
  }, []);

  const addMeetingRemark = useCallback(async (meetingId: string, remark: string, createdBy: string) => {
    const { data } = await supabase
      .from('meeting_remarks')
      .insert({ meeting_id: meetingId, remark, created_by: createdBy })
      .select().single();
    if (data) setMeetingRemarks(prev => [mapMeetingRemark(data), ...prev]);
  }, []);

  const addLoginUpdate = useCallback(async (meetingId: string, loginType: LoginHistory['loginType'], createdBy: string) => {
    await (supabase as any).from('login_history').insert({
      meeting_id: meetingId,
      login_type: loginType,
      created_by: createdBy,
    });
    // Update the meeting boolean fields and auto-convert to 'Converted by BDM'
    const updates: any = { bdoStatus: 'Converted by BDM' };
    if (loginType === 'Mini Login') updates.miniLogin = true;
    if (loginType === 'Full Login') updates.fullLogin = true;
    if (loginType === 'Both') { updates.miniLogin = true; updates.fullLogin = true; }
    await supabase.from('meetings').update({
      bdo_status: updates.bdoStatus,
      ...(updates.miniLogin !== undefined && { mini_login: updates.miniLogin }),
      ...(updates.fullLogin !== undefined && { full_login: updates.fullLogin }),
    }).eq('id', meetingId);
    await fetchAllData();
  }, [fetchAllData]);

  return (
    <CRMContext.Provider value={{
      currentUser, users, leads, teams, meetings, meetingRequests, leadRemarks, duplicateLeads, meetingRemarks, loginHistory, loading,
      login, logout, refreshData,
      addLeads, updateLead,
      addUser, updateUser, removeUser,
      addTeam, updateTeam, updateTeamMembers, deleteTeam,
      addMeeting, updateMeeting,
      addMeetingRequest, updateMeetingRequest,
      addRemark, updateRemark, deleteRemark,
      deleteDuplicateLead, mergeDuplicateLead,
      addMeetingRemark, addLoginUpdate,
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within CRMProvider');
  return ctx;
}