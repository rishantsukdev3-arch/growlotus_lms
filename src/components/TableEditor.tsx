import { useState, useMemo } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Download, Edit2, Search, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

type TableName = 'leads' | 'profiles' | 'teams' | 'meetings' | 'meeting_requests' | 'lead_remarks';

const TABLE_OPTIONS: { value: TableName; label: string }[] = [
  { value: 'leads', label: 'Leads' },
  { value: 'profiles', label: 'Users / Profiles' },
  { value: 'teams', label: 'Teams' },
  { value: 'meetings', label: 'Meetings' },
  { value: 'meeting_requests', label: 'Meeting Requests' },
  { value: 'lead_remarks', label: 'Lead Remarks' },
];

export default function TableEditor() {
  const { leads, users, teams, meetings, meetingRequests, leadRemarks, updateLead, updateUser } = useCRM();
  const [selectedTable, setSelectedTable] = useState<TableName>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const tableData = useMemo(() => {
    switch (selectedTable) {
      case 'leads': return leads.map(l => ({
        id: l.id, 'Client Name': l.clientName, Phone: l.phoneNumber,
        'Loan Amt': `₹${l.loanRequirement.toLocaleString()}`,
        'Assigned BO': users.find(u => u.id === l.assignedBOId)?.name || l.assignedBOId,
        'Number Status': l.numberStatus || '—', 'Lead Status': l.leadStatus || '—',
        'Lead Type': l.leadType || '—', Date: l.assignedDate,
      }));
      case 'profiles': return users.map(u => ({
        id: u.id, Name: u.name, Username: u.username, Role: u.role,
        Active: u.active ? 'Yes' : 'No',
        Team: teams.find(t => t.boIds.includes(u.id) || t.tcId === u.id)?.name || '—',
      }));
      case 'teams': return teams.map(t => ({
        id: t.id, Name: t.name,
        TC: users.find(u => u.id === t.tcId)?.name || t.tcId,
        'BO Count': t.boIds.length,
        BOs: t.boIds.map(id => users.find(u => u.id === id)?.name || id).join(', ') || '—',
      }));
      case 'meetings': return meetings.map(m => ({
        id: m.id, Date: m.date, 'Time Slot': m.timeSlot, Status: m.status,
        BDM: users.find(u => u.id === m.bdmId)?.name || m.bdmId,
        BO: users.find(u => u.id === m.boId)?.name || m.boId,
        Type: m.meetingType || '—',
      }));
      case 'meeting_requests': return meetingRequests.map(r => ({
        id: r.id, 'Lead ID': r.leadId, Status: r.status,
        BO: users.find(u => u.id === r.boId)?.name || r.boId,
        TC: users.find(u => u.id === r.tcId)?.name || r.tcId,
        Created: r.createdAt,
      }));
      case 'lead_remarks': return leadRemarks.map(r => ({
        id: r.id, 'Lead ID': r.leadId, Remark: r.remark,
        'Created By': users.find(u => u.id === r.createdBy)?.name || r.createdBy,
        'Created At': new Date(r.createdAt).toLocaleDateString(),
      }));
      default: return [];
    }
  }, [selectedTable, leads, users, teams, meetings, meetingRequests, leadRemarks]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return tableData;
    const q = searchQuery.toLowerCase();
    return tableData.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(q))
    );
  }, [tableData, searchQuery]);

  const columns = useMemo(() => {
    if (filteredData.length === 0) return [];
    return Object.keys(filteredData[0]).filter(k => k !== 'id');
  }, [filteredData]);

  const handleExport = () => {
    const exportData = filteredData.map(({ id, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedTable);
    XLSX.writeFile(wb, `${selectedTable}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${exportData.length} rows`);
  };

  const handleEditRow = (row: any) => {
    setEditingRow(row);
    const vals: Record<string, string> = {};
    columns.forEach(col => { vals[col] = String(row[col] || ''); });
    setEditValues(vals);
  };

  const handleSaveEdit = async () => {
    if (!editingRow) return;
    if (selectedTable === 'leads') {
      await updateLead(editingRow.id, {
        numberStatus: (editValues['Number Status'] === '—' ? '' : editValues['Number Status']) as any,
        leadStatus: (editValues['Lead Status'] === '—' ? '' : editValues['Lead Status']) as any,
        leadType: (editValues['Lead Type'] === '—' ? '' : editValues['Lead Type']) as any,
      });
    } else if (selectedTable === 'profiles') {
      await updateUser(editingRow.id, { name: editValues['Name'] });
    }
    setEditingRow(null);
    toast.success('Row updated');
  };

  const editableFields: Record<TableName, string[]> = {
    leads: ['Number Status', 'Lead Status', 'Lead Type'],
    profiles: ['Name'],
    teams: [],
    meetings: [],
    meeting_requests: [],
    lead_remarks: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Table Editor</h2>
        <p className="text-sm text-muted-foreground mt-1">View, edit, and export database tables</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <Label className="text-xs">Table</Label>
          <Select value={selectedTable} onValueChange={v => { setSelectedTable(v as TableName); setSearchQuery(''); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TABLE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search across all columns..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />Export Excel
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>{TABLE_OPTIONS.find(t => t.value === selectedTable)?.label} ({filteredData.length} rows)</span>
            <Badge variant="secondary">{selectedTable}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(col => <TableHead key={col} className="whitespace-nowrap">{col}</TableHead>)}
                  {editableFields[selectedTable].length > 0 && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">No data found</TableCell></TableRow>
                ) : (
                  filteredData.map((row, i) => (
                    <TableRow key={row.id || i}>
                      {columns.map(col => (
                        <TableCell key={col} className="whitespace-nowrap max-w-[200px] truncate">
                          {['Number Status', 'Lead Status', 'Status', 'Role'].includes(col)
                            ? <Badge variant={row[col] === '—' ? 'secondary' : 'default'}>{row[col]}</Badge>
                            : row[col]}
                        </TableCell>
                      ))}
                      {editableFields[selectedTable].length > 0 && (
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => handleEditRow(row)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingRow} onOpenChange={open => !open && setEditingRow(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Row</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {editableFields[selectedTable].map(field => (
              <div key={field}>
                <Label>{field}</Label>
                <Input value={editValues[field] || ''} onChange={e => setEditValues(prev => ({ ...prev, [field]: e.target.value }))} />
              </div>
            ))}
            <Button onClick={handleSaveEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
