import React from 'react';

type Ingredient = {
  id: number;
  name: string;
  composition: Record<string, number>;
};

type ComponentDef = { name: string; units: string };

interface IngredientsSectionProps {
  components: ComponentDef[];
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  nextId: number;
  setNextId: React.Dispatch<React.SetStateAction<number>>;
  updateIngredient: (id: number, patch: Partial<Ingredient>) => void;
  removeIngredient: (id: number) => void;
  addIngredient: () => void;
  finishIngredients: () => void;
}

export default function IngredientsSection({
  components,
  ingredients,
  updateIngredient,
  removeIngredient,
  addIngredient,
  finishIngredients,
}: IngredientsSectionProps) {
  return (
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
  );
}
