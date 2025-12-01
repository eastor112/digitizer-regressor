import { Upload } from 'lucide-react';

interface CanvasAreaProps {
  img: HTMLImageElement | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onCanvasClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onUploadClick: () => void;
}

export function CanvasArea({
  img,
  canvasRef,
  containerRef,
  onCanvasClick,
  onUploadClick,
}: CanvasAreaProps) {
  return (
    <div
      ref={containerRef}
      className='flex-1 bg-gray-600 p-5 overflow-hidden flex items-center'
    >
      {img ? (
        <canvas
          ref={canvasRef}
          onClick={onCanvasClick}
          className='w-full shadow-lg bg-white'
        />
      ) : (
        <div
          className='w-full text-center text-white cursor-pointer'
          onClick={onUploadClick}
        >
          <Upload className='mx-auto h-16 w-16 mb-4 opacity-50' />
          <p className='text-lg'>Upload an image to start</p>
        </div>
      )}
    </div>
  );
}
