import { useState, useMemo } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import DashboardLayout, { LayoutDashboard, Calendar, ClipboardList } from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import DateRangeFilter from '@/components/DateRangeFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Lead, ProductType } from '@/types/crm';
import { TIME_SLOTS } from '@/data/mockData';
import { Check, X, CalendarDays } from 'lucide-react';

const navItems = [
  { label: 'Team Performance', icon: <LayoutDashboard className="w-4 h-4" />, id: 'performance' },
  { label: 'Meeting Requests', icon: <ClipboardList className="w-4 h-4" />, id: 'requests' },
  { label: 'Schedule Meetings', icon: <Calendar className="w-4 h-4" />, id: 'schedule' },
  { label: 'Meeting History', icon: <CalendarDays className="w-4 h-4" />, id: 'history' },
];

export default function TCDashboard() {
  const { currentUser, users, leads, teams, meetings, meetingRequests, updateLead, addMeeting, updateMeetingRequest } = useCRM();
  const [activeTab, setActiveTab] = useState('performance');
  const [expandedBO, setExpandedBO] = useState<string | null>(null);
  const [scheduleBDM, setScheduleBDM] = useState('');
  const [scheduleSlot, setScheduleSlot] = useState('');
  const [scheduleMeetingType, setScheduleMeetingType] = useState<'Virtual' | 'Walk-in'>('Virtual');
  const [scheduleClientName, setScheduleClientName] = useState('');
  const [scheduleLocation, setScheduleLocation] = useState('');
  const [scheduleState, setScheduleState] = useState('');
  const [scheduleProductType, setScheduleProductType] = useState<ProductType>('');
  const [scheduleFinalReq, setScheduleFinalReq] = useState('');
  const [scheduleCollateral, setScheduleCollateral] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const myTeam = teams.find(t => t.tcId === currentUser?.id);
  const myBOs = myTeam?.boIds || [];
  const bdms = users.filter(u => u.role === 'BDM' && u.active);
  const today = new Date().toISOString().split('T')[0];
  const todayMeetings = meetings.filter(m => m.date === today);

  const teamMeetings = useMemo(() => {
    let filtered = meetings.filter(m => m.tcId === currentUser?.id);
    if (fromDate) filtered = filtered.filter(m => m.date >= fromDate.toISOString().split('T')[0]);
    if (toDate) filtered = filtered.filter(m => m.date <= toDate.toISOString().split('T')[0]);
    return filtered;
  }, [meetings, currentUser, fromDate, toDate]);

  const meetingsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    teamMeetings.forEach(m => { map[m.date] = (map[m.date] || 0) + 1; });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [teamMeetings]);

  const getAvailableSlots = (bdmId: string) => {
    const booked = todayMeetings.filter(m => m.bdmId === bdmId).map(m => m.timeSlot);
    return TIME_SLOTS.filter(s => !booked.includes(s));
  };

  const pendingRequests = meetingRequests.filter(mr => mr.tcId === currentUser?.id && mr.status === 'Pending');

  const approveRequest = async (requestId: string) => {
    await updateMeetingRequest(requestId, { status: 'Approved' });
    const req = meetingRequests.find(mr => mr.id === requestId);
    if (req) await updateLead(req.leadId, { meetingApproved: true });
    toast.success('Meeting request approved');
  };

  const rejectRequest = async (requestId: string) => {
    await updateMeetingRequest(requestId, { status: 'Rejected' });
    const req = meetingRequests.find(mr => mr.id === requestId);
    if (req) await updateLead(req.leadId, { meetingRequested: false });
    toast.success('Meeting request rejected');
  };

  const scheduleMeeting = async (leadId: string, boId: string) => {
    if (!scheduleBDM || !scheduleSlot) { toast.error('Select BDM and time slot'); return; }
    const meetingId = `m${Date.now()}`;
    await addMeeting({
      id: meetingId, leadId, bdmId: scheduleBDM, tcId: currentUser!.id, boId,
      date: today, timeSlot: scheduleSlot, status: 'Scheduled',
      meetingType: scheduleMeetingType,
      clientName: scheduleClientName || undefined,
      location: scheduleLocation || undefined,
      state: scheduleState || undefined,
      productType: scheduleProductType || undefined,
      finalRequirement: scheduleFinalReq || undefined,
      collateralValue: scheduleCollateral || undefined,
    });
    await updateLead(leadId, { meetingId });
    setScheduleBDM(''); setScheduleSlot('');
    setScheduleClientName(''); setScheduleLocation(''); setScheduleState('');
    setScheduleProductType(''); setScheduleFinalReq(''); setScheduleCollateral('');
    toast.success('Meeting scheduled');
  };

  const getBoLeads = (boId: string) => leads.filter(l => l.assignedBOId === boId);

  return (
    <DashboardLayout navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Team Performance</h2>
            <p className="text-sm text-muted-foreground mt-1">{myTeam?.name} — Your Business Officers</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Meeting Done" value={teamMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up').length} variant="primary" />
            <StatCard label="Not Done" value={teamMeetings.filter(m => m.status === 'Not Done').length} variant="destructive" />
            <StatCard label="Converted" value={teamMeetings.filter(m => m.status === 'Converted').length} variant="accent" />
            <StatCard label="Follow-Up" value={teamMeetings.filter(m => m.status === 'Follow-Up').length} variant="info" />
          </div>

          {myBOs.map(boId => {
            const bo = users.find(u => u.id === boId);
            const boLeads = getBoLeads(boId);
            const connected = boLeads.filter(l => l.numberStatus === 'Connected');
            const isExpanded = expandedBO === boId;
            const boMeetings = meetings.filter(m => m.boId === boId);

            return (
              <Card key={boId}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{bo?.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{boLeads.length} leads</Badge>
                      <Badge variant="secondary">{boMeetings.length} meetings</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <StatCard label="Connected" value={connected.length} variant="primary" onClick={() => setExpandedBO(isExpanded ? null : boId)} />
                    <StatCard label="Not Connected" value={boLeads.filter(l => l.numberStatus === 'Not Connected').length} />
                    <StatCard label="Mobile Off" value={boLeads.filter(l => l.numberStatus === 'Mobile Off').length} />
                    <StatCard label="Incoming Barred" value={boLeads.filter(l => l.numberStatus === 'Incoming Barred').length} />
                    <StatCard label="Invalid Number" value={boLeads.filter(l => l.numberStatus === 'Invalid Number').length} />
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 animate-fade-in">
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        <StatCard label="Interested" value={connected.filter(l => l.leadStatus === 'Interested').length} variant="accent" />
                        <StatCard label="Not Interested" value={connected.filter(l => l.leadStatus === 'Not Interested').length} />
                        <StatCard label="Pending" value={connected.filter(l => l.leadStatus === 'Pending').length} />
                        <StatCard label="Eligible" value={connected.filter(l => l.leadStatus === 'Eligible').length} variant="primary" />
                        <StatCard label="Not Eligible" value={connected.filter(l => l.leadStatus === 'Not Eligible').length} />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard label="Meeting Done" value={boMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up').length} variant="primary" />
                        <StatCard label="Not Done" value={boMeetings.filter(m => m.status === 'Not Done').length} variant="destructive" />
                        <StatCard label="Converted" value={boMeetings.filter(m => m.status === 'Converted').length} variant="accent" />
                        <StatCard label="Follow-Up" value={boMeetings.filter(m => m.status === 'Follow-Up').length} variant="info" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Meeting Requests</h2>
            <p className="text-sm text-muted-foreground mt-1">{pendingRequests.length} pending requests</p>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead><TableHead>Phone</TableHead><TableHead>Loan Amt</TableHead><TableHead>BO</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetingRequests.filter(mr => mr.tcId === currentUser?.id).map(req => {
                    const lead = leads.find(l => l.id === req.leadId);
                    const bo = users.find(u => u.id === req.boId);
                    return (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{lead?.clientName}</TableCell>
                        <TableCell>{lead?.phoneNumber}</TableCell>
                        <TableCell>₹{lead?.loanRequirement}</TableCell>
                        <TableCell>{bo?.name}</TableCell>
                        <TableCell><Badge variant={req.status === 'Approved' ? 'default' : req.status === 'Rejected' ? 'destructive' : 'secondary'}>{req.status}</Badge></TableCell>
                        <TableCell>
                          {req.status === 'Pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => approveRequest(req.id)}><Check className="w-3 h-3 mr-1" />Approve</Button>
                              <Button size="sm" variant="outline" onClick={() => rejectRequest(req.id)}><X className="w-3 h-3 mr-1" />Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {meetingRequests.filter(mr => mr.tcId === currentUser?.id).length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No meeting requests</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Schedule Meetings</h2>
            <p className="text-sm text-muted-foreground mt-1">Schedule approved meeting requests with available BDMs</p>
          </div>
          {meetingRequests.filter(mr => mr.tcId === currentUser?.id && mr.status === 'Approved').map(req => {
            const lead = leads.find(l => l.id === req.leadId);
            if (!lead || lead.meetingId) return null;
            const bo = users.find(u => u.id === req.boId);
            const availableSlots = scheduleBDM ? getAvailableSlots(scheduleBDM) : [];
            return (
              <Card key={req.id}>
                <CardHeader>
                  <CardTitle className="text-base">{lead.clientName} — ₹{lead.loanRequirement} <span className="text-sm font-normal text-muted-foreground ml-2">(BO: {bo?.name})</span></CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Row 1: BDM, Time Slot, Meeting Type */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Select BDM</p>
                      <Select value={scheduleBDM} onValueChange={v => { setScheduleBDM(v); setScheduleSlot(''); }}>
                        <SelectTrigger><SelectValue placeholder="Choose BDM" /></SelectTrigger>
                        <SelectContent>{bdms.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Time Slot (20 min)</p>
                      <Select value={scheduleSlot} onValueChange={setScheduleSlot}>
                        <SelectTrigger><SelectValue placeholder="Choose slot" /></SelectTrigger>
                        <SelectContent>
                          {availableSlots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          {availableSlots.length === 0 && scheduleBDM && <SelectItem value="_" disabled>No slots available</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Meeting Type</p>
                      <Select value={scheduleMeetingType} onValueChange={v => setScheduleMeetingType(v as 'Virtual' | 'Walk-in')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Virtual">Virtual</SelectItem>
                          <SelectItem value="Walk-in">Walk-in</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 2: Client Name, Location, State */}
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Client Name</p>
                      <Input
                        placeholder="Enter client name"
                        value={scheduleClientName}
                        onChange={e => setScheduleClientName(e.target.value)}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Location</p>
                      <Input
                        placeholder="Enter location"
                        value={scheduleLocation}
                        onChange={e => setScheduleLocation(e.target.value)}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">State</p>
                      <Input
                        placeholder="Enter state"
                        value={scheduleState}
                        onChange={e => setScheduleState(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Row 3: Product Type, Final Requirement, Collateral Value */}
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Product Type</p>
                      <Select value={scheduleProductType} onValueChange={v => setScheduleProductType(v as ProductType)}>
                        <SelectTrigger><SelectValue placeholder="Select product type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Term Loan">Term Loan</SelectItem>
                          <SelectItem value="Equity">Equity</SelectItem>
                          <SelectItem value="Term+Equity">Term+Equity</SelectItem>
                          <SelectItem value="Unsecure">Unsecure</SelectItem>
                          <SelectItem value="Project Funding">Project Funding</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Final Requirement (₹)</p>
                      <Input
                        type="text"
                        placeholder="e.g. 5000000 or 10-15 Lakhs"
                        value={scheduleFinalReq}
                        onChange={e => setScheduleFinalReq(e.target.value)}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Collateral Value (₹)</p>
                      <Input
                        type="text"
                        placeholder="e.g. 10000000 or 1-2 Cr"
                        value={scheduleCollateral}
                        onChange={e => setScheduleCollateral(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button className="mt-4" onClick={() => scheduleMeeting(lead.id, req.boId)}><Calendar className="w-4 h-4 mr-2" />Schedule Meeting</Button>
                </CardContent>
              </Card>
            );
          })}

          <Card>
            <CardHeader><CardTitle className="text-base">Today's Scheduled Meetings</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Time</TableHead><TableHead>Client</TableHead><TableHead>BDM</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {todayMeetings.filter(m => m.tcId === currentUser?.id).map(m => {
                    const lead = leads.find(l => l.id === m.leadId);
                    const bdm = users.find(u => u.id === m.bdmId);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.timeSlot}</TableCell>
                        <TableCell>{lead?.clientName}</TableCell>
                        <TableCell>{bdm?.name}</TableCell>
                        <TableCell><Badge variant="outline">{m.meetingType}</Badge></TableCell>
                        <TableCell><Badge variant={m.status === 'Meeting Done' || m.status === 'Converted' ? 'default' : 'secondary'}>{m.status}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Meeting History</h2>
            <p className="text-sm text-muted-foreground mt-1">Date-wise meeting summary</p>
          </div>
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />

          <Card>
            <CardHeader><CardTitle className="text-base">Summary ({teamMeetings.length} meetings)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Done</TableHead><TableHead>Not Done</TableHead><TableHead>Converted</TableHead><TableHead>Follow-Up</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {meetingsByDate.map(([date, count]) => {
                    const dm = teamMeetings.filter(m => m.date === date);
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
        </div>
      )}
    </DashboardLayout>
  );
}
