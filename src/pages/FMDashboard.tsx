import { useState, useMemo, useRef, useEffect } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { supabase } from '@/integrations/supabase/client';
import { useLoading } from '@/hooks/use-loading';
import DashboardLayout, { LayoutDashboard, Users, Upload, Calendar, UserCircle, BarChart3, FolderOpen, Briefcase } from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import DateRangeFilter from '@/components/DateRangeFilter';
import DetailDataTable from '@/components/DetailDataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { User, Lead, UserRole, NumberStatus, LeadStatus, DuplicateLead } from '@/types/crm';
import { Plus, Trash2, Upload as UploadIcon, ChevronDown, ChevronRight, Edit2, UserPlus, UserMinus, Download, ClipboardPaste, Footprints, Eye, GitMerge, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DoubleConfirmModal } from '@/components/ui/DoubleConfirmModal';




const navItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, id: 'dashboard' },
  { label: 'User Management', icon: <Users className="w-4 h-4" />, id: 'users' },
  { label: 'Team Management', icon: <UserCircle className="w-4 h-4" />, id: 'teams' },
  { label: 'Upload Leads', icon: <Upload className="w-4 h-4" />, id: 'leads' },
  { label: 'BDM Performance', icon: <BarChart3 className="w-4 h-4" />, id: 'bdm' },
  { label: 'BDO Performance', icon: <Briefcase className="w-4 h-4" />, id: 'bdo' },
  { label: 'Duplicate Leads', icon: <FolderOpen className="w-4 h-4" />, id: 'duplicates' },
];

export default function FMDashboard() {
  const { users, leads, teams, meetings, duplicateLeads, addUser, updateUser, removeUser, addLeads, addTeam, updateTeam, updateTeamMembers, deleteTeam, deleteDuplicateLead, mergeDuplicateLead } = useCRM();
  // loader
  const { withLoading, isLoading } = useLoading();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedTC, setExpandedTC] = useState<string | null>(null);
  const [showConnectedDetail, setShowConnectedDetail] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  // green dot online status
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ userId: string }>();
        const ids = new Set(Object.values(state).flat().map((p) => p.userId));
        setOnlineUserIds(ids);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // User mgmt state
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'BO' as UserRole, tcId: '' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('BO');
  const [editTCId, setEditTCId] = useState('');

  // Lead upload state
  const [leadInput, setLeadInput] = useState({ clientName: '', phoneNumber: '', loanRequirement: '' });
  const [selectedBOs, setSelectedBOs] = useState<string[]>([]);
  // Delete modal state
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteData, setPasteData] = useState('');

  // Duplicate leads state
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateLead | null>(null);
  const [duplicateToDelete, setDuplicateToDelete] = useState<string | null>(null);
  const [duplicateToMerge, setDuplicateToMerge] = useState<DuplicateLead | null>(null);

  // Pre-save upload confirmation state
  const [pendingUpload, setPendingUpload] = useState<{
    newLeads: Lead[];
    dupes: DuplicateLead[];
    isManual: boolean;
  } | null>(null);

  // Team management state
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamTC, setNewTeamTC] = useState('');
  const [newTeamBOs, setNewTeamBOs] = useState<string[]>([]);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [changeTCTeamId, setChangeTCTeamId] = useState<string | null>(null);
  const [newTCForTeam, setNewTCForTeam] = useState('');

  const bos = users.filter(u => u.role === 'BO' && u.active);
  const tcs = users.filter(u => u.role === 'TC' && u.active);
  const bdms = users.filter(u => u.role === 'BDM' && u.active);
  const bdos = users.filter(u => u.role === 'BDO' && u.active);
  const assignedBOIds = teams.flatMap(t => t.boIds);
  const unassignedBOs = bos.filter(b => !assignedBOIds.includes(b.id));

  const filteredLeads = useMemo(() => {
    let filtered = leads;
    if (fromDate) { const from = fromDate.toISOString().split('T')[0]; filtered = filtered.filter(l => l.assignedDate >= from); }
    if (toDate) { const to = toDate.toISOString().split('T')[0]; filtered = filtered.filter(l => l.assignedDate <= to); }
    return filtered;
  }, [leads, fromDate, toDate]);

  const filteredMeetings = useMemo(() => {
    let filtered = meetings;
    if (fromDate) { const from = fromDate.toISOString().split('T')[0]; filtered = filtered.filter(m => m.date >= from); }
    if (toDate) { const to = toDate.toISOString().split('T')[0]; filtered = filtered.filter(m => m.date <= to); }
    return filtered;
  }, [meetings, fromDate, toDate]);

  const getLeadsForBO = (boId: string) => filteredLeads.filter(l => l.assignedBOId === boId);
  const getNumberStatusCount = (boLeads: Lead[], status: NumberStatus) => boLeads.filter(l => l.numberStatus === status).length;
  const getLeadStatusCount = (boLeads: Lead[], status: LeadStatus) => boLeads.filter(l => l.leadStatus === status).length;

  // Walking meetings count
  const walkinMeetings = filteredMeetings.filter(m => m.meetingType === 'Walk-in' && (m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up'));

  // const handleAddUser = async () => {
  //   if (!newUser.name || !newUser.username || !newUser.password) { toast.error('Fill all fields'); return; }
  //   if (users.find(u => u.username === newUser.username)) { toast.error('Username already exists'); return; }
  //   const userId = crypto.randomUUID();
  //   const user: User = { id: userId, name: newUser.name, username: newUser.username, role: newUser.role, active: true };

  //   if (newUser.role === 'BO' && newUser.tcId) {
  //     const team = teams.find(t => t.tcId === newUser.tcId);
  //     if (team) {
  //       user.teamId = team.id;
  //       await updateTeamMembers(team.id, [...team.boIds, userId]);
  //     }
  //   }

  //   if (newUser.role === 'TC') {
  //     const teamId = `team_${Date.now()}`;
  //     user.teamId = teamId;
  //     await addTeam({ id: teamId, name: `${newUser.name}'s Team`, tcId: userId, boIds: [] });
  //   }

  //   await addUser(user);
  //   setNewUser({ name: '', username: '', password: '', role: 'BO', tcId: '' });
  //   setShowAddUser(false);
  //   toast.success('User added');
  // };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.password) {
      toast.error('Fill all fields')
      return
    }
    if (users.find(u => u.username === newUser.username)) {
      toast.error('Username already exists')
      return
    }

    try {
      const user: User = {
        id: crypto.randomUUID(),
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        active: true,
      }

      if (newUser.role === 'BO' && newUser.tcId) {
        const team = teams.find(t => t.tcId === newUser.tcId)
        if (team) {
          user.teamId = team.id
          await updateTeamMembers(team.id, [...team.boIds, user.id])
        }
      }

      if (newUser.role === 'TC') {
        const teamId = `team_${Date.now()}`
        user.teamId = teamId
        await addTeam({ id: teamId, name: `${newUser.name}'s Team`, tcId: user.id, boIds: [] })
      }

      await addUser(user, newUser.password)  // ← password bhi pass karo
      setNewUser({ name: '', username: '', password: '', role: 'BO', tcId: '' })
      toast.success('User added successfully')
    } catch (err) {
      toast.error('Failed to create user')
    }
  }

  const handleEditRole = async (userId: string) => {
    await updateUser(userId, { role: editRole });
    if (editRole === 'BO' && editTCId) {
      for (const t of teams) {
        if (t.boIds.includes(userId)) {
          await updateTeamMembers(t.id, t.boIds.filter(id => id !== userId));
        }
      }
      const targetTeam = teams.find(t => t.tcId === editTCId);
      if (targetTeam) {
        await updateTeamMembers(targetTeam.id, [...targetTeam.boIds, userId]);
      }
    }
    setEditingUser(null);
    toast.success('User updated');
  };

  // Process leads from rows
  const processLeadRows = async (rows: any[]) => {
    if (selectedBOs.length === 0) { toast.error('Select at least one BO for distribution'); return; }
    let added = 0;
    const today = new Date().toISOString().split('T')[0];
    const newLeads: Lead[] = [];
    const dupes: DuplicateLead[] = [];

    rows.forEach((row: any, idx: number) => {
      const clientName = row['Client Name'] || row['client_name'] || row['Name'] || row['name'] || '';
      // Strip all non-digit characters from phone number
      const rawPhone = String(row['Phone Number'] || row['phone_number'] || row['Phone'] || row['phone'] || '').trim();
      const phoneNumber = rawPhone.replace(/\D/g, '');
      const loanRequirement = String(row['Loan Requirement'] || row['loan_requirement'] || row['Loan Amount'] || row['amount'] || row['Loan Requirement Amount'] || '');
      if (!clientName || !phoneNumber) return;

      const existing = leads.find(l => l.phoneNumber === phoneNumber) || newLeads.find(l => l.phoneNumber === phoneNumber);
      if (existing) {
        const bo = users.find(u => u.id === existing.assignedBOId);
        dupes.push({
          id: crypto.randomUUID(), clientName, phoneNumber, loanRequirement,
          originalLeadId: existing.id, originalBoName: bo?.name || 'Unknown',
          uploadedBy: users.find(u => u.id === undefined)?.name, uploadedAt: new Date().toISOString(),
        });
        return;
      }

      const boId = selectedBOs[added % selectedBOs.length];
      newLeads.push({
        id: `l${Date.now()}_${idx}`, clientName, phoneNumber, loanRequirement,
        numberStatus: '', leadStatus: '', leadType: '', assignedBOId: boId,
        assignedDate: today, meetingRequested: false, meetingApproved: false,
      });
      added++;
    });

    if (newLeads.length === 0 && dupes.length === 0) {
      toast.error('No valid data found');
      return;
    }

    if (dupes.length > 0) {
      // Show confirmation popup before saving
      setPendingUpload({ newLeads, dupes, isManual: false });
    } else {
      // No duplicates, safe to add immediately
      await addLeads(newLeads);
      toast.success(`${added} leads uploaded successfully.`);
    }
  };

  // Excel upload
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);
      await processLeadRows(rows);
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Paste from Excel
  const handlePasteImport = async () => {
    if (!pasteData.trim()) { toast.error('Paste data first'); return; }
    const lines = pasteData.trim().split('\n');
    if (lines.length < 2) { toast.error('Need header row + data'); return; }

    const headers = lines[0].split('\t').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const vals = line.split('\t');
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = vals[i]?.trim() || ''; });
      return obj;
    });
    await processLeadRows(rows);
    setPasteData('');
  };

  const handleAddLead = async () => {
    if (!leadInput.clientName || !leadInput.phoneNumber || !leadInput.loanRequirement) { toast.error('Fill all fields'); return; }
    if (!/^\d+$/.test(leadInput.phoneNumber)) { toast.error('Phone number must contain digits only'); return; }
    if (selectedBOs.length === 0) { toast.error('Select at least one BO'); return; }

    const duplicate = leads.find(l => l.phoneNumber === leadInput.phoneNumber);
    if (duplicate) {
      const assignedBO = users.find(u => u.id === duplicate.assignedBOId);

      const dupeObj: DuplicateLead = {
        id: crypto.randomUUID(),
        clientName: leadInput.clientName,
        phoneNumber: leadInput.phoneNumber,
        loanRequirement: leadInput.loanRequirement,
        originalLeadId: duplicate.id,
        originalBoName: assignedBO?.name || 'Unknown',
        uploadedBy: users.find(u => u.id === undefined)?.name,
        uploadedAt: new Date().toISOString()
      };

      // Detected duplicate, prompt for confirmation instead of rejecting
      setPendingUpload({ newLeads: [], dupes: [dupeObj], isManual: true });
      return;
    }

    const boId = selectedBOs[Math.floor(Math.random() * selectedBOs.length)];
    const today = new Date().toISOString().split('T')[0];
    await addLeads([{
      id: `l${Date.now()}`, clientName: leadInput.clientName, phoneNumber: leadInput.phoneNumber,
      loanRequirement: leadInput.loanRequirement, numberStatus: '', leadStatus: '', leadType: '',
      assignedBOId: boId, assignedDate: today, meetingRequested: false, meetingApproved: false,
    }]);
    setLeadInput({ clientName: '', phoneNumber: '', loanRequirement: '' });
    toast.success(`Lead assigned to ${users.find(u => u.id === boId)?.name}`);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName || !newTeamTC) { toast.error('Enter team name and select TC'); return; }
    const teamId = `team_${Date.now()}`;
    await addTeam({ id: teamId, name: newTeamName, tcId: newTeamTC, boIds: newTeamBOs });
    await updateUser(newTeamTC, { teamId: teamId });
    for (const boId of newTeamBOs) {
      await updateUser(boId, { teamId: teamId });
    }
    setNewTeamName(''); setNewTeamTC(''); setNewTeamBOs([]); setShowCreateTeam(false);
    toast.success('Team created');
  };

  const handleAddBOToTeam = async (teamId: string, boId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    for (const t of teams) {
      if (t.boIds.includes(boId)) {
        await updateTeamMembers(t.id, t.boIds.filter(id => id !== boId));
      }
    }
    await updateTeamMembers(teamId, [...team.boIds.filter(id => id !== boId), boId]);
    await updateUser(boId, { teamId });
    toast.success('BO added to team');
  };

  const handleRemoveBOFromTeam = async (teamId: string, boId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    await updateTeamMembers(teamId, team.boIds.filter(id => id !== boId));
    await updateUser(boId, { teamId: undefined });
    toast.success('BO removed from team');
  };

  const handleChangeTC = async (teamId: string) => {
    if (!newTCForTeam) { toast.error('Select a TC'); return; }
    await updateTeam(teamId, { tcId: newTCForTeam });
    await updateUser(newTCForTeam, { teamId });
    setChangeTCTeamId(null);
    setNewTCForTeam('');
    toast.success('TC changed');
  };

  const getDetailData = () => {
    switch (detailView) {
      case 'total': return { title: 'Total Leads', data: filteredLeads };
      case 'connected': return { title: 'Connected Leads', data: filteredLeads.filter(l => l.numberStatus === 'Connected') };
      case 'not_connected': return { title: 'Not Connected Leads', data: filteredLeads.filter(l => l.numberStatus === 'Not Connected') };
      case 'mobile_off': return { title: 'Mobile Off', data: filteredLeads.filter(l => l.numberStatus === 'Mobile Off') };
      case 'incoming_barred': return { title: 'Incoming Barred', data: filteredLeads.filter(l => l.numberStatus === 'Incoming Barred') };
      case 'invalid_number': return { title: 'Invalid Number', data: filteredLeads.filter(l => l.numberStatus === 'Invalid Number') };
      case 'interested': return { title: 'Interested', data: filteredLeads.filter(l => l.leadStatus === 'Interested') };
      case 'not_interested': return { title: 'Not Interested', data: filteredLeads.filter(l => l.leadStatus === 'Not Interested') };
      case 'pending': return { title: 'Pending', data: filteredLeads.filter(l => l.leadStatus === 'Pending') };
      case 'eligible': return { title: 'Eligible', data: filteredLeads.filter(l => l.leadStatus === 'Eligible') };
      case 'not_eligible': return { title: 'Not Eligible', data: filteredLeads.filter(l => l.leadStatus === 'Not Eligible') };
      case 'language_barrier': return { title: 'Language Barrier', data: filteredLeads.filter(l => l.leadStatus === 'Language Barrier') };
      case 'total_bos': return { title: 'All Business Officers', data: filteredLeads };
      case 'total_meetings': return { title: 'All Meetings', data: filteredLeads, meetings: filteredMeetings };
      case 'walkin': return { title: 'Walk-in Meetings', data: filteredLeads, meetings: walkinMeetings };
      default: return null;
    }
  };

  return (
    <DashboardLayout navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1">Team performance overview</p>
          </div>
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />

          {detailView ? (
            (() => {
              const detail = getDetailData();
              if (!detail) return null;
              return <DetailDataTable title={detail.title} leads={detail.data} users={users} meetings={detail.meetings} onBack={() => setDetailView(null)} showMeetingDetails={detailView === 'total_meetings' || detailView === 'walkin'} />;
            })()
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <StatCard label="Total Leads" value={filteredLeads.length} variant="primary" onClick={() => setDetailView('total')} />
                <StatCard label="Connected" value={filteredLeads.filter(l => l.numberStatus === 'Connected').length} variant="primary" onClick={() => setDetailView('connected')} />
                <StatCard label="Not Connected" value={filteredLeads.filter(l => l.numberStatus === 'Not Connected').length} onClick={() => setDetailView('not_connected')} />
                <StatCard label="Total BOs" value={bos.length} variant="accent" onClick={() => setDetailView('total_bos')} />
                <StatCard label="Total Meetings" value={filteredMeetings.length} variant="info" onClick={() => setDetailView('total_meetings')} />
                <StatCard label="Walk-in" value={walkinMeetings.length} variant="accent" onClick={() => setDetailView('walkin')} />
              </div>

              {/* Number Status Breakdown */}
              <Card>
                <CardHeader><CardTitle className="text-lg font-display">Number Status Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <StatCard label="Connected" value={filteredLeads.filter(l => l.numberStatus === 'Connected').length} variant="primary" onClick={() => setDetailView('connected')} />
                    <StatCard label="Not Connected" value={filteredLeads.filter(l => l.numberStatus === 'Not Connected').length} onClick={() => setDetailView('not_connected')} />
                    <StatCard label="Mobile Off" value={filteredLeads.filter(l => l.numberStatus === 'Mobile Off').length} onClick={() => setDetailView('mobile_off')} />
                    <StatCard label="Incoming Barred" value={filteredLeads.filter(l => l.numberStatus === 'Incoming Barred').length} onClick={() => setDetailView('incoming_barred')} />
                    <StatCard label="Invalid Number" value={filteredLeads.filter(l => l.numberStatus === 'Invalid Number').length} onClick={() => setDetailView('invalid_number')} />
                  </div>
                </CardContent>
              </Card>

              {/* Connected Breakdown */}
              <Card>
                <CardHeader><CardTitle className="text-lg font-display">Connected Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <StatCard label="Interested" value={filteredLeads.filter(l => l.leadStatus === 'Interested').length} variant="primary" onClick={() => setDetailView('interested')} />
                    <StatCard label="Not Interested" value={filteredLeads.filter(l => l.leadStatus === 'Not Interested').length} onClick={() => setDetailView('not_interested')} />
                    <StatCard label="Pending" value={filteredLeads.filter(l => l.leadStatus === 'Pending').length} onClick={() => setDetailView('pending')} />
                    <StatCard label="Eligible" value={filteredLeads.filter(l => l.leadStatus === 'Eligible').length} variant="accent" onClick={() => setDetailView('eligible')} />
                    <StatCard label="Not Eligible" value={filteredLeads.filter(l => l.leadStatus === 'Not Eligible').length} onClick={() => setDetailView('not_eligible')} />
                    <StatCard label="Language Barrier" value={filteredLeads.filter(l => l.leadStatus === 'Language Barrier').length} onClick={() => setDetailView('language_barrier')} />
                  </div>
                </CardContent>
              </Card>

              {/* Team Summary */}
              <Card>
                <CardHeader><CardTitle className="text-lg font-display">Team Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {teams.map(team => {
                    const tc = users.find(u => u.id === team.tcId);
                    const teamLeads = filteredLeads.filter(l => team.boIds.includes(l.assignedBOId));
                    const isExpanded = expandedTC === team.id;
                    return (
                      <div key={team.id} className="border border-border rounded-lg overflow-hidden">
                        <button onClick={() => setExpandedTC(isExpanded ? null : team.id)} className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span className="font-semibold">{tc?.name} — {team.name}</span>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Connected: {getNumberStatusCount(teamLeads, 'Connected')}</span>
                            <span>Not Connected: {getNumberStatusCount(teamLeads, 'Not Connected')}</span>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border p-4 space-y-2 bg-secondary/20">
                            {team.boIds.map(boId => {
                              const bo = users.find(u => u.id === boId);
                              const boLeads = getLeadsForBO(boId);
                              const showDetail = showConnectedDetail === boId;
                              return (
                                <div key={boId} className="border border-border rounded-lg p-3 bg-card">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{bo?.name}</span>
                                    <div className="flex gap-3 text-xs text-muted-foreground">
                                      <button onClick={() => setShowConnectedDetail(showDetail ? null : boId)} className="text-primary font-medium hover:underline">
                                        Connected: {getNumberStatusCount(boLeads, 'Connected')}
                                      </button>
                                      <span>Not Conn: {getNumberStatusCount(boLeads, 'Not Connected')}</span>
                                      <span>Off: {getNumberStatusCount(boLeads, 'Mobile Off')}</span>
                                    </div>
                                  </div>
                                  {showDetail && (
                                    <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-2 animate-fade-in">
                                      <StatCard label="Interested" value={getLeadStatusCount(boLeads, 'Interested')} />
                                      <StatCard label="Not Interested" value={getLeadStatusCount(boLeads, 'Not Interested')} />
                                      <StatCard label="Pending" value={getLeadStatusCount(boLeads, 'Pending')} />
                                      <StatCard label="Eligible" value={getLeadStatusCount(boLeads, 'Eligible')} />
                                      <StatCard label="Not Eligible" value={getLeadStatusCount(boLeads, 'Not Eligible')} />
                                      <StatCard label="Lang. Barrier" value={getLeadStatusCount(boLeads, 'Language Barrier')} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold">User Management</h2>
              <p className="text-sm text-muted-foreground mt-1">Add, edit, and manage users</p>
            </div>
            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add User</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Name</Label><Input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>Username</Label><Input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} /></div>
                  <div><Label>Password</Label><Input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} /></div>
                  <div>
                    <Label>Role</Label>
                    <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v as UserRole }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BO">Business Officer</SelectItem>
                        <SelectItem value="TC">Team Captain</SelectItem>
                        <SelectItem value="BDM">Business Dev Manager</SelectItem>
                        <SelectItem value="BDO">Business Dev Officer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newUser.role === 'BO' && (
                    <div>
                      <Label>Assign to TC</Label>
                      <Select value={newUser.tcId} onValueChange={v => setNewUser(p => ({ ...p, tcId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select TC" /></SelectTrigger>
                        <SelectContent>{tcs.map(tc => <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  {/* <Button onClick={handleAddUser} className="w-full">Add User</Button> */}
                  <Button
                    disabled={isLoading('add_user')}
                    onClick={() => withLoading('add_user', handleAddUser)}
                    className="w-full">
                    {isLoading('add_user') ? 'Adding...' : 'Add User'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Role</TableHead><TableHead>Team</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.filter(u => u.role !== 'FM').map(user => {
                    const userTeam = teams.find(t => t.boIds.includes(user.id) || t.tcId === user.id);
                    const isEditing = editingUser === user.id;
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select value={editRole} onValueChange={v => setEditRole(v as UserRole)}>
                              <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BO">BO</SelectItem>
                                <SelectItem value="TC">TC</SelectItem>
                                <SelectItem value="BDM">BDM</SelectItem>
                                <SelectItem value="BDO">BDO</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : <Badge variant="secondary">{user.role}</Badge>}
                        </TableCell>
                        <TableCell>
                          {isEditing && editRole === 'BO' ? (
                            <Select value={editTCId} onValueChange={setEditTCId}>
                              <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Select TC" /></SelectTrigger>
                              <SelectContent>{tcs.map(tc => <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>)}</SelectContent>
                            </Select>
                          ) : <span className="text-sm text-muted-foreground">{userTeam?.name || '—'}</span>}
                        </TableCell>
                        <TableCell>
                          <Switch checked={user.active} onCheckedChange={checked => updateUser(user.id, { active: checked })} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {isEditing ? (
                              <>
                                {/* <Button size="sm" onClick={() => handleEditRole(user.id)}>Save</Button> */}
                                <Button size="sm"
                                  disabled={isLoading(`edit_role_${user.id}`)}
                                  onClick={() => withLoading(`edit_role_${user.id}`, () => handleEditRole(user.id))}>
                                  {isLoading(`edit_role_${user.id}`) ? 'Saving...' : 'Save'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingUser(user.id); setEditRole(user.role); setEditTCId(''); }}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setUserToDelete(user.id)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold">Team Management</h2>
              <p className="text-sm text-muted-foreground mt-1">Create teams, assign TC and BOs</p>
            </div>
            <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Create Team</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New Team</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Team Name</Label><Input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. Alpha Team" /></div>
                  <div>
                    <Label>Assign TC</Label>
                    <Select value={newTeamTC} onValueChange={setNewTeamTC}>
                      <SelectTrigger><SelectValue placeholder="Select TC" /></SelectTrigger>
                      <SelectContent>{tcs.filter(tc => !teams.some(t => t.tcId === tc.id)).map(tc => <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assign BOs</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {unassignedBOs.map(bo => (
                        <button key={bo.id} onClick={() => setNewTeamBOs(prev => prev.includes(bo.id) ? prev.filter(id => id !== bo.id) : [...prev, bo.id])}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${newTeamBOs.includes(bo.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-foreground'}`}>
                          {bo.name}
                        </button>
                      ))}
                      {unassignedBOs.length === 0 && <span className="text-sm text-muted-foreground">No unassigned BOs</span>}
                    </div>
                  </div>
                  {/* <Button onClick={handleCreateTeam} className="w-full">Create Team</Button> */}

                  <Button
                    disabled={isLoading('create_team')}
                    onClick={() => withLoading('create_team', handleCreateTeam)}
                    className="w-full">
                    {isLoading('create_team') ? 'Creating...' : 'Create Team'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {teams.map(team => {
              const tc = users.find(u => u.id === team.tcId);
              const isEditing = editingTeam === team.id;
              return (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {team.name}
                        <Badge variant="outline">TC: {tc?.name}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setChangeTCTeamId(changeTCTeamId === team.id ? null : team.id); setNewTCForTeam(''); }}>
                          Change TC
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTeam(isEditing ? null : team.id)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setTeamToDelete(team.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {changeTCTeamId === team.id && (
                      <div className="mb-4 p-3 bg-secondary/50 rounded-lg flex gap-3 items-end">
                        <div className="flex-1">
                          <Label className="text-xs">New TC</Label>
                          <Select value={newTCForTeam} onValueChange={setNewTCForTeam}>
                            <SelectTrigger><SelectValue placeholder="Select TC" /></SelectTrigger>
                            <SelectContent>{tcs.filter(tc => tc.id !== team.tcId).map(tc => <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        {/* <Button size="sm" onClick={() => handleChangeTC(team.id)}>Save</Button> */}
                        <Button size="sm"
                          disabled={isLoading(`change_tc_${team.id}`)}
                          onClick={() => withLoading(`change_tc_${team.id}`, () => handleChangeTC(team.id))}>
                          {isLoading(`change_tc_${team.id}`) ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mb-3">Business Officers:</p>
                    <div className="flex flex-wrap gap-2">
                      {team.boIds.map(boId => {
                        const bo = users.find(u => u.id === boId);
                        return (
                          <div key={boId} className="flex items-center gap-1">
                            <Badge>{bo?.name}</Badge>
                            {isEditing && (
                              <button
                                disabled={isLoading(`remove_bo_${boId}`)}
                                onClick={() => withLoading(`remove_bo_${boId}`, () => handleRemoveBOFromTeam(team.id, boId))}
                                className="text-destructive hover:text-destructive/80 disabled:opacity-50">
                                <UserMinus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {team.boIds.length === 0 && <span className="text-sm text-muted-foreground">No BOs assigned</span>}
                    </div>
                    {isEditing && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm font-medium mb-2">Add BO to this team:</p>
                        <div className="flex flex-wrap gap-2">
                          {bos.filter(b => !team.boIds.includes(b.id)).map(bo => (
                            <Button key={bo.id} size="sm" variant="outline"
                              disabled={isLoading(`add_bo_${bo.id}`)}
                              onClick={() => withLoading(`add_bo_${bo.id}`, () => handleAddBOToTeam(team.id, bo.id))}>
                              <UserPlus className="w-3 h-3 mr-1" />{isLoading(`add_bo_${bo.id}`) ? 'Adding...' : bo.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Upload Leads</h2>
            <p className="text-sm text-muted-foreground mt-1">Add leads via Excel, paste, or manually</p>
          </div>

          {/* BO Selection */}
          <Card>
            <CardHeader><CardTitle className="text-base">Select BOs for Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {bos.map(bo => {
                  const isOnline = onlineUserIds.has(bo.id);
                  return (
                    <button key={bo.id} onClick={() => setSelectedBOs(prev => prev.includes(bo.id) ? prev.filter(id => id !== bo.id) : [...prev, bo.id])}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors flex items-center gap-2 ${selectedBOs.includes(bo.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-foreground hover:bg-secondary/80'}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {bo.name}
                    </button>
                  );
                })}
              </div>
              {selectedBOs.length > 0 && <p className="text-xs text-muted-foreground mt-2">{selectedBOs.length} BOs selected</p>}
            </CardContent>
          </Card>

          {/* Excel Upload */}
          <Card>
            <CardHeader><CardTitle className="text-base">Excel Upload</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Upload an Excel file with columns: Client Name, Phone Number, Loan Requirement Amount</p>
              <div className="flex gap-3">
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()}><UploadIcon className="w-4 h-4 mr-2" />Upload Excel File</Button>
              </div>
            </CardContent>
          </Card>

          {/* Paste from Excel */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardPaste className="w-4 h-4" />Paste from Excel</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Copy data from Excel (including headers) and paste below. Headers: Client Name, Phone Number, Loan Requirement Amount</p>
              <Textarea
                value={pasteData}
                onChange={e => setPasteData(e.target.value)}
                placeholder="Paste Excel data here (Tab-separated with headers)..."
                rows={6}
                className="font-mono text-xs"
              />
              <Button
                disabled={!pasteData.trim() || isLoading('paste_import')}
                onClick={() => withLoading('paste_import', handlePasteImport)}>
                <ClipboardPaste className="w-4 h-4 mr-2" />{isLoading('paste_import') ? 'Importing...' : 'Import Pasted Data'}
              </Button>
            </CardContent>
          </Card>

          {/* Manual Lead */}
          <Card>
            <CardHeader><CardTitle className="text-base">Add Lead Manually</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div><Label>Client Name</Label><Input value={leadInput.clientName} onChange={e => setLeadInput(p => ({ ...p, clientName: e.target.value }))} /></div>
                <div><Label>Phone Number</Label><Input
                  inputMode="numeric"
                  value={leadInput.phoneNumber}
                  onChange={e => setLeadInput(p => ({ ...p, phoneNumber: e.target.value.replace(/\D/g, '') }))}
                  placeholder="e.g. 9876543210"
                /></div>
                <div><Label>Loan Requirement</Label><Input value={leadInput.loanRequirement} onChange={e => setLeadInput(p => ({ ...p, loanRequirement: e.target.value }))} placeholder="Amount or text" /></div>
              </div>
              {/* <Button onClick={handleAddLead}><UploadIcon className="w-4 h-4 mr-2" />Add & Distribute Lead</Button> */}
              <Button
                disabled={isLoading('add_lead')}
                onClick={() => withLoading('add_lead', handleAddLead)}>
                <UploadIcon className="w-4 h-4 mr-2" />{isLoading('add_lead') ? 'Adding...' : 'Add & Distribute Lead'}
              </Button>
            </CardContent>
          </Card>

          {/* All Leads */}
          <Card>
            <CardHeader><CardTitle className="text-base">All Leads ({leads.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead><TableHead>Phone</TableHead><TableHead>Loan Amt</TableHead><TableHead>Assigned BO</TableHead><TableHead>Number Status</TableHead><TableHead>Lead Status</TableHead><TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map(lead => {
                    const bo = users.find(u => u.id === lead.assignedBOId);
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.clientName}</TableCell>
                        <TableCell>{lead.phoneNumber}</TableCell>
                        <TableCell>₹{lead.loanRequirement}</TableCell>
                        <TableCell>{bo?.name}</TableCell>
                        <TableCell><Badge variant={lead.numberStatus === 'Connected' ? 'default' : 'secondary'}>{lead.numberStatus || '—'}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{lead.leadStatus || '—'}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{lead.assignedDate}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'bdm' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">BDM Performance</h2>
            <p className="text-sm text-muted-foreground mt-1">Track business development manager outcomes</p>
          </div>
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
          <div className="grid md:grid-cols-2 gap-4">
            {bdms.map(bdm => {
              const bdmMeetings = filteredMeetings.filter(m => m.bdmId === bdm.id);
              const done = bdmMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up').length;
              const converted = bdmMeetings.filter(m => m.status === 'Converted').length;
              const followUp = bdmMeetings.filter(m => m.status === 'Follow-Up').length;
              const walkins = bdmMeetings.filter(m => m.meetingType === 'Walk-in' && (m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up'));
              const rate = done > 0 ? ((converted / done) * 100).toFixed(1) : '0';
              return (
                <Card key={bdm.id}>
                  <CardHeader><CardTitle className="text-base">{bdm.name}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="Meeting Done" value={done} variant="primary" />
                      <StatCard label="Not Done" value={bdmMeetings.filter(m => m.status === 'Not Done').length} variant="destructive" />
                      <StatCard label="Converted" value={converted} variant="accent" />
                      <StatCard label="Follow-Up" value={followUp} variant="info" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-secondary text-center">
                        <span className="text-xs text-muted-foreground">Walk-in Done</span>
                        <p className="text-xl font-bold text-primary">{walkins.length}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary text-center">
                        <span className="text-xs text-muted-foreground">Conversion Rate</span>
                        <p className="text-xl font-bold text-primary">{rate}%</p>
                      </div>
                    </div>
                    {walkins.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Walk-in Dates:</p>
                        <div className="flex flex-wrap gap-1">
                          {walkins.map(w => (
                            <Badge key={w.id} variant="outline" className="text-xs">{w.walkinDate || w.date}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'duplicates' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Duplicate Leads</h2>
            <p className="text-sm text-muted-foreground mt-1">Leads skipped due to duplicate phone numbers — {duplicateLeads.length} record{duplicateLeads.length !== 1 ? 's' : ''}</p>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Meeting Status</TableHead>
                      <TableHead>Amount Required</TableHead>
                      <TableHead>Assigned BDO</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicateLeads.map(d => {
                      // Look up original lead → meeting → BDO details
                      const originalLead = leads.find(l => l.id === d.originalLeadId);
                      const meeting = originalLead ? meetings.find(m => m.leadId === originalLead.id) : undefined;
                      const meetingStatus = meeting?.status || '—';
                      const bdo = meeting?.bdoId ? users.find(u => u.id === meeting.bdoId) : undefined;
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.clientName}</TableCell>
                          <TableCell>{d.phoneNumber}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant={meetingStatus === 'Converted' ? 'default' : meetingStatus === 'Meeting Done' ? 'secondary' : 'outline'}>
                                {meetingStatus}
                              </Badge>
                              {meeting?.bdoStatus && <Badge variant="outline" className="text-[10px]">{meeting.bdoStatus}</Badge>}
                              {meeting?.walkingStatus && <Badge variant="outline" className="text-[10px]">{meeting.walkingStatus}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>₹{d.loanRequirement}</TableCell>
                          <TableCell>{bdo?.name || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(d.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="ghost" title="View Detail" onClick={() => setSelectedDuplicate(d)}>
                                <Eye className="w-4 h-4 text-primary" />
                              </Button>
                              <Button size="sm" variant="ghost" title="Merge Leads" onClick={() => setDuplicateToMerge(d)}>
                                <GitMerge className="w-4 h-4 text-blue-500" />
                              </Button>
                              <Button size="sm" variant="ghost" title="Delete Duplicate" onClick={() => setDuplicateToDelete(d.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {duplicateLeads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No duplicate leads found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Detail Dialog */}
          {selectedDuplicate && (() => {
            const d = selectedDuplicate;
            const originalLead = leads.find(l => l.id === d.originalLeadId);
            const meeting = originalLead ? meetings.find(m => m.leadId === originalLead.id) : undefined;
            const walkinMeeting = originalLead ? meetings.find(m => m.leadId === originalLead.id && m.meetingType === 'Walk-in') : undefined;
            const boUser = walkinMeeting ? users.find(u => u.id === walkinMeeting.boId) : (meeting ? users.find(u => u.id === meeting.boId) : undefined);
            const bdoUser = meeting?.bdoId ? users.find(u => u.id === meeting.bdoId) : undefined;
            const bdmUser = meeting?.bdmId ? users.find(u => u.id === meeting.bdmId) : undefined;
            return (
              <Dialog open={!!selectedDuplicate} onOpenChange={open => !open && setSelectedDuplicate(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-display">Duplicate Lead Detail</DialogTitle>
                  </DialogHeader>

                  {/* Section 1: Duplicate Lead Info */}
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Duplicate Lead
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Client Name</span><p className="font-medium mt-0.5">{d.clientName}</p></div>
                        <div><span className="text-muted-foreground">Phone Number</span><p className="font-medium mt-0.5">{d.phoneNumber}</p></div>
                        <div><span className="text-muted-foreground">Amount Required</span><p className="font-medium mt-0.5">₹{d.loanRequirement}</p></div>
                        <div><span className="text-muted-foreground">Created Date</span><p className="font-medium mt-0.5">{new Date(d.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
                        {meeting && (
                          <>
                            <div><span className="text-muted-foreground">Meeting Status</span>
                              <Badge className="mt-1" variant={meeting.status === 'Converted' ? 'default' : 'secondary'}>{meeting.status}</Badge>
                            </div>
                            <div><span className="text-muted-foreground">Assigned BDO</span><p className="font-medium mt-0.5">{bdoUser?.name || '—'}</p></div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Section 2: Original Lead Reference */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-400 mb-3">Original Lead Reference</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Reference ID</span>
                          <p className="font-mono text-xs mt-0.5 break-all bg-muted px-2 py-1 rounded">{d.originalLeadId || '—'}</p>
                        </div>
                        <div><span className="text-muted-foreground">Original BO</span><p className="font-medium mt-0.5">{d.originalBoName || '—'}</p></div>
                        {originalLead && (
                          <>
                            <div><span className="text-muted-foreground">Client Name</span><p className="font-medium mt-0.5">{originalLead.clientName}</p></div>
                            <div><span className="text-muted-foreground">Phone Number</span><p className="font-medium mt-0.5">{originalLead.phoneNumber}</p></div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Section 3: BO Walk-in Details */}
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h3 className="font-semibold text-sm text-green-800 dark:text-green-400 mb-3">Original BO Walk-in Details</h3>
                      {(walkinMeeting || meeting) ? (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-muted-foreground">BO Name</span><p className="font-medium mt-0.5">{boUser?.name || '—'}</p></div>
                          <div><span className="text-muted-foreground">BDM</span><p className="font-medium mt-0.5">{bdmUser?.name || '—'}</p></div>
                          <div><span className="text-muted-foreground">Meeting Type</span><p className="font-medium mt-0.5">{(walkinMeeting || meeting)?.meetingType || '—'}</p></div>
                          <div><span className="text-muted-foreground">Walk-in Date</span><p className="font-medium mt-0.5">{(walkinMeeting || meeting)?.walkinDate || '—'}</p></div>
                          <div><span className="text-muted-foreground">BDO Status</span>
                            <Badge className="mt-1" variant="outline">{(walkinMeeting || meeting)?.bdoStatus || '—'}</Badge>
                          </div>
                          <div><span className="text-muted-foreground">Walking Status</span>
                            <Badge className="mt-1" variant="outline">{(walkinMeeting || meeting)?.walkingStatus || '—'}</Badge>
                          </div>
                          <div><span className="text-muted-foreground">Mini Login</span><p className="font-medium mt-0.5">{(walkinMeeting || meeting)?.miniLogin ? 'Yes' : 'No'}</p></div>
                          <div><span className="text-muted-foreground">Full Login</span><p className="font-medium mt-0.5">{(walkinMeeting || meeting)?.fullLogin ? 'Yes' : 'No'}</p></div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No meeting/walk-in record found for the original lead.</p>
                      )}
                    </div>
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setSelectedDuplicate(null)}>Close</Button>
                    <Button variant="secondary" className="flex-1" onClick={() => { setSelectedDuplicate(null); setDuplicateToMerge(d); }}>
                      <GitMerge className="w-4 h-4 mr-2" />Merge Leads
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => { setSelectedDuplicate(null); setDuplicateToDelete(d.id); }}>
                      <Trash2 className="w-4 h-4 mr-2" />Delete Duplicate
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            );
          })()}

          {/* Delete Duplicate – Double Confirm */}
          <DoubleConfirmModal
            isOpen={!!duplicateToDelete}
            onClose={() => setDuplicateToDelete(null)}
            title="Delete Duplicate Lead"
            onConfirm={async () => {
              if (duplicateToDelete) {
                await deleteDuplicateLead(duplicateToDelete);
                toast.success('Duplicate lead deleted');
                setDuplicateToDelete(null);
              }
            }}
          />

          {/* Merge Leads – Double Confirm */}
          <DoubleConfirmModal
            isOpen={!!duplicateToMerge}
            onClose={() => setDuplicateToMerge(null)}
            title="Merge Leads"
            onConfirm={async () => {
              if (duplicateToMerge) {
                await mergeDuplicateLead(duplicateToMerge.id);
                toast.success('Leads merged — duplicate resolved');
                setDuplicateToMerge(null);
              }
            }}
          />
        </div>
      )}

      {activeTab === 'bdo' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">BDO Performance</h2>
            <p className="text-sm text-muted-foreground mt-1">Track business development officer outcomes</p>
          </div>
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
          <div className="grid md:grid-cols-2 gap-4">
            {bdos.map(bdo => {
              const bdoMeetings = filteredMeetings.filter(m => (m as any).bdo_id === bdo.id || m.bdoId === bdo.id);
              const allDoneMeetings = filteredMeetings.filter(m => m.status === 'Meeting Done');
              const convertedByBDM = allDoneMeetings.filter(m => m.bdoStatus === 'Converted by BDM');
              const followUps = allDoneMeetings.filter(m => m.bdoStatus === 'Follow-up');
              const walkingDone = allDoneMeetings.filter(m => m.walkingStatus === 'Walking Done' && m.bdoStatus !== 'Converted by BDM');
              const totalConverted = convertedByBDM.length + walkingDone.length;
              const pending = allDoneMeetings.filter(m => !m.bdoStatus || m.bdoStatus.length === 0).length;
              return (
                <Card key={bdo.id}>
                  <CardHeader><CardTitle className="text-base">{bdo.name}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="Pending" value={pending} variant="info" />
                      <StatCard label="Converted by BDM" value={convertedByBDM.length} variant="primary" />
                      <StatCard label="Follow-up" value={followUps.length} variant="accent" />
                      <StatCard label="Walking Done" value={walkingDone.length} variant="primary" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-secondary text-center">
                        <span className="text-xs text-muted-foreground">Total Converted</span>
                        <p className="text-xl font-bold text-primary">{totalConverted}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary text-center">
                        <span className="text-xs text-muted-foreground">Mini/Full Logins</span>
                        <p className="text-xl font-bold text-primary">{allDoneMeetings.filter(m => m.miniLogin).length} / {allDoneMeetings.filter(m => m.fullLogin).length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {bdos.length === 0 && (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No BDOs found. Add a user with BDO role.</CardContent></Card>
            )}
          </div>
        </div>
      )}

      {/* Delete Modals */}
      <DoubleConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={async () => {
          if (userToDelete) {
            await removeUser(userToDelete);
            toast.success('User removed');
            setUserToDelete(null);
          }
        }}
        title="Delete User"
      />

      <DoubleConfirmModal
        isOpen={!!teamToDelete}
        onClose={() => setTeamToDelete(null)}
        onConfirm={async () => {
          if (teamToDelete) {
            const team = teams.find(t => t.id === teamToDelete);
            if (team && team.boIds.length > 0) {
              const confirmed = window.confirm(`This team has ${team.boIds.length} BO(s). They will be unassigned from this team. Proceed?`);
              if (!confirmed) {
                setTeamToDelete(null);
                return;
              }
            }
            await deleteTeam(teamToDelete);
            toast.success('Team deleted');
            setTeamToDelete(null);
          }
        }}
        title="Delete Team"
      />

      {/* Upload Confirmation Modal */}
      <Dialog open={!!pendingUpload} onOpenChange={(open) => !open && setPendingUpload(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              Duplicate Leads Detected
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {pendingUpload?.isManual ? (
              <p className="text-sm">
                This phone number already exists in the system (assigned to <strong className="font-semibold">{pendingUpload.dupes[0]?.originalBoName}</strong>).
                <br /><br />
                Do you want to discard this lead, or proceed and store it in the <strong>Duplicate Leads</strong> folder for future reference?
              </p>
            ) : (
              <>
                <p className="text-sm">We found some duplicate phone numbers in your upload. Do you want to proceed?</p>
                <div className="bg-secondary/50 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">New Valid Leads:</span>
                    <p className="font-semibold text-lg text-green-600 dark:text-green-500">{pendingUpload?.newLeads.length}</p>
                    <span className="text-[10px] text-muted-foreground">(Will be assigned to BOs)</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Duplicates Found:</span>
                    <p className="font-semibold text-lg text-amber-600 dark:text-amber-500">{pendingUpload?.dupes.length}</p>
                    <span className="text-[10px] text-muted-foreground">(Will be stored in Duplicates Folder)</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setPendingUpload(null)}>
              Cancel & Discard
            </Button>
            {/* <Button className="flex-1" onClick={async () => {
              if (pendingUpload) {
                await addLeads(pendingUpload.newLeads, pendingUpload.dupes);
                setPendingUpload(null);

                if (pendingUpload.isManual) {
                  setLeadInput({ clientName: '', phoneNumber: '', loanRequirement: '' });
                  toast.success('Lead recorded in Duplicate Leads folder');
                } else {
                  toast.success(`${pendingUpload.newLeads.length} leads uploaded. ${pendingUpload.dupes.length} duplicates stored.`);
                }
              }
            }}>
              Confirm & Save {pendingUpload?.isManual ? 'Duplicate' : 'All'}
            </Button> */}
            <Button className="flex-1"
              disabled={isLoading('confirm_upload')}
              onClick={() => withLoading('confirm_upload', async () => {
                if (pendingUpload) {
                  await addLeads(pendingUpload.newLeads, pendingUpload.dupes);
                  setPendingUpload(null);
                  if (pendingUpload.isManual) {
                    setLeadInput({ clientName: '', phoneNumber: '', loanRequirement: '' });
                    toast.success('Lead recorded in Duplicate Leads folder');
                  } else {
                    toast.success(`${pendingUpload.newLeads.length} leads uploaded. ${pendingUpload.dupes.length} duplicates stored.`);
                  }
                }
              })}>
              {isLoading('confirm_upload') ? 'Saving...' : `Confirm & Save ${pendingUpload?.isManual ? 'Duplicate' : 'All'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
