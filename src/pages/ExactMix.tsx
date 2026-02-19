import { useState } from 'react';

type Ingredient = {
  id: number;
  name: string;
  composition: Record<string, number>; // key: component name -> value (e.g. percent or fraction)
};

type ComponentDef = { name: string; units: string };

export default function ExactMix() {
  const [components, setComponents] = useState<ComponentDef[]>([
    { name: 'A', units: 'percent' },
  ]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [nextId, setNextId] = useState(1);
  const [productAmount, setProductAmount] = useState<number | null>(null);
  const [desiredComp, setDesiredComp] = useState<Record<string, number>>({});
  const [newCompName, setNewCompName] = useState('');
  const [newCompUnits, setNewCompUnits] = useState<
    'percent' | 'g/100g' | 'g/kg' | 'g/g' | 'mg/kg' | 'ppb' | 'unitless'
  >('percent');
  const [modelName, setModelName] = useState('');
  const [solver, setSolver] = useState<'exact' | 'least-squares' | 'nnls'>(
    'exact',
  );
  const [matrixA, setMatrixA] = useState<number[][] | null>(null);
  const [matrixARaw, setMatrixARaw] = useState<number[][] | null>(null);
  const [vectorB, setVectorB] = useState<number[] | null>(null);
  const [solution, setSolution] = useState<number[] | null>(null);

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

  function finishIngredients() {
    const ans = window.prompt(
      'How much product (in chosen units) will be prepared?',
    );
    if (!ans) return;
    const n = parseFloat(ans);
    if (isNaN(n) || n <= 0) {
      alert('Please enter a valid positive number');
      return;
    }
    setProductAmount(n);
  }

  function onDesiredChange(component: string, value: number) {
    setDesiredComp((d) => ({ ...d, [component]: value }));
  }

  function assembleModel() {
    if (productAmount === null) {
      alert('Please set product amount first');
      return;
    }
    if (ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }
    // Build matrices. Keep raw A for display (user-entered) and normalized A (per gram) for computation.
    const compDefs = components;
    const compNames = compDefs.map((c) => c.name);
    const m = compNames.length + 1; // +1 for total
    const n = ingredients.length;
    const Araw: number[][] = Array.from({ length: m }, () => Array(n).fill(0));
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
        Araw[i][j] = raw;
        Anorm[i][j] = raw * scale;
      }
    }
    // total row
    for (let j = 0; j < n; j++) {
      Araw[m - 1][j] = 1;
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

    setMatrixARaw(Araw);
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
    if (!matrixA || !vectorB) return alert('Assemble model first');
    const A = matrixA;
    const b = vectorB;
    const rows = A.length;
    const cols = A[0].length;
    try {
      if (solver === 'exact') {
        if (rows !== cols)
          return alert(
            'Exact solver requires a square system (components+total === ingredients)',
          );
        const sol = solveLinear(A, b);
        setSolution(sol);
        return;
      }
      if (solver === 'least-squares') {
        // x = (A^T A)^{-1} A^T b
        const At = transpose(A);
        const AtA = matMul(At, A);
        const Atb = matMul(
          At,
          b.map((v) => [v]),
        );
        // convert Atb to vector
        const AtbVec = Atb.map((r) => r[0]);
        const sol = solveLinear(AtA, AtbVec);
        setSolution(sol);
        return;
      }
      if (solver === 'nnls') {
        alert('NNLS solver not implemented yet');
      }
    } catch (err: any) {
      alert('Error computing solution: ' + (err?.message || String(err)));
    }
  }

  return (
    <div className='p-6 min-h-screen bg-gray-50'>
      <h2 className='text-2xl font-semibold mb-4'>Go to Exact Mix</h2>

      <section className='mb-6 bg-white p-4 rounded shadow'>
        <h3 className='font-medium mb-2'>Components</h3>
        <div className='flex gap-2 items-center mb-2'>
          <input
            placeholder='component name'
            value={newCompName}
            onChange={(e) => setNewCompName(e.target.value)}
            className='border px-2 py-1 rounded'
          />
          <select
            value={newCompUnits}
            onChange={(e) => setNewCompUnits(e.target.value as any)}
            className='border px-2 py-1 rounded w-32'
          >
            <option value='percent'>% (g/100g)</option>
            <option value='g/kg'>g/kg</option>
            <option value='g/g'>g/g (fraction)</option>
            <option value='mg/kg'>mg/kg (ppm)</option>
            <option value='ppb'>ppb</option>
            <option value='unitless'>unitless</option>
          </select>
          <button
            className='px-3 py-1 bg-blue-600 text-white rounded'
            onClick={() => {
              const val = newCompName.trim();
              if (!val) return;
              addComponent(val, newCompUnits.trim());
              setNewCompName('');
              setNewCompUnits('percent');
            }}
          >
            Add component
          </button>
          <button
            className='px-3 py-1 bg-gray-200 rounded'
            onClick={() => addComponent()}
          >
            Auto add
          </button>
        </div>

        <div className='flex gap-2 flex-wrap'>
          {components.map((c) => (
            <div
              key={c.name}
              className='flex items-center gap-2 bg-gray-100 px-2 py-1 rounded'
            >
              <span className='font-medium'>
                {c.name}{' '}
                <span className='text-xs text-gray-500'>
                  (
                  {c.units === 'percent'
                    ? '%'
                    : c.units === 'g/100g'
                      ? 'g/100g'
                      : c.units === 'g/kg'
                        ? 'g/kg'
                        : c.units === 'g/g'
                          ? 'g/g'
                          : c.units === 'mg/kg'
                            ? 'mg/kg'
                            : c.units === 'ppb'
                              ? 'ppb'
                              : 'unitless'}
                  )
                </span>
              </span>
              <button
                className='text-sm text-red-600'
                onClick={() => removeComponent(c.name)}
              >
                remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className='mb-6 bg-white p-4 rounded shadow'>
        <h3 className='font-medium mb-2'>Ingredients</h3>
        <div className='overflow-auto'>
          <table className='w-full table-auto border-collapse'>
            <thead>
              <tr className='text-left'>
                <th className='p-2 border-b'>Name</th>
                {components.map((c) => (
                  <th key={c.name} className='p-2 border-b'>
                    {c.name}{' '}
                    <span className='text-xs text-gray-500'>({c.units})</span>
                  </th>
                ))}
                <th className='p-2 border-b'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => (
                <tr key={ing.id}>
                  <td className='p-2 border-b'>
                    <input
                      value={ing.name}
                      onChange={(e) =>
                        updateIngredient(ing.id, { name: e.target.value })
                      }
                      className='border px-2 py-1 rounded w-full'
                    />
                  </td>
                  {components.map((c) => (
                    <td key={c.name} className='p-2 border-b'>
                      <input
                        type='number'
                        value={ing.composition[c.name] ?? 0}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          updateIngredient(ing.id, {
                            composition: { ...ing.composition, [c.name]: v },
                          });
                        }}
                        className='border px-2 py-1 rounded w-full'
                      />
                    </td>
                  ))}
                  <td className='p-2 border-b'>
                    <button
                      className='px-2 py-1 bg-red-600 text-white rounded'
                      onClick={() => removeIngredient(ing.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='mt-3 flex gap-2'>
          <button
            className='px-4 py-2 bg-green-600 text-white rounded'
            onClick={addIngredient}
          >
            Add ingredient
          </button>
          <button
            className='px-4 py-2 bg-indigo-600 text-white rounded'
            onClick={finishIngredients}
          >
            Done ingredients
          </button>
        </div>
      </section>

      {productAmount !== null && (
        <section className='mb-6 bg-white p-4 rounded shadow'>
          <h3 className='font-medium mb-2'>Product details</h3>
          <div className='mb-2'>
            Preparing: <b>{productAmount}</b>
          </div>

          <div className='mb-2'>
            Desired composition (enter values for each component)
          </div>
          <div className='grid grid-cols-2 gap-2 max-w-md'>
            {components.map((c) => (
              <div key={c.name} className='flex items-center gap-2'>
                <label className='w-20'>{c.name}</label>
                <input
                  type='number'
                  value={desiredComp[c.name] ?? ''}
                  onChange={(e) =>
                    onDesiredChange(c.name, parseFloat(e.target.value) || 0)
                  }
                  className='border px-2 py-1 rounded w-full'
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {productAmount !== null && (
        <section className='mb-6 bg-white p-4 rounded shadow'>
          <h3 className='font-medium mb-2'>Create model</h3>
          <div className='flex items-center gap-2 mb-3'>
            <input
              placeholder='model name'
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className='border px-2 py-1 rounded'
            />
            <select
              value={solver}
              onChange={(e) => setSolver(e.target.value as any)}
              className='border px-2 py-1 rounded'
            >
              <option value='exact'>Exact (square)</option>
              <option value='least-squares'>Least-squares</option>
              <option value='nnls'>
                Non-negative least-squares (not implemented)
              </option>
            </select>
            <button
              className='px-3 py-1 bg-blue-600 text-white rounded'
              onClick={assembleModel}
            >
              Assemble model
            </button>
            <button
              className='px-3 py-1 bg-green-600 text-white rounded'
              onClick={computeModel}
            >
              Compute
            </button>
          </div>

          {matrixARaw && (
            <div className='mb-2 text-sm'>Raw A (user-entered values)</div>
          )}
          {matrixARaw && (
            <div className='overflow-auto mb-4'>
              <table className='table-auto border-collapse'>
                <tbody>
                  {matrixARaw.map((row, i) => (
                    <tr key={i}>
                      {row.map((v, j) => (
                        <td key={j} className='border p-1 text-xs'>
                          {v.toFixed(4)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {matrixA && vectorB && (
            <div className='overflow-auto'>
              <div className='text-sm mb-2'>Normalized system (A · x = b)</div>
              <div className='flex gap-4'>
                <table className='table-auto border-collapse'>
                  <tbody>
                    {matrixA.map((row, i) => (
                      <tr key={i} className='align-top'>
                        {row.map((v, j) => (
                          <td key={j} className='border p-1 text-xs'>
                            {v.toFixed(4)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className='flex flex-col justify-center text-lg font-semibold'>
                  ·
                </div>

                <div className='flex flex-col'>
                  <div className='text-sm mb-1'>x (ingredients)</div>
                  <table className='table-auto border-collapse'>
                    <tbody>
                      {ingredients.map((ing, i) => (
                        <tr key={i}>
                          <td className='border p-1 text-xs'>
                            {ing.name || `x${i + 1}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className='flex flex-col justify-center text-lg font-semibold'>
                  =
                </div>

                <div className='flex flex-col'>
                  <div className='text-sm mb-1'>b (targets)</div>
                  <table className='table-auto border-collapse'>
                    <tbody>
                      {vectorB.map((v, i) => (
                        <tr key={i}>
                          <td className='border p-1 text-xs font-semibold'>
                            {v.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {solution && (
            <div className='mt-3'>
              <h4 className='font-medium'>Solution (ingredient amounts)</h4>
              <ul className='list-disc pl-5 text-sm'>
                {solution.map((v, i) => (
                  <li key={i}>
                    {ingredients[i]?.name || `ing${i + 1}`}: {v.toFixed(6)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div className='text-sm text-gray-600'>
        Next: when you confirm desired composition I can assemble the equations
        and run a solver to compute ingredient amounts — tell me if you want me
        to implement the solver step now.
      </div>
    </div>
  );
}
