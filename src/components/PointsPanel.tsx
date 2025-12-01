import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Line } from '@/lib/types';

interface PointsPanelProps {
  lines: Line[];
  currentLineId: number;
  onDeletePoint: (id: number) => void;
}

export function PointsPanel({
  lines,
  currentLineId,
  onDeletePoint,
}: PointsPanelProps) {
  return (
    <div className='w-64 bg-gray-100 p-4 flex flex-col shadow-lg'>
      <h3 className='text-lg font-semibold mb-4'>Acquired Points</h3>
      <div className='text-sm text-gray-600 mb-2'>
        Current Line:{' '}
        <span
          className='font-medium'
          style={{ color: lines.find((l) => l.id === currentLineId)?.color }}
        >
          {lines.find((l) => l.id === currentLineId)?.name || 'None'}
        </span>
      </div>
      <div className='overflow-y-auto flex-1'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-8'>#</TableHead>
              <TableHead>X</TableHead>
              <TableHead>Y</TableHead>
              <TableHead className='w-8'>Del</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(lines.find((l) => l.id === currentLineId)?.points || [])
              .sort((a, b) => a.val.x - b.val.x)
              .map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.id}</TableCell>
                  <TableCell>{d.val.x.toFixed(2)}</TableCell>
                  <TableCell>{d.val.y.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => onDeletePoint(d.id)}
                    >
                      ×
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
