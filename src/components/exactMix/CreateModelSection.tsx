import React from 'react';

type Ingredient = {
  id: number;
  name: string;
  composition: Record<string, number>;
};

interface CreateModelSectionProps {
  productAmount: number | null;
  modelName: string;
  setModelName: React.Dispatch<React.SetStateAction<string>>;
  solver: 'exact' | 'least-squares' | 'nnls';
  setSolver: React.Dispatch<React.SetStateAction<'exact' | 'least-squares' | 'nnls'>>;
  assembleModel: () => void;
  computeModel: () => void;
  matrixARaw: number[][] | null;
  matrixA: number[][] | null;
  vectorB: number[] | null;
  solution: number[] | null;
  ingredients: Ingredient[];
}

export default function CreateModelSection({
  productAmount,
  modelName,
  setModelName,
  solver,
  setSolver,
  assembleModel,
  computeModel,
  matrixARaw,
  matrixA,
  vectorB,
  solution,
  ingredients,
}: CreateModelSectionProps) {
  if (productAmount === null) return null;

  return (
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
  );
}
