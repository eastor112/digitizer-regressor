import { useState, useEffect } from 'react';

/* ──────────────────────────── math helpers ──────────────────────────── */
function transpose(M: number[][]) {
  return M[0].map((_, i) => M.map((row) => row[i]));
}

function matMul(A: number[][], B: number[][]) {
  const out = Array.from({ length: A.length }, () => Array(B[0].length).fill(0));
  for (let i = 0; i < A.length; i++)
    for (let k = 0; k < B.length; k++)
      for (let j = 0; j < B[0].length; j++)
        out[i][j] += A[i][k] * B[k][j];
  return out;
}

function gaussianElim(Ain: number[][], bin: number[]): number[] {
  const n = Ain.length;
  const A = Ain.map((r) => r.slice());
  const b = bin.slice();
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++)
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
    if (Math.abs(A[maxRow][i]) < 1e-14) throw new Error('Sistema singular o mal condicionado');
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];
    const piv = A[i][i];
    for (let j = i; j < n; j++) A[i][j] /= piv;
    b[i] /= piv;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = A[r][i];
      for (let c = i; c < n; c++) A[r][c] -= f * A[i][c];
      b[r] -= f * b[i];
    }
  }
  return b;
}

function solve(A: number[][], b: number[]) {
  const rows = A.length;
  const cols = A[0].length;
  if (rows === cols) {
    const x = gaussianElim(A, b);
    return { x, method: 'exact' as const };
  }
  // least-squares: x = (AᵀA)⁻¹ Aᵀb
  const At = transpose(A);
  const AtA = matMul(At, A);
  const Atb = matMul(At, b.map((v) => [v])).map((r) => r[0]);
  const x = gaussianElim(AtA, Atb);
  return { x, method: 'least-squares' as const };
}

function computeResiduals(A: number[][], b: number[], x: number[]) {
  return A.map((row, i) => {
    const Ax_i = row.reduce((acc, aij, j) => acc + aij * x[j], 0);
    return b[i] - Ax_i;
  });
}

/* ──────────────────────────── types ──────────────────────────── */
type SolveResult = {
  x: number[];
  method: 'exact' | 'least-squares';
  residuals: number[];
  rmsError: number;
};

/* ──────────────────────────── fmt helper ──────────────────────────── */
function fmt(v: number) {
  if (!isFinite(v)) return String(v);
  const s = Number(v.toPrecision(4));
  return String(s);
}

/* ──────────────────────────── component ──────────────────────────── */
export default function Solver() {
  const [numVars, setNumVars] = useState(2);
  const [numEqs, setNumEqs] = useState(2);
  const [varNames, setVarNames] = useState<string[]>(['x₁', 'x₂']);
  const [matA, setMatA] = useState<string[][]>(() =>
    Array.from({ length: 2 }, () => Array(2).fill('')),
  );
  const [vecB, setVecB] = useState<string[]>(Array(2).fill(''));
  const [result, setResult] = useState<SolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* rebuild matrices when dimensions change, preserving existing values */
  useEffect(() => {
    setMatA((prev) =>
      Array.from({ length: numEqs }, (_, i) =>
        Array.from({ length: numVars }, (_, j) => prev[i]?.[j] ?? ''),
      ),
    );
    setVecB((prev) => Array.from({ length: numEqs }, (_, i) => prev[i] ?? ''));
    setVarNames((prev) =>
      Array.from({ length: numVars }, (_, i) => prev[i] ?? `x${subscipt(i + 1)}`),
    );
    setResult(null);
    setError(null);
  }, [numVars, numEqs]);

  function subscipt(n: number) {
    return String(n)
      .split('')
      .map((d) => '₀₁₂₃₄₅₆₇₈₉'[parseInt(d)])
      .join('');
  }

  function updateA(i: number, j: number, val: string) {
    setMatA((prev) => {
      const next = prev.map((r) => r.slice());
      next[i][j] = val;
      return next;
    });
    setResult(null);
  }

  function updateB(i: number, val: string) {
    setVecB((prev) => {
      const next = prev.slice();
      next[i] = val;
      return next;
    });
    setResult(null);
  }

  function updateVarName(i: number, val: string) {
    setVarNames((prev) => {
      const next = prev.slice();
      next[i] = val;
      return next;
    });
  }

  function handleSolve() {
    setError(null);
    setResult(null);
    const A: number[][] = [];
    const b: number[] = [];
    for (let i = 0; i < numEqs; i++) {
      const row: number[] = [];
      for (let j = 0; j < numVars; j++) {
        const v = parseFloat(matA[i]?.[j] ?? '');
        if (isNaN(v)) {
          setError(`Valor inválido en A[${i + 1}][${j + 1}]`);
          return;
        }
        row.push(v);
      }
      A.push(row);
      const bv = parseFloat(vecB[i] ?? '');
      if (isNaN(bv)) {
        setError(`Valor inválido en b[${i + 1}]`);
        return;
      }
      b.push(bv);
    }
    try {
      const { x, method } = solve(A, b);
      const residuals = computeResiduals(A, b, x);
      const rmsError = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length);
      setResult({ x, method, residuals, rmsError });
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    }
  }

  function handleClear() {
    setMatA(Array.from({ length: numEqs }, () => Array(numVars).fill('')));
    setVecB(Array(numEqs).fill(''));
    setResult(null);
    setError(null);
  }

  function handleRandom() {
    setMatA(
      Array.from({ length: numEqs }, () =>
        Array.from({ length: numVars }, () =>
          String(Math.round((Math.random() * 20 - 10) * 10) / 10),
        ),
      ),
    );
    setVecB(
      Array.from({ length: numEqs }, () =>
        String(Math.round((Math.random() * 20 - 10) * 10) / 10),
      ),
    );
    setResult(null);
    setError(null);
  }

  const isOverdetermined = numEqs > numVars;

  return (
    <div className='min-h-screen bg-gray-950 text-gray-100 p-6'>
      {/* header */}
      <div className='max-w-4xl mx-auto'>
        <a href='/' className='text-gray-400 hover:text-white text-sm mb-4 inline-block'>
          ← Volver
        </a>
        <h1 className='text-3xl font-bold mb-1'>Solver de Ecuaciones Lineales</h1>
        <p className='text-gray-400 text-sm mb-6'>
          Sistema A · x = b — ingresa los coeficientes y resuelve.
        </p>

        {/* dimension controls */}
        <div className='flex flex-wrap gap-6 mb-6 items-end'>
          <div>
            <label className='block text-xs text-gray-400 mb-1'>
              Incógnitas (columnas)
            </label>
            <div className='flex items-center gap-2'>
              <button
                className='w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 font-bold'
                onClick={() => setNumVars((n) => Math.max(1, n - 1))}
              >
                −
              </button>
              <span className='w-6 text-center font-mono text-lg'>{numVars}</span>
              <button
                className='w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 font-bold'
                onClick={() => setNumVars((n) => Math.min(10, n + 1))}
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className='block text-xs text-gray-400 mb-1'>
              Ecuaciones (filas)
            </label>
            <div className='flex items-center gap-2'>
              <button
                className='w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 font-bold'
                onClick={() => setNumEqs((n) => Math.max(numVars, n - 1))}
              >
                −
              </button>
              <span className='w-6 text-center font-mono text-lg'>{numEqs}</span>
              <button
                className='w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 font-bold'
                onClick={() => setNumEqs((n) => Math.min(20, n + 1))}
              >
                +
              </button>
            </div>
          </div>
          <div className='flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-gray-600 self-center'>
            {isOverdetermined ? (
              <span className='text-yellow-400'>Sobredeterminado — mínimos cuadrados</span>
            ) : (
              <span className='text-emerald-400'>Sistema cuadrado — solución exacta</span>
            )}
          </div>
        </div>

        {/* variable name row */}
        <div className='mb-2 flex gap-1 items-center'>
          <span className='text-xs text-gray-500 w-16 shrink-0'>Variables:</span>
          <div className='flex gap-2 flex-wrap'>
            {varNames.map((name, j) => (
              <input
                key={j}
                value={name}
                onChange={(e) => updateVarName(j, e.target.value)}
                className='w-12 text-center text-sm bg-gray-800 border border-gray-600 rounded px-1 py-0.5 focus:outline-none focus:border-indigo-400'
              />
            ))}
          </div>
        </div>

        {/* matrix input */}
        <div className='overflow-auto mb-4'>
          <table className='border-separate border-spacing-1'>
            <thead>
              <tr>
                <th className='text-xs text-gray-500 font-normal text-right pr-2 w-16'>Ec.</th>
                {varNames.map((name, j) => (
                  <th key={j} className='text-xs text-indigo-400 font-medium text-center w-16'>
                    {name}
                  </th>
                ))}
                <th className='text-xs text-gray-500 font-normal w-4'></th>
                <th className='text-xs text-rose-400 font-medium text-center w-16'>b</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: numEqs }, (_, i) => (
                <tr key={i}>
                  <td className='text-xs text-gray-500 text-right pr-2 font-mono'>{i + 1}</td>
                  {Array.from({ length: numVars }, (_, j) => (
                    <td key={j}>
                      <input
                        type='number'
                        value={matA[i]?.[j] ?? ''}
                        onChange={(e) => updateA(i, j, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className='w-16 text-center font-mono text-sm bg-gray-800 border border-gray-700 rounded px-1 py-1 focus:outline-none focus:border-indigo-400 focus:bg-gray-700'
                        placeholder='0'
                      />
                    </td>
                  ))}
                  <td className='text-center text-gray-500 px-1 font-mono text-sm'>=</td>
                  <td>
                    <input
                      type='number'
                      value={vecB[i] ?? ''}
                      onChange={(e) => updateB(i, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className='w-16 text-center font-mono text-sm bg-gray-800 border border-rose-900 rounded px-1 py-1 focus:outline-none focus:border-rose-400 focus:bg-gray-700'
                      placeholder='0'
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* action buttons */}
        <div className='flex gap-2 mb-6'>
          <button
            onClick={handleSolve}
            className='px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded font-medium text-sm transition-colors'
          >
            Resolver
          </button>
          <button
            onClick={handleRandom}
            className='px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors'
          >
            Aleatorio
          </button>
          <button
            onClick={handleClear}
            className='px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors text-gray-400'
          >
            Limpiar
          </button>
        </div>

        {/* error */}
        {error && (
          <div className='mb-4 px-4 py-3 rounded bg-red-900/40 border border-red-700 text-red-300 text-sm'>
            {error}
          </div>
        )}

        {/* result */}
        {result && (
          <div className='bg-gray-800 rounded-xl p-5 space-y-4'>
            <div className='flex items-center gap-3'>
              <h2 className='text-lg font-semibold'>Solución</h2>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  result.method === 'exact'
                    ? 'border-emerald-600 text-emerald-400'
                    : 'border-yellow-600 text-yellow-400'
                }`}
              >
                {result.method === 'exact' ? 'Exacta' : 'Mínimos cuadrados'}
              </span>
            </div>

            {/* solution values */}
            <div className='flex flex-wrap gap-3'>
              {result.x.map((v, i) => (
                <div
                  key={i}
                  className='flex items-center gap-2 bg-gray-900 rounded-lg px-4 py-2 border border-gray-700'
                >
                  <span className='text-indigo-400 text-sm font-medium'>
                    {varNames[i]}
                  </span>
                  <span className='text-gray-500'>=</span>
                  <span className='font-mono text-white text-lg'>{fmt(v)}</span>
                </div>
              ))}
            </div>

            {/* residuals (overdetermined only) */}
            {result.method === 'least-squares' && (
              <div>
                <p className='text-xs text-gray-400 mb-2'>
                  Error RMS:{' '}
                  <span className='font-mono text-yellow-400'>
                    {fmt(result.rmsError)}
                  </span>
                </p>
                <details className='text-xs'>
                  <summary className='cursor-pointer text-gray-400 hover:text-gray-200'>
                    Ver residuos (b − Ax)
                  </summary>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {result.residuals.map((r, i) => (
                      <span
                        key={i}
                        className='font-mono bg-gray-900 px-2 py-1 rounded text-gray-300'
                      >
                        r{i + 1} = {fmt(r)}
                      </span>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {/* verification */}
            <details className='text-xs'>
              <summary className='cursor-pointer text-gray-400 hover:text-gray-200'>
                Verificar Ax = b
              </summary>
              <div className='mt-2 overflow-auto'>
                <table className='text-xs font-mono border-separate border-spacing-x-3 border-spacing-y-0.5'>
                  <thead>
                    <tr className='text-gray-500'>
                      <td>Ec.</td>
                      <td>Ax</td>
                      <td>b</td>
                      <td>residuo</td>
                    </tr>
                  </thead>
                  <tbody>
                    {result.residuals.map((res, i) => {
                      const Ax = vecB[i] !== ''
                        ? parseFloat(vecB[i]) - res
                        : 0;
                      return (
                        <tr key={i}>
                          <td className='text-gray-500'>{i + 1}</td>
                          <td className='text-white'>{fmt(Ax)}</td>
                          <td className='text-rose-400'>{fmt(parseFloat(vecB[i] ?? '0'))}</td>
                          <td
                            className={
                              Math.abs(res) < 1e-8
                                ? 'text-emerald-400'
                                : 'text-yellow-400'
                            }
                          >
                            {fmt(res)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
