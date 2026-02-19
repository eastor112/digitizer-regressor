type Ingredient = {
  id: number;
  name: string;
  composition: Record<string, number>;
};

interface SystemEquationsSectionProps {
  showSystem: boolean;
  matrixA: number[][] | null;
  vectorB: number[] | null;
  ingredients: Ingredient[];
  solution: number[] | null;
  matrixAInv: number[][] | null;
  computeModel: () => void;
}

export default function SystemEquationsSection({
  showSystem,
  matrixA,
  vectorB,
  ingredients,
  solution,
  matrixAInv,
  computeModel,
}: SystemEquationsSectionProps) {
  if (!showSystem || !matrixA || !vectorB) return null;

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

  const isSquare = matrixA.length === matrixA[0].length;
  const aInvB = matrixAInv ? matMul(matrixAInv, vectorB.map(v => [v])).flat() : null;

  return (
    <section className='mb-6 bg-white p-4 rounded shadow'>
      <h3 className='font-medium mb-2'>System of equations</h3>
      <div className='text-sm mb-2'>Normalized system (A · x = b)</div>
      <div className='overflow-auto'>
        <div className='flex gap-4'>
          <table className='table-auto border-collapse'>
            <tbody>
              {matrixA.map((row, i) => (
                <tr key={i} className='align-top'>
                  {row.map((v, j) => (
                    <td key={j} className='border p-1 text-xs'>
                      {Number(v.toPrecision(3))}
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
                      {Number(v.toPrecision(3))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className='mt-4'>
        <button
          className='px-3 py-1 bg-green-600 text-white rounded'
          onClick={computeModel}
        >
          Calcular solución
        </button>
      </div>

      {solution && (
        <div className='mt-4'>
          <h4 className='font-medium mb-2'>Solución</h4>
          {matrixAInv && (
            <div className='mb-4'>
              <div className='text-sm mb-2'>{isSquare ? 'Inversa de A (A⁻¹)' : 'Pseudo-inversa (A⁺ = (AᵀA)⁻¹Aᵀ)'}</div>
              <div className='overflow-auto'>
                <table className='table-auto border-collapse'>
                  <tbody>
                    {matrixAInv.map((row, i) => (
                      <tr key={i}>
                        {row.map((v, j) => (
                          <td key={j} className='border p-1 text-xs'>
                            {Number(v.toPrecision(3))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {aInvB && (
            <div className='mb-4'>
              <div className='text-sm mb-2'>{isSquare ? 'A⁻¹ · b' : 'A⁺ · b'}</div>
              <ul className='list-disc pl-5 text-sm'>
                {aInvB.map((v, i) => (
                  <li key={i}>
                    {Number(v.toPrecision(3))}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className='text-sm mb-2'>Solución (cantidades de ingredientes)</div>
          <ul className='list-disc pl-5 text-sm'>
            {solution.map((v, i) => (
              <li key={i}>
                {ingredients[i]?.name || `ing${i + 1}`}: {Number(v.toPrecision(3))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
