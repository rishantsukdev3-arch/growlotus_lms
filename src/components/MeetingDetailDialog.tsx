import { useState } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  User, 
  Phone, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  IndianRupee, 
  Briefcase, 
  Building, 
  MapPin, 
  Users, 
  CalendarCheck, 
  XCircle, 
  MessageSquare, 
  Send
} from 'lucide-react';
import { Meeting } from '@/types/crm';
import { toast } from 'sonner';

interface MeetingDetailDialogProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  // Optional actions — only provided when the parent dashboard supports them
  onHandleConverted?: (m: Meeting) => void;
  onHandleFollowUp?: (id: string) => void;
  onHandleSetWalkinDate?: (id: string, date: string) => void;
  onHandleWalkingDone?: (m: Meeting) => void;
  onHandleWalkingInvalid?: (id: string) => void;
}

export default function MeetingDetailDialog({ 
  meeting, 
  isOpen, 
  onClose,
  onHandleConverted,
  onHandleFollowUp,
  onHandleSetWalkinDate,
  onHandleWalkingDone,
  onHandleWalkingInvalid
}: MeetingDetailDialogProps) {
  const { leads, users, meetingRemarks, loginHistory, addMeetingRemark, addLoginUpdate, currentUser, updateMeeting } = useCRM();
  const [walkinDateInput, setWalkinDateInput] = useState('');
  const [newRemark, setNewRemark] = useState('');
  const [submittingRemark, setSubmittingRemark] = useState(false);
  const [loginType, setLoginType] = useState<'Mini Login' | 'Full Login' | 'Both'>('Mini Login');
  const [submittingLogin, setSubmittingLogin] = useState(false);

  if (!meeting) return null;

  const lead = leads.find(l => l.id === meeting.leadId);
  const tc = users.find(u => u.id === meeting.tcId);
  const bo = users.find(u => u.id === meeting.boId);
  const bdm = users.find(u => u.id === meeting.bdmId);

  const isPending = meeting.status === 'Pending' && (!meeting.bdoStatus || meeting.bdoStatus.length === 0);
  const isFollowUp = meeting.bdoStatus === 'Follow-up';
  // A lead is "walk-in done" if bdoStatus is 'Walk-in Done' OR walkingStatus is 'Walking Done'
  const isWalkinDone = meeting.bdoStatus === 'Walk-in Done' || meeting.walkingStatus === 'Walking Done';
  const isConverted = meeting.bdoStatus === 'Converted by BDM';

  const isWalkinActive = isFollowUp && meeting.walkingStatus !== 'Walking Done' && meeting.walkingStatus !== 'Invalid';
  const showRemarks = isFollowUp || isWalkinDone || isConverted;
  // Show Login Update ONLY for Walk-in Done leads (not for Total Converted)
  const showLoginUpdate = isWalkinDone && !isConverted;

  // Remarks for this meeting, chronological order (latest on top)
  const remarks = meetingRemarks
    .filter(r => r.meetingId === meeting.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const meetingLoginHistory = loginHistory
    .filter(h => h.meetingId === meeting.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAddRemark = async () => {
    if (!newRemark.trim()) { toast.error('Enter a remark'); return; }
    setSubmittingRemark(true);
    await addMeetingRemark(meeting.id, newRemark.trim(), currentUser?.name || 'User');
    setNewRemark('');
    setSubmittingRemark(false);
    toast.success('Remark added');
  };

  const handleWalkInDoneAction = async () => {
    if (onHandleWalkingDone) {
      onHandleWalkingDone(meeting);
    } else {
      await updateMeeting(meeting.id, {
        walkingStatus: 'Walking Done',
        bdoStatus: 'Walk-in Done',
      });
      toast.success('Walk-in marked as Done.');
    }
  };

  const handleWalkInInvalidAction = async () => {
    if (onHandleWalkingInvalid) {
      onHandleWalkingInvalid(meeting.id);
    } else {
      await updateMeeting(meeting.id, { walkingStatus: 'Invalid' });
      toast.success('Walk-in marked as Invalid.');
    }
  };

  const handleSetWalkin = async () => {
    if (!walkinDateInput) { toast.error('Select a walk-in date'); return; }
    if (onHandleSetWalkinDate) {
      await onHandleSetWalkinDate(meeting.id, walkinDateInput);
    } else {
      await updateMeeting(meeting.id, { walkinDate: walkinDateInput });
    }
    setWalkinDateInput('');
  };

  const handleLoginUpdate = async () => {
    setSubmittingLogin(true);
    await addLoginUpdate(meeting.id, loginType, currentUser?.name || 'User');
    
    // Also update the main meeting record with the login flags and the new Converted status
    await updateMeeting(meeting.id, {
      bdoStatus: 'Converted',
      miniLogin: loginType === 'Mini Login' || loginType === 'Both',
      fullLogin: loginType === 'Full Login' || loginType === 'Both',
    });
    
    setSubmittingLogin(false);
    toast.success(`Login Status updated to ${loginType}. Marked as Converted.`);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background border-border shadow-xl">
        {/* Header */}
        <div className="bg-primary/5 p-6 border-b border-border/50 flex items-center justify-between relative">
          <div className="flex items-center gap-5">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 shadow-sm ml-2">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-display font-bold text-foreground">
                {meeting.clientName || lead?.clientName || 'Unknown Client'}
              </DialogTitle>
              <div className="flex items-center gap-5 mt-2 text-sm text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary/70" /> {lead?.phoneNumber || '—'}</span>
                <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4 text-primary/70" /> {meeting.date} at {meeting.timeSlot}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            {isPending && onHandleFollowUp && onHandleConverted && (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="border border-border" onClick={() => onHandleFollowUp!(meeting.id)}>Follow-up</Button>
                <Button size="sm" onClick={() => { onClose(); onHandleConverted!(meeting); }}>Converted by BDM</Button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
          {/* Requirement & Product */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><IndianRupee className="w-4 h-4 text-primary/80"/> Required Amount</p>
              <p className="text-2xl font-bold text-primary">₹{lead?.loanRequirement || '—'}</p>
            </div>
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-primary/80"/> Product Type</p>
              <p className="text-lg font-semibold text-foreground">{meeting.productType || '—'}</p>
            </div>
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Building className="w-4 h-4 text-primary/80"/> Meeting Type</p>
              {meeting.meetingType ? <Badge variant="secondary" className="px-3 py-1 text-sm bg-secondary/50">{meeting.meetingType}</Badge> : <p className="text-lg font-semibold text-muted-foreground">—</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Location & Assets */}
            <div className="space-y-4 bg-muted/20 border border-border/50 rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/> Location & Assets</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <div><p className="text-xs font-medium text-muted-foreground mb-1">Location</p><p className="text-sm font-semibold text-foreground">{meeting.location || '—'}</p></div>
                <div><p className="text-xs font-medium text-muted-foreground mb-1">State</p><p className="text-sm font-semibold text-foreground">{meeting.state || '—'}</p></div>
                <div><p className="text-xs font-medium text-muted-foreground mb-1">Final Req.</p><p className="text-sm font-semibold text-foreground">{meeting.finalRequirement ? `₹${meeting.finalRequirement}` : '—'}</p></div>
                <div><p className="text-xs font-medium text-muted-foreground mb-1">Collateral Value</p><p className="text-sm font-semibold text-foreground">{meeting.collateralValue ? `₹${meeting.collateralValue}` : '—'}</p></div>
              </div>
            </div>

            {/* Team alignment */}
            <div className="space-y-4 bg-muted/20 border border-border/50 rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary"/> Team Alignment</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2"><div className="w-6 text-center text-xs font-bold text-muted-foreground bg-secondary rounded py-0.5">TC</div> <span className="text-sm font-semibold">{tc?.name || '—'}</span></div>
                <div className="flex items-center gap-2"><div className="w-6 text-center text-xs font-bold text-muted-foreground bg-secondary rounded py-0.5">BO</div> <span className="text-sm font-semibold">{bo?.name || '—'}</span></div>
                <div className="flex items-center gap-2"><div className="w-6 text-center text-xs font-bold text-muted-foreground bg-secondary rounded py-0.5">BDM</div> <span className="text-sm font-semibold">{bdm?.name || '—'}</span></div>
              </div>
            </div>
          </div>

          {/* Status block */}
          <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary"/> Status Tracking</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Lead Status</p>
                <span className="text-sm font-semibold">{lead?.leadStatus || '—'}</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Meeting Status</p>
                <Badge variant={meeting.status === 'Converted' ? 'default' : 'outline'} className="shadow-sm">{meeting.status}</Badge>
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">BDO Status</p>
                {meeting.bdoStatus ? <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 shadow-sm">{meeting.bdoStatus}</Badge> : <span className="text-sm font-medium text-muted-foreground">—</span>}
              </div>
              {meeting.walkinDate && (
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Walk-in Date</p>
                  <span className="text-sm font-semibold">{formatDate(meeting.walkinDate)}</span>
                </div>
              )}
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Logins</p>
                <div className="flex flex-col gap-1.5 items-start">
                  {meeting.miniLogin && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm">Mini Login</Badge>}
                  {meeting.fullLogin && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shadow-sm">Full Login</Badge>}
                  {!meeting.miniLogin && !meeting.fullLogin && <span className="text-sm font-medium text-muted-foreground">—</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Walk-in Management — active for Follow-Up meetings without a decision */}
          {isWalkinActive && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-4 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" /> Walk-in Management
              </h3>

              <div className="flex items-end gap-3 mb-4">
                <div className="flex-1">
                  <Label className="text-xs font-semibold text-amber-700 dark:text-amber-500 mb-1 block">
                    {meeting.walkinDate ? `Current Walk-in Date: ${meeting.walkinDate}` : 'Set Walk-in Date'}
                  </Label>
                  <Input type="date" className="h-9" value={walkinDateInput} onChange={e => setWalkinDateInput(e.target.value)} />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="border border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
                  onClick={handleSetWalkin}
                >
                  {meeting.walkinDate ? 'Update Date' : 'Set Date'}
                </Button>
              </div>

              {meeting.walkinDate && !meeting.walkingStatus && (
                <div className="flex gap-3">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleWalkInDoneAction}>
                    <CheckCircle2 className="w-4 h-4" /> Walk-in Done
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-2" onClick={handleWalkInInvalidAction}>
                    <XCircle className="w-4 h-4" /> Invalid Walk-in
                  </Button>
                </div>
              )}

              {meeting.walkingStatus && (
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={meeting.walkingStatus === 'Walking Done' ? 'default' : 'destructive'} className="text-sm px-4 py-1.5">
                    {meeting.walkingStatus === 'Walking Done' ? '✓ Walk-in Done' : '✗ Invalid Walk-in'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Status already recorded</span>
                </div>
              )}
            </div>
          )}

          {/* Remarks Section */}
          {showRemarks && (
            <div className="border border-border/60 rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Remarks
                {remarks.length > 0 && <Badge variant="secondary" className="ml-1">{remarks.length}</Badge>}
              </h3>

              {remarks.length > 0 ? (
                <div className="border rounded-lg overflow-hidden mb-4 shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-40 text-xs font-bold uppercase tracking-wider">Date & Time</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">Remark</TableHead>
                        <TableHead className="w-32 text-xs font-bold uppercase tracking-wider">User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {remarks.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="text-[11px] font-medium py-2.5">{formatDateTime(r.createdAt)}</TableCell>
                          <TableCell className="text-sm py-2.5 whitespace-pre-wrap leading-relaxed">{r.remark}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground py-2.5">{r.createdBy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : !isConverted ? (
                <p className="text-sm text-muted-foreground mb-4 italic">No remarks yet. Add the first one below.</p>
              ) : null}

              {/* Add new remark — hidden for converted leads */}
              {!isConverted && (
                <>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a remark about this meeting..."
                      value={newRemark}
                      onChange={e => setNewRemark(e.target.value)}
                      className="flex-1 min-h-[80px] resize-none text-sm border-primary/20 focus:border-primary/50"
                      onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddRemark(); }}
                    />
                    <Button onClick={handleAddRemark} disabled={submittingRemark || !newRemark.trim()} className="self-end gap-2 shadow-sm">
                      <Send className="w-4 h-4" /> Add Remark
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">Ctrl+Enter to submit</p>
                </>
              )}
            </div>
          )}

          {/* Login Status Update Section — Walk-in Done leads only */}
          {showLoginUpdate && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" /> Login Status Update
              </h3>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-500 mb-1 block">Update Login Status</Label>
                  <Select value={loginType} onValueChange={(v: any) => setLoginType(v)}>
                    <SelectTrigger className="h-9 border-emerald-200 dark:border-emerald-800 bg-white dark:bg-black/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mini Login">Mini Login</SelectItem>
                      <SelectItem value="Full Login">Full Login</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleLoginUpdate}
                  disabled={submittingLogin}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  Update & Convert
                </Button>
              </div>

              {/* Login History Table */}
              {meetingLoginHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-emerald-200/50 dark:border-emerald-800/50">
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-3">Login History</p>
                  <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-black/20">
                    <Table>
                      <TableHeader className="bg-emerald-100/50 dark:bg-emerald-900/20">
                        <TableRow>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider h-8 text-emerald-800 dark:text-emerald-400">Login Type</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider h-8 text-emerald-800 dark:text-emerald-400">Date & Time</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider h-8 text-emerald-800 dark:text-emerald-400">Updated By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {meetingLoginHistory.map(h => (
                          <TableRow key={h.id} className="border-emerald-50 dark:border-emerald-900/10">
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span className="font-bold text-emerald-900 dark:text-emerald-100 text-xs">{h.loginType}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-[11px] py-2 text-muted-foreground whitespace-nowrap">{formatDateTime(h.createdAt)}</TableCell>
                            <TableCell className="text-[11px] py-2 font-medium text-emerald-800/70 dark:text-emerald-400/70">{h.createdBy}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
