import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRangeFilterProps {
  fromDate: Date | undefined;
  toDate: Date | undefined;
  onFromChange: (d: Date | undefined) => void;
  onToChange: (d: Date | undefined) => void;
  onClear?: () => void;
}

export default function DateRangeFilter({ fromDate, toDate, onFromChange, onToChange, onClear }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !fromDate && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {fromDate ? format(fromDate, "PPP") : "From Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={fromDate} onSelect={onFromChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !toDate && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {toDate ? format(toDate, "PPP") : "To Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={toDate} onSelect={onToChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
      {(fromDate || toDate) && onClear && (
        <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
      )}
    </div>
  );
}
