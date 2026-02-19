import { useDigitizer } from '@/hooks/useDigitizer';
import { Sidebar } from '@/components/Sidebar';
import { CanvasArea } from '@/components/CanvasArea';
import { PointsPanel } from '@/components/PointsPanel';
import { ResetDialog } from '@/components/ResetDialog';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function Digitizer() {
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleError = (message: string) => {
    setErrorMessage(message);
    setErrorDialogOpen(true);
  };

  const {
    canvasRef,
    inputRef,
    containerRef,
    img,
    state,
    lines,
    currentLineId,
    vX1,
    vX2,
    vY1,
    vY2,
    openDialog,
    showRedDot,
    handleVX1Change,
    handleVX2Change,
    handleVY1Change,
    handleVY2Change,
    handleImageUpload,
    resetApp,
    handleCanvasClick,
    calculateRegression,
    exportCSV,
    addLine,
    selectLine,
    delPoint,
    confirmReferences,
    setOpenDialog,
  } = useDigitizer(handleError);

  return (
    <div className="flex w-screen h-screen bg-gray-800">
      <Sidebar
        state={state}
        lines={lines}
        currentLineId={currentLineId}
        vX1={vX1}
        vX2={vX2}
        vY1={vY1}
        vY2={vY2}
        inputRef={inputRef}
        showRedDot={showRedDot}
        onVX1Change={handleVX1Change}
        onVX2Change={handleVX2Change}
        onVY1Change={handleVY1Change}
        onVY2Change={handleVY2Change}
        onAddLine={addLine}
        onSelectLine={selectLine}
        onCalculateRegression={calculateRegression}
        onExportCSV={exportCSV}
        onConfirmReferences={confirmReferences}
        onReset={() => setOpenDialog(true)}
        onUpload={handleImageUpload}
      />
      <CanvasArea
        img={img}
        canvasRef={canvasRef}
        containerRef={containerRef}
        onCanvasClick={handleCanvasClick}
        onUploadClick={() => inputRef.current?.click()}
      />
      <PointsPanel
        lines={lines}
        currentLineId={currentLineId}
        onDeletePoint={delPoint}
      />
      <ResetDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        onConfirm={() => {
          resetApp();
          setOpenDialog(false);
        }}
      />
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className='px-3 py-1 bg-blue-600 text-white rounded'
              onClick={() => setErrorDialogOpen(false)}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
