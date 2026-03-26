import { useState, useMemo } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import DashboardLayout, { LayoutDashboard, Calendar } from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import DateRangeFilter from '@/components/DateRangeFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Meeting, BDOStatus, WalkingStatus } from '@/types/crm';
import { ArrowLeft, Eye, User, Phone, Calendar as CalendarIcon, MapPin, Building, Briefcase, IndianRupee, CheckCircle2, XCircle, Clock, Users, MessageSquare, Send, CalendarCheck } from 'lucide-react';
import MeetingDetailDialog from '@/components/MeetingDetailDialog';

const navItems = [
  { label: 'Pending Meetings', icon: <LayoutDashboard className="w-4 h-4" />, id: 'pending' },
  { label: 'All Meetings', icon: <Calendar className="w-4 h-4" />, id: 'all' },
];

export default function BDODashboard() {
  const { currentUser, leads, users, meetings, updateMeeting } = useCRM();
  const [activeTab, setActiveTab] = useState('pending');
  const [detailView, setDetailView] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [infoMeeting, setInfoMeeting] = useState<Meeting | null>(null);

  // Only show meetings assigned to this BDO (bdoId === currentUser.id)
  const allBdoMeetings = useMemo(() => {
    let filtered = meetings.filter(m => m.bdoId === currentUser?.id);
    if (fromDate) filtered = filtered.filter(m => m.date >= fromDate.toISOString().split('T')[0]);
    if (toDate) filtered = filtered.filter(m => m.date <= toDate.toISOString().split('T')[0]);
    return filtered;
  }, [meetings, currentUser, fromDate, toDate]);

  // Pending = assigned by BDM with status 'Pending' but no BDO action yet
  const pendingMeetings = allBdoMeetings.filter(m => m.status === 'Pending' && (!m.bdoStatus || m.bdoStatus.length === 0));
  const convertedByBDM = allBdoMeetings.filter(m => m.bdoStatus === 'Converted by BDM');
  const followUpMeetings = allBdoMeetings.filter(m => m.bdoStatus === 'Follow-up' && m.walkingStatus !== 'Walking Done' && m.walkingStatus !== 'Invalid');
  const walkingDone = allBdoMeetings.filter(m => m.bdoStatus === 'Walk-in Done');
  const walkingInvalid = allBdoMeetings.filter(m => m.walkingStatus === 'Invalid');
  const totalConverted = allBdoMeetings.filter(m => m.bdoStatus === 'Converted by BDM' || m.bdoStatus === 'Converted');

  const handleConvertedByBDM = async (meeting: Meeting) => {
    setSelectedMeeting(meeting);
  };

  const handleSaveConversion = async (miniLogin: boolean, fullLogin: boolean) => {
    if (!selectedMeeting) return;
    await updateMeeting(selectedMeeting.id, {
      bdoStatus: 'Converted by BDM',
      miniLogin,
      fullLogin,
      bdoId: currentUser?.id,
    });
    setSelectedMeeting(null);
    toast.success('Meeting marked as Converted by BDM');
  };

  const handleFollowUp = async (meetingId: string) => {
    await updateMeeting(meetingId, {
      bdoStatus: 'Follow-up',
      bdoId: currentUser?.id,
    });
    toast.success('Meeting marked as Follow-up');
  };

  const handleSetWalkinDate = async (meetingId: string, date: string) => {
    if (!date) { toast.error('Select a date'); return; }
    await updateMeeting(meetingId, { walkinDate: date });
    toast.success('Walk-in date set');
  };

  const handleWalkingDone = async (meeting: Meeting) => {
    await updateMeeting(meeting.id, {
      walkingStatus: 'Walking Done',
      bdoStatus: 'Walk-in Done',
    });
    toast.success('Walk-in marked as Done. Use "Login Status Update" in View Details to convert.');
  };

  const handleSaveWalkingConversion = async (miniLogin: boolean, fullLogin: boolean) => {
    if (!selectedMeeting) return;
    await updateMeeting(selectedMeeting.id, {
      walkingStatus: 'Walking Done',
      bdoStatus: 'Converted by BDM',
      miniLogin,
      fullLogin,
    });
    setSelectedMeeting(null);
    toast.success('Walking completed and converted');
  };

  const handleWalkingInvalid = async (meetingId: string) => {
    await updateMeeting(meetingId, { walkingStatus: 'Invalid' });
    toast.success('Walking marked as invalid');
  };

  const getDetailMeetings = () => {
    switch (detailView) {
      case 'pending': return pendingMeetings;
      case 'converted': return convertedByBDM;
      case 'followup': return followUpMeetings;
      case 'walking_done': return walkingDone;
      case 'walking_invalid': return walkingInvalid;
      case 'total_converted': return totalConverted;
      default: return [];
    }
  };

  const detailTitle: Record<string, string> = {
    pending: 'Pending Meetings', converted: 'Converted by BDM', followup: 'Follow-up',
    walking_done: 'Walking Done', walking_invalid: 'Walking Invalid', total_converted: 'Total Converted',
  };

  const renderMeetingRow = (m: Meeting, showActions = false) => {
    const lead = leads.find(l => l.id === m.leadId);

    return (
      <TableRow key={m.id} className="hover:bg-muted/50 transition-colors">
        <TableCell>
          <span className="font-medium text-sm flex items-center gap-1.5 text-foreground">
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
            {new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            {m.timeSlot}
          </span>
        </TableCell>
        <TableCell>
          <span className="font-semibold text-foreground text-sm">{m.clientName || lead?.clientName || 'Unknown'}</span>
        </TableCell>
        <TableCell>
          <span className="text-sm flex items-center gap-1.5 text-muted-foreground">
            <Phone className="w-3.5 h-3.5" /> {lead?.phoneNumber || '—'}
          </span>
        </TableCell>
        <TableCell>
          <span className="font-semibold text-primary text-sm flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5"/>
            {lead?.loanRequirement || '—'}
          </span>
        </TableCell>
        {showActions && (
          <TableCell className="text-right pr-6">
            <Button size="sm" variant="outline" className="h-8 text-xs flex items-center justify-center gap-1.5 bg-background shadow-sm hover:bg-secondary/50 ml-auto" onClick={() => setInfoMeeting(m)}>
              <Eye className="w-3.5 h-3.5 text-primary" /> View Details
            </Button>
          </TableCell>
        )}
      </TableRow>
    );
  };

  return (
    <DashboardLayout navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'pending' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">BDO Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage post-meeting conversions and follow-ups</p>
          </div>
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />

          {detailView ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setDetailView(null)}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
                <h3 className="text-lg font-semibold">{detailTitle[detailView]} ({getDetailMeetings().length})</h3>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-b-2">
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Loan Amount</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getDetailMeetings().map(m => renderMeetingRow(m, true))}
                      {getDetailMeetings().length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No meetings</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Pending Meetings" value={pendingMeetings.length} variant="info" onClick={() => setDetailView('pending')} />
                <StatCard label="Converted by BDM" value={convertedByBDM.length} variant="primary" onClick={() => setDetailView('converted')} />
                <StatCard label="Follow-up" value={followUpMeetings.length} variant="accent" onClick={() => setDetailView('followup')} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Walking Done" value={walkingDone.length} variant="primary" onClick={() => setDetailView('walking_done')} />
                <StatCard label="Walking Invalid" value={walkingInvalid.length} variant="destructive" onClick={() => setDetailView('walking_invalid')} />
                <StatCard label="Total Converted" value={totalConverted.length} variant="accent" onClick={() => setDetailView('total_converted')} />
              </div>

              {/* Pending meetings with actions */}
              <Card>
                <CardHeader><CardTitle className="text-base">Pending Meetings ({pendingMeetings.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-b-2">
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Loan Amount</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingMeetings.map(m => renderMeetingRow(m, true))}
                      {pendingMeetings.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No pending meetings</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Follow-up meetings */}
              {followUpMeetings.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Follow-up Meetings ({followUpMeetings.length})</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 border-b-2">
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Loan Amount</TableHead>
                          <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {followUpMeetings.map(m => renderMeetingRow(m, true))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">All Meetings</h2>
            <p className="text-sm text-muted-foreground mt-1">Complete meeting history with BDO updates</p>
          </div>
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b-2">
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Loan Amount</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBdoMeetings.map(m => renderMeetingRow(m, true))}
                  {allBdoMeetings.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No meetings</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversion Dialog for Mini/Full Login */}
      <ConversionDialog
        open={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        onSave={selectedMeeting?.bdoStatus === 'Follow-up' || selectedMeeting?.walkingStatus ? handleSaveWalkingConversion : handleSaveConversion}
        title={selectedMeeting?.bdoStatus === 'Follow-up' ? 'Walking Done — Conversion Details' : 'Converted by BDM — Login Details'}
      />

      {/* Enhanced Meeting Detail Dialog */}
      <MeetingDetailDialog
        isOpen={!!infoMeeting}
        meeting={infoMeeting}
        onClose={() => setInfoMeeting(null)}
        onHandleConverted={handleConvertedByBDM}
        onHandleFollowUp={handleFollowUp}
        onHandleSetWalkinDate={handleSetWalkinDate}
        onHandleWalkingDone={handleWalkingDone}
        onHandleWalkingInvalid={handleWalkingInvalid}
      />
    </DashboardLayout>
  );
}

function ConversionDialog({ open, onClose, onSave, title }: { open: boolean; onClose: () => void; onSave: (mini: boolean, full: boolean) => void; title: string }) {
  const [miniLogin, setMiniLogin] = useState(false);
  const [fullLogin, setFullLogin] = useState(false);

  const handleSave = () => {
    onSave(miniLogin, fullLogin);
    setMiniLogin(false);
    setFullLogin(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Mini Login</Label>
            <Switch checked={miniLogin} onCheckedChange={setMiniLogin} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Full Login</Label>
            <Switch checked={fullLogin} onCheckedChange={setFullLogin} />
          </div>
          <Button onClick={handleSave} className="w-full">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
