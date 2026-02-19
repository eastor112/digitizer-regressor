type Ingredient = {
  id: number;
  name: string;
  composition: Record<string, number>;
};

interface SystemEquationsSectionProps {
  showSystem: boolean;
  matrixARaw: number[][] | null;
  matrixA: number[][] | null;
  vectorB: number[] | null;
  ingredients: Ingredient[];
}

export default function SystemEquationsSection({
  showSystem,
  matrixA,
  vectorB,
  ingredients,
}: SystemEquationsSectionProps) {
  if (!showSystem || !matrixA || !vectorB) return null;

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
                      {v.toFixed(6)}
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
                      {v.toFixed(6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
