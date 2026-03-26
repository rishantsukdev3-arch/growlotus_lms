import { Lead, User, Meeting } from '@/types/crm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface DetailDataTableProps {
  title: string;
  leads: Lead[];
  users: User[];
  meetings?: Meeting[];
  onBack: () => void;
  showMeetingDetails?: boolean;
}

export default function DetailDataTable({ title, leads, users, meetings = [], onBack, showMeetingDetails }: DetailDataTableProps) {
  const getUser = (id: string) => users.find(u => u.id === id);

  if (showMeetingDetails && meetings.length > 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
          <h3 className="text-lg font-semibold">{title} ({meetings.length})</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>BDM</TableHead>
              <TableHead>TC</TableHead>
              <TableHead>BO</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map(m => {
              const lead = leads.find(l => l.id === m.leadId);
              return (
                <TableRow key={m.id}>
                  <TableCell>{m.date}</TableCell>
                  <TableCell>{m.timeSlot}</TableCell>
                  <TableCell className="font-medium">{lead?.clientName}</TableCell>
                  <TableCell>{lead?.phoneNumber}</TableCell>
                  <TableCell>{getUser(m.bdmId)?.name}</TableCell>
                  <TableCell>{getUser(m.tcId)?.name}</TableCell>
                  <TableCell>{getUser(m.boId)?.name}</TableCell>
                  <TableCell><Badge variant="outline">{m.meetingType}</Badge></TableCell>
                  <TableCell><Badge>{m.status}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        <h3 className="text-lg font-semibold">{title} ({leads.length})</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Loan Amt</TableHead>
            <TableHead>Assigned BO</TableHead>
            <TableHead>TC</TableHead>
            <TableHead>Number Status</TableHead>
            <TableHead>Lead Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map(lead => {
            const bo = getUser(lead.assignedBOId);
            // find TC for this BO - we need teams but we can find from users
            return (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.clientName}</TableCell>
                <TableCell>{lead.phoneNumber}</TableCell>
                <TableCell>₹{lead.loanRequirement}</TableCell>
                <TableCell>{bo?.name}</TableCell>
                <TableCell>—</TableCell>
                <TableCell><Badge variant={lead.numberStatus === 'Connected' ? 'default' : 'secondary'}>{lead.numberStatus || '—'}</Badge></TableCell>
                <TableCell><Badge variant="outline">{lead.leadStatus || '—'}</Badge></TableCell>
                <TableCell>{lead.assignedDate}</TableCell>
              </TableRow>
            );
          })}
          {leads.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No data</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
