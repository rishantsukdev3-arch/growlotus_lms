import { useState, useMemo, useEffect } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { useLoading } from '@/hooks/use-loading';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout, { LayoutDashboard, Calendar, ClipboardList } from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import DateRangeFilter from '@/components/DateRangeFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { NumberStatus, LeadStatus, LeadType } from '@/types/crm';
import { Phone, Send, CalendarDays, MessageSquare, Edit2, Check, Trash2, ArrowLeft } from 'lucide-react';
import { DoubleConfirmModal } from '@/components/ui/DoubleConfirmModal';

const navItems = [
  { label: 'My Leads', icon: <LayoutDashboard className="w-4 h-4" />, id: 'leads' },
  { label: 'Lead History', icon: <ClipboardList className="w-4 h-4" />, id: 'history' },
  { label: 'My Meetings', icon: <CalendarDays className="w-4 h-4" />, id: 'meetings' },
];

const numberStatuses: NumberStatus[] = ['Connected', 'Not Connected', 'Mobile Off', 'Incoming Barred', 'Invalid Number'];
const leadStatuses: LeadStatus[] = ['Interested', 'Not Interested', 'Eligible', 'Not Eligible', 'Pending', 'Language Barrier', 'Ringing'];
const leadTypes: LeadType[] = ['Client', 'DSA'];

export default function BODashboard() {
  const { currentUser, leads, users, teams, meetings, meetingRequests, leadRemarks, updateLead, addMeetingRequest, addRemark, updateRemark, deleteRemark } = useCRM();
  const { withLoading, isLoading } = useLoading();
  const [activeTab, setActiveTab] = useState('leads');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  useEffect(() => {
  if (!currentUser) return;
  const channel = supabase.channel('online-users')
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ userId: currentUser.id });
      }
    });
  return () => { supabase.removeChannel(channel); };
}, [currentUser]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [numberStatusFilter, setNumberStatusFilter] = useState<string>('all');
  const [remarkText, setRemarkText] = useState<Record<string, string>>({});
  const [editingRemark, setEditingRemark] = useState<string | null>(null);
  const [editRemarkText, setEditRemarkText] = useState('');
  const [statusDrillDown, setStatusDrillDown] = useState<string | null>(null);
  const [remarkToDelete, setRemarkToDelete] = useState<string | null>(null);

  const myLeads = leads.filter(l => l.assignedBOId === currentUser?.id);
  const today = new Date().toISOString().split('T')[0];
  const todayLeads = myLeads.filter(l => l.assignedDate === today);

  const myTeam = teams.find(t => t.boIds.includes(currentUser?.id || ''));
  const myTCId = myTeam?.tcId || '';

  // Filtered today's leads (with number status and lead status filters)
  const filteredTodayLeads = useMemo(() => {
    let filtered = todayLeads;
    if (statusFilter !== 'all') filtered = filtered.filter(l => l.leadStatus === statusFilter);
    if (numberStatusFilter !== 'all') filtered = filtered.filter(l => l.numberStatus === numberStatusFilter);
    return filtered;
  }, [todayLeads, statusFilter, numberStatusFilter]);

  // My meetings
  const myMeetings = useMemo(() => {
    let filtered = meetings.filter(m => m.boId === currentUser?.id);
    if (fromDate) filtered = filtered.filter(m => m.date >= fromDate.toISOString().split('T')[0]);
    if (toDate) filtered = filtered.filter(m => m.date <= toDate.toISOString().split('T')[0]);
    return filtered;
  }, [meetings, currentUser, fromDate, toDate]);

  // Filtered lead history
  const filteredHistory = useMemo(() => {
    let filtered = myLeads;
    if (fromDate) { const from = fromDate.toISOString().split('T')[0]; filtered = filtered.filter(l => l.assignedDate >= from); }
    if (toDate) { const to = toDate.toISOString().split('T')[0]; filtered = filtered.filter(l => l.assignedDate <= to); }
    if (statusFilter !== 'all') filtered = filtered.filter(l => l.leadStatus === statusFilter);
    if (numberStatusFilter !== 'all') filtered = filtered.filter(l => l.numberStatus === numberStatusFilter);
    return filtered;
  }, [myLeads, fromDate, toDate, statusFilter, numberStatusFilter]);

  // Date-wise meeting summary
  const meetingsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    myMeetings.forEach(m => { map[m.date] = (map[m.date] || 0) + 1; });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [myMeetings]);

  // Status drill-down leads
  const drillDownLeads = useMemo(() => {
    if (!statusDrillDown) return [];
    return todayLeads.filter(l => l.numberStatus === statusDrillDown);
  }, [todayLeads, statusDrillDown]);

  const updateNumberStatus = async (leadId: string, status: NumberStatus) => {
    await updateLead(leadId, { numberStatus: status });
    toast.success('Number status updated');
  };

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    await updateLead(leadId, { leadStatus: status });
    toast.success('Lead status updated');
  };

  const updateLeadType = async (leadId: string, type: LeadType) => {
    await updateLead(leadId, { leadType: type });
    toast.success('Lead type updated');
  };

  const requestMeeting = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    if (lead.leadStatus !== 'Interested') { toast.error('Meeting can only be requested for Interested leads'); return; }
    if (lead.meetingRequested) { toast.error('Meeting already requested'); return; }
    await updateLead(leadId, { meetingRequested: true });
    await addMeetingRequest({
      id: `mr${Date.now()}`, leadId, boId: currentUser!.id, tcId: myTCId, status: 'Pending', createdAt: today,
    });
    toast.success('Meeting request sent to TC');
  };

  const handleAddRemark = async (leadId: string) => {
    const text = remarkText[leadId]?.trim();
    if (!text) { toast.error('Enter a remark'); return; }
    await addRemark({ leadId, remark: text, createdBy: currentUser!.id, createdAt: new Date().toISOString() });
    setRemarkText(prev => ({ ...prev, [leadId]: '' }));
    toast.success('Remark saved');
  };

  const handleUpdateRemark = async (remarkId: string) => {
    if (!editRemarkText.trim()) return;
    await updateRemark(remarkId, editRemarkText.trim());
    setEditingRemark(null);
    toast.success('Remark updated');
  };

  const handleDeleteRemark = async (remarkId: string) => {
    await deleteRemark(remarkId);
    toast.success('Remark deleted');
  };

  const getLeadRemarks = (leadId: string) => leadRemarks.filter(r => r.leadId === leadId);

  const renderLeads = (leadsList: typeof myLeads, showRemarks = true) => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead><TableHead>Phone</TableHead><TableHead>Loan Amt</TableHead>
              <TableHead>Number Status</TableHead><TableHead>Lead Status</TableHead><TableHead>Lead Type</TableHead>
              <TableHead>Remarks</TableHead><TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leadsList.map(lead => {
              const remarks = getLeadRemarks(lead.id);
              return (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.clientName}</TableCell>
                  <TableCell>{lead.phoneNumber}</TableCell>
                  <TableCell>₹{lead.loanRequirement}</TableCell>
                  <TableCell>
                    {/* <Select value={lead.numberStatus || ''} onValueChange={v => updateNumberStatus(lead.id, v as NumberStatus)}>
                      <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Set status" /></SelectTrigger>
                      <SelectContent>{numberStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select> */}
                    {lead.meetingRequested ? (
                      <Badge variant="secondary" className="text-xs">{lead.numberStatus || '—'}</Badge>
                    ) : (
                      <Select value={lead.numberStatus || ''} onValueChange={v => updateNumberStatus(lead.id, v as NumberStatus)}>
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Set status" /></SelectTrigger>
                        <SelectContent>{numberStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* <Select value={lead.leadStatus || ''} onValueChange={v => updateLeadStatus(lead.id, v as LeadStatus)}>
                      <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Set status" /></SelectTrigger>
                      <SelectContent>{leadStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select> */}
                    {lead.meetingRequested ? (
                      <Badge variant="secondary" className="text-xs">{lead.leadStatus || '—'}</Badge>
                    ) : (
                      <Select value={lead.leadStatus || ''} onValueChange={v => updateLeadStatus(lead.id, v as LeadStatus)}>
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Set status" /></SelectTrigger>
                        <SelectContent>{leadStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.meetingRequested ? (
                      <Badge variant="secondary" className="text-xs">{lead.leadType || '—'}</Badge>
                    ) : (
                      <Select value={lead.leadType || ''} onValueChange={v => updateLeadType(lead.id, v as LeadType)}>
                        <SelectTrigger className="w-24 h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>{leadTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    {showRemarks && (
                      <div className="space-y-1">
                        {remarks.map(r => (
                          <div key={r.id} className="text-xs bg-secondary/50 p-1.5 rounded flex items-start gap-1">
                            {editingRemark === r.id ? (
                              <div className="flex gap-1 w-full">
                                <input value={editRemarkText} onChange={e => setEditRemarkText(e.target.value)} className="flex-1 text-xs border rounded px-1 bg-background" />
                                <button onClick={() => handleUpdateRemark(r.id)}><Check className="w-3 h-3 text-primary" /></button>
                              </div>
                            ) : (
                              <>
                                <span className="flex-1">{r.remark}</span>
                                <button onClick={() => { setEditingRemark(r.id); setEditRemarkText(r.remark); }}><Edit2 className="w-3 h-3 text-muted-foreground" /></button>
                                <button onClick={() => setRemarkToDelete(r.id)}><Trash2 className="w-3 h-3 text-destructive" /></button>
                              </>
                            )}
                          </div>
                        ))}
                        <div className="flex gap-1">
                          <input
                            value={remarkText[lead.id] || ''}
                            onChange={e => setRemarkText(prev => ({ ...prev, [lead.id]: e.target.value }))}
                            placeholder="Add remark..."
                            className="flex-1 text-xs border rounded px-2 py-1 bg-background"
                            onKeyDown={e => { if (e.key === 'Enter') handleAddRemark(lead.id); }}
                          />
                          <Button size="sm" variant="ghost" className="h-6 px-1"
                            disabled={isLoading(`remark_${lead.id}`)}
                            onClick={() => withLoading(`remark_${lead.id}`, () => handleAddRemark(lead.id))}>
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.leadStatus === 'Interested' && !lead.meetingRequested && (
                      <Button size="sm" variant="outline"
                        disabled={isLoading(`meeting_${lead.id}`)}
                        onClick={() => withLoading(`meeting_${lead.id}`, () => requestMeeting(lead.id))}>
                        <Send className="w-3 h-3 mr-1" />{isLoading(`meeting_${lead.id}`) ? 'Sending...' : 'Request Meeting'}
                      </Button>
                    )}
                    {lead.meetingRequested && (
                      <Badge variant={lead.meetingApproved ? 'default' : 'secondary'}>
                        {lead.meetingApproved ? 'Meeting Approved' : 'Pending Approval'}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {leadsList.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Today's Leads</h2>
            <p className="text-sm text-muted-foreground mt-1">{todayLeads.length} leads assigned today</p>
          </div>

          {/* Status drill-down cards */}
          {statusDrillDown ? (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setStatusDrillDown(null)}>
                <ArrowLeft className="w-4 h-4 mr-1" />Back to Overview
              </Button>
              <h3 className="text-lg font-semibold">{statusDrillDown} — {drillDownLeads.length} leads</h3>
              {renderLeads(drillDownLeads)}
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex items-center gap-4 flex-wrap mt-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Lead Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lead Status</SelectItem>
                    {leadStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={numberStatusFilter} onValueChange={setNumberStatusFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Number Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Number Status</SelectItem>
                    {numberStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {(statusFilter !== 'all' || numberStatusFilter !== 'all') && (
                  <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setNumberStatusFilter('all'); }}>Clear Filters</Button>
                )}
              </div>

              {renderLeads(filteredTodayLeads)}
            </>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Lead History</h2>
            <p className="text-sm text-muted-foreground mt-1">All assigned leads ({filteredHistory.length})</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {leadStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={numberStatusFilter} onValueChange={setNumberStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Number Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Number Status</SelectItem>
                {numberStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {renderLeads(filteredHistory)}
        </div>
      )}

      {activeTab === 'meetings' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">My Meetings</h2>
            <p className="text-sm text-muted-foreground mt-1">Scheduled and past meetings</p>
          </div>
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Meetings" value={myMeetings.length} variant="primary" />
            <StatCard label="Scheduled" value={myMeetings.filter(m => m.status === 'Scheduled').length} variant="info" />
            <StatCard label="Done" value={myMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up').length} variant="accent" />
            <StatCard label="Converted" value={myMeetings.filter(m => m.status === 'Converted').length} variant="primary" />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Date-wise Meeting Summary</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Done</TableHead><TableHead>Not Done</TableHead><TableHead>Converted</TableHead><TableHead>Follow-Up</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {meetingsByDate.map(([date, count]) => {
                    const dm = myMeetings.filter(m => m.date === date);
                    return (
                      <TableRow key={date}>
                        <TableCell className="font-medium">{date}</TableCell>
                        <TableCell>{count}</TableCell>
                        <TableCell>{dm.filter(m => m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up').length}</TableCell>
                        <TableCell>{dm.filter(m => m.status === 'Not Done').length}</TableCell>
                        <TableCell>{dm.filter(m => m.status === 'Converted').length}</TableCell>
                        <TableCell>{dm.filter(m => m.status === 'Follow-Up').length}</TableCell>
                      </TableRow>
                    );
                  })}
                  {meetingsByDate.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No meetings found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Meeting Details</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Client</TableHead>
                    <TableHead>Phone</TableHead><TableHead>Loan Amt</TableHead><TableHead>BDM</TableHead>
                    <TableHead>Type</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myMeetings.map(m => {
                    const lead = leads.find(l => l.id === m.leadId);
                    const bdm = users.find(u => u.id === m.bdmId);
                    return (
                      <TableRow key={m.id}>
                        <TableCell>{m.date}</TableCell>
                        <TableCell className="font-medium">{m.timeSlot}</TableCell>
                        <TableCell>{lead?.clientName}</TableCell>
                        <TableCell>{lead?.phoneNumber}</TableCell>
                        <TableCell>₹{lead?.loanRequirement}</TableCell>
                        <TableCell>{bdm?.name}</TableCell>
                        <TableCell><Badge variant="outline">{m.meetingType}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={m.status === 'Converted' ? 'default' : m.status === 'Not Done' ? 'destructive' : 'secondary'}>
                              {m.status}
                            </Badge>
                            {m.bdoStatus && <Badge variant="outline" className="text-[10px]">{m.bdoStatus}</Badge>}
                            {m.walkingStatus && <Badge variant="outline" className="text-[10px]">{m.walkingStatus}</Badge>}
                            {m.miniLogin && <Badge variant="outline" className="text-[10px]">Mini Login</Badge>}
                            {m.fullLogin && <Badge variant="outline" className="text-[10px]">Full Login</Badge>}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {myMeetings.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No meetings</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Modals */}
      <DoubleConfirmModal
        isOpen={!!remarkToDelete}
        onClose={() => setRemarkToDelete(null)}
        onConfirm={() => {
          if (remarkToDelete) {
            handleDeleteRemark(remarkToDelete);
            setRemarkToDelete(null);
          }
        }}
        title="Delete Remark"
      />
    </DashboardLayout>
  );
}
