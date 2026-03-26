import { useState, useMemo } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import DashboardLayout, { LayoutDashboard, Calendar } from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import DateRangeFilter from '@/components/DateRangeFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MeetingStep1Status, Meeting } from '@/types/crm';
import { ArrowLeft, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, id: 'dashboard' },
  { label: 'All Meetings', icon: <Calendar className="w-4 h-4" />, id: 'meetings' },
];

// Only Meeting Done and Reject can be set directly. Pending requires BDO selection.
const step1Statuses: MeetingStep1Status[] = ['Meeting Done', 'Pending', 'Reject'];

export default function BDMDashboard() {
  const { currentUser, leads, users, meetings, updateMeeting } = useCRM();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [detailView, setDetailView] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  // BDO assignment dialog state
  const [pendingAssignMeeting, setPendingAssignMeeting] = useState<Meeting | null>(null);
  const [selectedBdoId, setSelectedBdoId] = useState('');

  const myMeetings = useMemo(() => {
    let filtered = meetings.filter(m => m.bdmId === currentUser?.id);
    if (fromDate) filtered = filtered.filter(m => m.date >= fromDate.toISOString().split('T')[0]);
    if (toDate) filtered = filtered.filter(m => m.date <= toDate.toISOString().split('T')[0]);
    return filtered;
  }, [meetings, currentUser, fromDate, toDate]);

  const today = new Date().toISOString().split('T')[0];
  const todayMeetings = myMeetings.filter(m => m.date === today);
  const upcomingMeetings = myMeetings.filter(m => m.date >= today && m.status === 'Scheduled');

  const done = myMeetings.filter(m => m.status === 'Meeting Done').length;
  const pending = myMeetings.filter(m => m.status === 'Pending' || m.status === 'Scheduled').length;
  const rejected = myMeetings.filter(m => m.status === 'Reject').length;

  // All active BDOs
  const bdos = users.filter(u => u.role === 'BDO' && u.active);

  const handleStatusChange = (meeting: Meeting, status: MeetingStep1Status) => {
    if (status === 'Pending') {
      // Open BDO assignment dialog instead of directly updating
      setPendingAssignMeeting(meeting);
      setSelectedBdoId('');
    } else {
      updateMeeting(meeting.id, { status });
      toast.success(`Meeting status: ${status}`);
    }
  };

  const handleConfirmPendingAssignment = async () => {
    if (!pendingAssignMeeting) return;
    if (!selectedBdoId) {
      toast.error('Please select a BDO to assign');
      return;
    }
    await updateMeeting(pendingAssignMeeting.id, {
      status: 'Pending',
      bdoId: selectedBdoId,
    });
    toast.success('Meeting marked Pending and assigned to BDO');
    setPendingAssignMeeting(null);
    setSelectedBdoId('');
  };

  const getDetailMeetings = () => {
    switch (detailView) {
      case 'done': return myMeetings.filter(m => m.status === 'Meeting Done');
      case 'pending': return myMeetings.filter(m => m.status === 'Pending' || m.status === 'Scheduled');
      case 'rejected': return myMeetings.filter(m => m.status === 'Reject');
      default: return [];
    }
  };

  const detailTitle: Record<string, string> = { done: 'Meeting Done', pending: 'Pending', rejected: 'Rejected' };

  const renderMeetingTable = (meetingsList: Meeting[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Client</TableHead>
          <TableHead>Phone</TableHead><TableHead>Loan Amt</TableHead><TableHead>TC</TableHead>
          <TableHead>BO</TableHead><TableHead>Type</TableHead><TableHead>Assigned BDO</TableHead><TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {meetingsList.map(m => {
          const lead = leads.find(l => l.id === m.leadId);
          const tc = users.find(u => u.id === m.tcId);
          const bo = users.find(u => u.id === m.boId);
          const assignedBdo = users.find(u => u.id === m.bdoId);
          return (
            <>
              <TableRow key={m.id}>
                <TableCell>{m.date}</TableCell>
                <TableCell className="font-medium">{m.timeSlot}</TableCell>
                <TableCell>{m.clientName || lead?.clientName}</TableCell>
                <TableCell>{lead?.phoneNumber}</TableCell>
                <TableCell>₹{lead?.loanRequirement}</TableCell>
                <TableCell>{tc?.name}</TableCell>
                <TableCell>{bo?.name}</TableCell>
                <TableCell><Badge variant="outline">{m.meetingType}</Badge></TableCell>
                <TableCell>
                  {assignedBdo ? (
                    <Badge variant="secondary" className="gap-1">
                      <UserCheck className="w-3 h-3" />{assignedBdo.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={m.status === 'Scheduled' ? undefined : m.status}
                    onValueChange={v => handleStatusChange(m, v as MeetingStep1Status)}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Update Status" /></SelectTrigger>
                    <SelectContent>{step1Statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              {/* Meeting details sub-row */}
              {(m.location || m.state || m.productType || m.finalRequirement || m.collateralValue) && (
                <TableRow key={`${m.id}-details`} className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={10} className="py-2 px-4">
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {m.location && <span><span className="font-semibold text-foreground">Location:</span> {m.location}</span>}
                      {m.state && <span><span className="font-semibold text-foreground">State:</span> {m.state}</span>}
                      {m.productType && (
                        <span><span className="font-semibold text-foreground">Product:</span> <Badge variant="secondary" className="text-xs">{m.productType}</Badge></span>
                      )}
                      {m.finalRequirement != null && <span><span className="font-semibold text-foreground">Final Req:</span> ₹{m.finalRequirement}</span>}
                      {m.collateralValue != null && <span><span className="font-semibold text-foreground">Collateral:</span> ₹{m.collateralValue}</span>}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          );
        })}
        {meetingsList.length === 0 && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No meetings</TableCell></TableRow>}
      </TableBody>
    </Table>
  );

  return (
    <DashboardLayout navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">My Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1">Your meeting performance</p>
          </div>
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />

          {detailView ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setDetailView(null)}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
                <h3 className="text-lg font-semibold">{detailTitle[detailView]} ({getDetailMeetings().length})</h3>
              </div>
              <Card><CardContent className="p-0">{renderMeetingTable(getDetailMeetings())}</CardContent></Card>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Meeting Done" value={done} variant="primary" onClick={() => setDetailView('done')} />
                <StatCard label="Pending" value={pending} variant="info" onClick={() => setDetailView('pending')} />
                <StatCard label="Rejected" value={rejected} variant="destructive" onClick={() => setDetailView('rejected')} />
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">Today's Meetings ({todayMeetings.length})</CardTitle></CardHeader>
                <CardContent className="p-0">{renderMeetingTable(todayMeetings)}</CardContent>
              </Card>

              {upcomingMeetings.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Upcoming Meetings</CardTitle></CardHeader>
                  <CardContent className="p-0">{renderMeetingTable(upcomingMeetings)}</CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'meetings' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">All Meetings</h2>
            <p className="text-sm text-muted-foreground mt-1">Complete meeting history</p>
          </div>
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
          <Card><CardContent className="p-0">{renderMeetingTable(myMeetings)}</CardContent></Card>
        </div>
      )}

      {/* BDO Assignment Dialog — shown when BDM selects "Pending" */}
      <Dialog open={!!pendingAssignMeeting} onOpenChange={v => { if (!v) { setPendingAssignMeeting(null); setSelectedBdoId(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Assign BDO & Mark as Pending
            </DialogTitle>
          </DialogHeader>

          {pendingAssignMeeting && (() => {
            const lead = leads.find(l => l.id === pendingAssignMeeting.leadId);
            return (
              <div className="space-y-4">
                {/* Client details summary */}
                <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
                  <p className="font-semibold text-base">{pendingAssignMeeting.clientName || lead?.clientName}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                    <span><span className="font-medium text-foreground">Phone:</span> {lead?.phoneNumber}</span>
                    <span><span className="font-medium text-foreground">Loan Req:</span> ₹{lead?.loanRequirement}</span>
                    {pendingAssignMeeting.location && <span><span className="font-medium text-foreground">Location:</span> {pendingAssignMeeting.location}</span>}
                    {pendingAssignMeeting.state && <span><span className="font-medium text-foreground">State:</span> {pendingAssignMeeting.state}</span>}
                    {pendingAssignMeeting.productType && <span><span className="font-medium text-foreground">Product:</span> {pendingAssignMeeting.productType}</span>}
                    {pendingAssignMeeting.finalRequirement != null && <span><span className="font-medium text-foreground">Final Req:</span> ₹{pendingAssignMeeting.finalRequirement}</span>}
                    {pendingAssignMeeting.collateralValue != null && <span><span className="font-medium text-foreground">Collateral:</span> ₹{pendingAssignMeeting.collateralValue}</span>}
                  </div>
                </div>

                {/* BDO selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select BDO to Assign</Label>
                  <Select value={selectedBdoId} onValueChange={setSelectedBdoId}>
                    <SelectTrigger><SelectValue placeholder="Choose a BDO..." /></SelectTrigger>
                    <SelectContent>
                      {bdos.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      {bdos.length === 0 && <SelectItem value="_" disabled>No active BDOs found</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setPendingAssignMeeting(null); setSelectedBdoId(''); }}>Cancel</Button>
            <Button onClick={handleConfirmPendingAssignment} disabled={!selectedBdoId}>
              <UserCheck className="w-4 h-4 mr-2" />Confirm & Assign BDO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
