import { useDigitizer } from '@/hooks/useDigitizer';
import { Sidebar } from '@/components/Sidebar';
import { CanvasArea } from '@/components/CanvasArea';
import { PointsPanel } from '@/components/PointsPanel';
import { ResetDialog } from '@/components/ResetDialog';

function App() {
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
    setVX1,
    setVX2,
    setVY1,
    setVY2,
    handleImageUpload,
    resetApp,
    handleCanvasClick,
    calculateRegression,
    exportCSV,
    addLine,
    selectLine,
    delPoint,
    setOpenDialog,
  } = useDigitizer();

  return (
    <div className='flex w-screen h-screen bg-gray-800'>
      <Sidebar
        state={state}
        lines={lines}
        currentLineId={currentLineId}
        vX1={vX1}
        vX2={vX2}
        vY1={vY1}
        vY2={vY2}
        inputRef={inputRef}
        onVX1Change={setVX1}
        onVX2Change={setVX2}
        onVY1Change={setVY1}
        onVY2Change={setVY2}
        onAddLine={addLine}
        onSelectLine={selectLine}
        onCalculateRegression={calculateRegression}
        onExportCSV={exportCSV}
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
    </div>
  );
}

export default App;
