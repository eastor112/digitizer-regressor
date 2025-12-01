import { Upload, Calculator, Download, RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Line } from '@/lib/types';

interface SidebarProps {
  state: number;
  lines: Line[];
  currentLineId: number;
  vX1: number;
  vX2: number;
  vY1: number;
  vY2: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  showRedDot: boolean;
  onVX1Change: (value: number) => void;
  onVX2Change: (value: number) => void;
  onVY1Change: (value: number) => void;
  onVY2Change: (value: number) => void;
  onAddLine: () => void;
  onSelectLine: (id: number) => void;
  onCalculateRegression: () => void;
  onExportCSV: () => void;
  onReset: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const msgs = [
  'Upload Image',
  'Click on the X1 reference point on the image',
  'Click on the X2 reference point on the image',
  'Click on the Y1 reference point on the image',
  'Click on the Y2 reference point on the image',
  'Capturing Data...',
];

export function Sidebar({
  state,
  lines,
  currentLineId,
  vX1,
  vX2,
  vY1,
  vY2,
  inputRef,
  showRedDot,
  onVX1Change,
  onVX2Change,
  onVY1Change,
  onVY2Change,
  onAddLine,
  onSelectLine,
  onCalculateRegression,
  onExportCSV,
  onReset,
  onUpload,
}: SidebarProps) {
  return (
    <div className='w-64 bg-gray-100 p-4 flex flex-col overflow-y-auto shadow-lg'>
      <h2 className='text-xl font-semibold mb-4'>Digitizer V2</h2>
      <Alert className={`mb-4 relative ${state >= 1 && state <= 4 ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : ''}`}>
        <AlertDescription>
          <strong>Step:</strong> {msgs[state]}
        </AlertDescription>
        {showRedDot && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
      </Alert>
      <label className='flex items-center cursor-pointer bg-gray-200 hover:bg-gray-300 p-2 rounded mb-4'>
        <Upload className='mr-2 h-4 w-4' />
        Upload Image
        <input
          ref={inputRef}
          type='file'
          accept='image/*'
          onChange={onUpload}
          className='hidden'
        />
      </label>
      <div className='bg-white p-3 rounded border mb-2'>
        <div className='flex justify-between items-center mb-2'>
          <label className='text-sm flex items-center'>
            <Badge variant='default' className='mr-1 bg-blue-600'>
              1
            </Badge>{' '}
            Ref X1:
          </label>
          <Input
            type='number'
            defaultValue={vX1}
            onBlur={(e) => onVX1Change(parseFloat(e.target.value) || 0)}
            className='w-16'
          />
        </div>
        <div className='flex justify-between items-center'>
          <label className='text-sm flex items-center'>
            <Badge variant='default' className='mr-1 bg-blue-400'>
              2
            </Badge>{' '}
            Ref X2:
          </label>
          <Input
            type='number'
            defaultValue={vX2}
            onBlur={(e) => onVX2Change(parseFloat(e.target.value) || 0)}
            className='w-16'
          />
        </div>
      </div>
      <div className='bg-white p-3 rounded border mb-4'>
        <div className='flex justify-between items-center mb-2'>
          <label className='text-sm flex items-center'>
            <Badge variant='default' className='mr-1 bg-green-800'>
              1
            </Badge>{' '}
            Ref Y1:
          </label>
          <Input
            type='number'
            defaultValue={vY1}
            onBlur={(e) => onVY1Change(parseFloat(e.target.value) || 0)}
            className='w-16'
          />
        </div>
        <div className='flex justify-between items-center'>
          <label className='text-sm flex items-center'>
            <Badge variant='default' className='mr-1 bg-green-500'>
              2
            </Badge>{' '}
            Ref Y2:
          </label>
          <Input
            type='number'
            defaultValue={vY2}
            onBlur={(e) => onVY2Change(parseFloat(e.target.value) || 0)}
            className='w-16'
          />
        </div>
      </div>
      <div className='bg-white p-3 rounded border mb-4'>
        <h3 className='text-sm font-semibold mb-2'>Lines</h3>
        <div className='flex flex-wrap gap-2 mb-2'>
          {lines.map((line) => (
            <Button
              key={line.id}
              variant={currentLineId === line.id ? 'default' : 'outline'}
              size='sm'
              onClick={() => onSelectLine(line.id)}
              className='text-xs'
              style={{
                borderColor: line.color,
                color: currentLineId === line.id ? 'white' : line.color,
              }}
            >
              {line.name}
            </Button>
          ))}
        </div>
        <Button onClick={onAddLine} size='sm' className='w-full'>
          <Plus className='mr-2 h-4 w-4' />
          New Line
        </Button>
      </div>
      <Button
        onClick={onCalculateRegression}
        className='bg-green-500 hover:bg-green-600 mb-2'
        disabled={
          (lines.find((l) => l.id === currentLineId)?.points.length || 0) < 2
        }
      >
        <Calculator className='mr-2 h-4 w-4' />
        Calculate Regression
      </Button>
      {lines.find((l) => l.id === currentLineId)?.regression && (
        <div className='bg-green-100 p-2 text-sm rounded mb-4'>
          <b>
            Y ={' '}
            {lines
              .find((l) => l.id === currentLineId)!
              .regression!.slope.toFixed(4)}
            X +{' '}
            {lines
              .find((l) => l.id === currentLineId)!
              .regression!.intercept.toFixed(4)}
          </b>
          <br />
          R² ={' '}
          {lines.find((l) => l.id === currentLineId)!.regression!.r2.toFixed(4)}
        </div>
      )}
      <Button
        onClick={onExportCSV}
        className='bg-blue-500 hover:bg-blue-600 mb-2'
        disabled={lines.every((l) => l.points.length === 0)}
      >
        <Download className='mr-2 h-4 w-4' />
        Download Excel (.csv)
      </Button>
      <Button onClick={onReset} className='bg-red-500 hover:bg-red-600'>
        <RotateCcw className='mr-2 h-4 w-4' />
        Reset All
      </Button>
      <div className='text-center text-sm text-gray-600 mt-4'>
        © 2025 eastor112
      </div>
    </div>
  );
}
