import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import ComponentsSection from '@/components/exactMix/ComponentsSection';
import IngredientsSection from '@/components/exactMix/IngredientsSection';
import ProductDetailsSection from '@/components/exactMix/ProductDetailsSection';
import SystemEquationsSection from '@/components/exactMix/SystemEquationsSection';

type Ingredient = {
  id: number;
  name: string;
  composition: Record<string, number>;
};

type ComponentDef = { name: string; units: string };


export default function ExactMix() {
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [nextId, setNextId] = useState(1);
  const [productAmount, setProductAmount] = useState<number | null>(null);
  const [productUnits, setProductUnits] = useState<'g' | 'kg' | 'oz' | 'lb'>(
    'kg',
  );
  const [productAmountDisplay, setProductAmountDisplay] = useState<
    number | null
  >(null);
  const [desiredComp, setDesiredComp] = useState<Record<string, number>>({});
  const [newCompName, setNewCompName] = useState('');
  const [newCompUnits, setNewCompUnits] = useState<
    'percent' | 'g/100g' | 'g/kg' | 'g/g' | 'mg/kg' | 'ppb' | 'unitless'
  >('percent');
  const [matrixA, setMatrixA] = useState<number[][] | null>(null);
  const [vectorB, setVectorB] = useState<number[] | null>(null);
  const [solution, setSolution] = useState<number[] | null>(null);
  const [matrixAInv, setMatrixAInv] = useState<number[][] | null>(null);
  const [productAmountInput, setProductAmountInput] = useState('');
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState('');
  const [showSystem, setShowSystem] = useState(false);

  function addComponent(name?: string, units?: string) {
    const compName = (name || `C${components.length + 1}`).trim();
    const compUnits = (units || '').trim();
    if (!compName) return;
    if (components.some((c) => c.name === compName)) return;
    setComponents((s) => [...s, { name: compName, units: compUnits }]);
    // initialize composition values for existing ingredients
    setIngredients((rows) =>
      rows.map((r) => ({
        ...r,
        composition: { ...r.composition, [compName]: 0 },
      })),
    );
  }

  function removeComponent(name: string) {
    setComponents((s) => s.filter((c) => c.name !== name));
    setIngredients((rows) =>
      rows.map((r) => {
        const comp = { ...r.composition };
        delete comp[name];
        return { ...r, composition: comp };
      }),
    );
    const d = { ...desiredComp };
    delete d[name];
    setDesiredComp(d);
  }

  function addIngredient() {
    const compRecord: Record<string, number> = {};
    components.forEach((c) => (compRecord[c.name] = 0));
    setIngredients((s) => [
      ...s,
      { id: nextId, name: '', composition: compRecord },
    ]);
    setNextId((n) => n + 1);
  }

  function updateIngredient(id: number, patch: Partial<Ingredient>) {
    setIngredients((s) => s.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeIngredient(id: number) {
    setIngredients((s) => s.filter((r) => r.id !== id));
  }

  function confirmProductAmount() {
    const ans = productAmountInput;
    if (!ans) {
      setErrorDialogMessage('Please enter a valid positive number');
      setErrorDialogOpen(true);
      return;
    }
    const n = parseFloat(ans);
    if (isNaN(n) || n <= 0) {
      setErrorDialogMessage('Please enter a valid positive number');
      setErrorDialogOpen(true);
      return;
    }
    let grams = n;
    switch (productUnits) {
      case 'kg':
        grams = n * 1000;
        break;
      case 'oz':
        grams = n * 28.3495;
        break;
      case 'lb':
        grams = n * 453.592;
        break;
      case 'g':
        grams = n;
        break;
    }
    setProductAmount(grams);
    setProductAmountDisplay(n);
  }

  function onDesiredChange(component: string, value: number) {
    setDesiredComp((d) => ({ ...d, [component]: value }));
  }

  function invertMatrix(A: number[][]) {
    const n = A.length;
    const I = Array.from({ length: n }, (_, i) =>
      Array(n)
        .fill(0)
        .map((_, j) => (i === j ? 1 : 0)),
    );
    const augmented = A.map((row, i) => [...row, ...I[i]]);
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i]))
          maxRow = k;
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      const pivot = augmented[i][i];
      for (let j = 0; j < 2 * n; j++) augmented[i][j] /= pivot;
      for (let r = 0; r < n; r++) {
        if (r === i) continue;
        const factor = augmented[r][i];
        for (let c = 0; c < 2 * n; c++)
          augmented[r][c] -= factor * augmented[i][c];
      }
    }
    return augmented.map((row) => row.slice(n));
  }

  function assembleModel() {
    if (productAmount === null) {
      setErrorDialogMessage('Please set product amount first');
      setErrorDialogOpen(true);
      return;
    }
    if (ingredients.length === 0) {
      setErrorDialogMessage('Please add at least one ingredient');
      setErrorDialogOpen(true);
      return;
    }
    // Build matrices. Keep raw A for display (user-entered) and normalized A (per gram) for computation.
    const compDefs = components;
    const compNames = compDefs.map((c) => c.name);
    const m = compNames.length + 1; // +1 for total
    const n = ingredients.length;
    const Anorm: number[][] = Array.from({ length: m }, () => Array(n).fill(0));

    function unitToPerGramScale(unit: string) {
      switch (unit) {
        case 'percent':
        case 'g/100g':
          return 1 / 100;
        case 'g/kg':
          return 1 / 1000;
        case 'g/g':
        case 'unitless':
          return 1;
        case 'mg/kg':
          return 1e-6;
        case 'ppb':
          return 1e-9;
        default:
          return 1;
      }
    }

    for (let i = 0; i < compNames.length; i++) {
      const comp = compNames[i];
      const unit = compDefs.find((c) => c.name === comp)?.units || 'unitless';
      const scale = unitToPerGramScale(unit);
      for (let j = 0; j < n; j++) {
        const raw = ingredients[j].composition[comp] ?? 0;
        Anorm[i][j] = raw * scale;
      }
    }
    // total row
    for (let j = 0; j < n; j++) {
      Anorm[m - 1][j] = 1;
    }

    const bnorm: number[] = [];
    for (let i = 0; i < compNames.length; i++) {
      const comp = compNames[i];
      const unit = compDefs.find((c) => c.name === comp)?.units || 'unitless';
      const scale = unitToPerGramScale(unit);
      const desiredRaw = desiredComp[comp] ?? 0; // user-entered desired value
      const desiredGrams = desiredRaw * scale * productAmount;
      bnorm.push(desiredGrams);
    }
    bnorm.push(productAmount);

    setMatrixA(Anorm);
    setVectorB(bnorm);
    setSolution(null);
  }

  // Basic linear algebra helpers
  function transpose(M: number[][]) {
    return M[0].map((_, i) => M.map((row) => row[i]));
  }

  function matMul(A: number[][], B: number[][]) {
    const r = A.length;
    const c = B[0].length;
    const K = B.length;
    const out = Array.from({ length: r }, () => Array(c).fill(0));
    for (let i = 0; i < r; i++) {
      for (let k = 0; k < K; k++) {
        for (let j = 0; j < c; j++) out[i][j] += A[i][k] * B[k][j];
      }
    }
    return out;
  }

  function solveLinear(Ain: number[][], bin: number[]) {
    // Gaussian elimination (A must be square)
    const n = Ain.length;
    const A = Ain.map((r) => r.slice());
    const b = bin.slice();
    for (let i = 0; i < n; i++) {
      // pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++)
        if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
      if (Math.abs(A[maxRow][i]) < 1e-12) throw new Error('Singular matrix');
      [A[i], A[maxRow]] = [A[maxRow], A[i]];
      [b[i], b[maxRow]] = [b[maxRow], b[i]];
      const pivot = A[i][i];
      for (let j = i; j < n; j++) A[i][j] /= pivot;
      b[i] /= pivot;
      for (let r = 0; r < n; r++) {
        if (r === i) continue;
        const factor = A[r][i];
        for (let c = i; c < n; c++) A[r][c] -= factor * A[i][c];
        b[r] -= factor * b[i];
      }
    }
    return b;
  }

  function computeModel() {
    if (!matrixA || !vectorB) {
      setErrorDialogMessage('Assemble model first');
      setErrorDialogOpen(true);
      return;
    }
    setMatrixAInv(null);
    setSolution(null);
    const A = matrixA;
    const b = vectorB;
    const rows = A.length;
    const cols = A[0].length;
    try {
      if (rows === cols) {
        // Sistema cuadrado: solución exacta
        const sol = solveLinear(A, b);
        setSolution(sol);
        setMatrixAInv(invertMatrix(A));
      } else {
        // Sistema sobredeterminado o subdeterminado: mínimos cuadrados
        // x = (A^T A)^{-1} A^T b  (pseudo-inversa)
        const At = transpose(A);
        const AtA = matMul(At, A);
        const Atb = matMul(At, b.map((v) => [v]));
        const AtbVec = Atb.map((r) => r[0]);
        const sol = solveLinear(AtA, AtbVec);
        setSolution(sol);
        // pseudo-inversa: (A^T A)^{-1} A^T
        const AtAInv = invertMatrix(AtA);
        const pseudoInv = matMul(AtAInv, At);
        setMatrixAInv(pseudoInv);
      }
    } catch (err: any) {
      setErrorDialogMessage(
        'Error computing solution: ' + (err?.message || String(err)),
      );
      setErrorDialogOpen(true);
    }
  }

  return (
    <div className='p-6 min-h-screen bg-gray-50'>
      <h2 className='text-2xl font-semibold mb-4'>Go to Exact Mix</h2>

      <ComponentsSection
        components={components}
        setComponents={setComponents}
        newCompName={newCompName}
        setNewCompName={setNewCompName}
        newCompUnits={newCompUnits}
        setNewCompUnits={setNewCompUnits}
        addComponent={addComponent}
        removeComponent={removeComponent}
      />

      {/* Error dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{errorDialogMessage}</DialogDescription>
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

      <IngredientsSection
        components={components}
        ingredients={ingredients}
        setIngredients={setIngredients}
        nextId={nextId}
        setNextId={setNextId}
        updateIngredient={updateIngredient}
        removeIngredient={removeIngredient}
        addIngredient={addIngredient}
      />

      {ingredients.length > 0 && (
        <ProductDetailsSection
          productAmountDisplay={productAmountDisplay}
          productUnits={productUnits}
          setProductUnits={setProductUnits}
          productAmountInput={productAmountInput}
          setProductAmountInput={setProductAmountInput}
          confirmProductAmount={confirmProductAmount}
          desiredComp={desiredComp}
          setDesiredComp={setDesiredComp}
          components={components}
          onDesiredChange={onDesiredChange}
          showSystem={showSystem}
          setShowSystem={setShowSystem}
          assembleModel={assembleModel}
        />
      )}

      <SystemEquationsSection
        showSystem={showSystem}
        matrixA={matrixA}
        vectorB={vectorB}
        ingredients={ingredients}
        solution={solution}
        matrixAInv={matrixAInv}
        computeModel={computeModel}
      />

      <div className='text-sm text-gray-600'>
        Next: when you confirm desired composition I can assemble the equations
        and run a solver to compute ingredient amounts — tell me if you want me
        to implement the solver step now.
      </div>
    </div>
  );
}
