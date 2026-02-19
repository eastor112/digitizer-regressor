import React, { useState } from 'react';

type Ingredient = {
  id: number;
  name: string;
  composition: Record<string, number>; // key: component name -> value (e.g. percent or fraction)
};

type ComponentDef = { name: string; units: string };

export default function ExactMix() {
  const [components, setComponents] = useState<ComponentDef[]>([{ name: 'A', units: '' }]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [nextId, setNextId] = useState(1);
  const [productAmount, setProductAmount] = useState<number | null>(null);
  const [desiredComp, setDesiredComp] = useState<Record<string, number>>({});
  const [newCompName, setNewCompName] = useState('');
  const [newCompUnits, setNewCompUnits] = useState('');

  function addComponent(name?: string, units?: string) {
    const compName = (name || `C${components.length + 1}`).trim();
    const compUnits = (units || '').trim();
    if (!compName) return;
    if (components.some((c) => c.name === compName)) return;
    setComponents((s) => [...s, { name: compName, units: compUnits }]);
    // initialize composition values for existing ingredients
    setIngredients((rows) =>
      rows.map((r) => ({ ...r, composition: { ...r.composition, [compName]: 0 } })),
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
    const ans = window.prompt('How much product (in chosen units) will be prepared?');
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

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h2 className="text-2xl font-semibold mb-4">Go to Exact Mix</h2>

      <section className="mb-6 bg-white p-4 rounded shadow">
        <h3 className="font-medium mb-2">Components</h3>
        <div className="flex gap-2 items-center mb-2">
          <input
            placeholder="component name"
            value={newCompName}
            onChange={(e) => setNewCompName(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          <input
            placeholder="units"
            value={newCompUnits}
            onChange={(e) => setNewCompUnits(e.target.value)}
            className="border px-2 py-1 rounded w-32"
          />
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={() => {
              const val = newCompName.trim();
              if (!val) return;
              addComponent(val, newCompUnits.trim());
              setNewCompName('');
              setNewCompUnits('');
            }}
          >
            Add component
          </button>
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => addComponent()}>
            Auto add
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {components.map((c) => (
            <div key={c.name} className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded">
              <span className="font-medium">{c.name} <span className="text-xs text-gray-500">({c.units})</span></span>
              <button className="text-sm text-red-600" onClick={() => removeComponent(c.name)}>
                remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 bg-white p-4 rounded shadow">
        <h3 className="font-medium mb-2">Ingredients</h3>
        <div className="overflow-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left">
                <th className="p-2 border-b">Name</th>
                {components.map((c) => (
                  <th key={c.name} className="p-2 border-b">{c.name} <span className="text-xs text-gray-500">({c.units})</span></th>
                ))}
                <th className="p-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => (
                <tr key={ing.id}>
                  <td className="p-2 border-b">
                    <input
                      value={ing.name}
                      onChange={(e) => updateIngredient(ing.id, { name: e.target.value })}
                      className="border px-2 py-1 rounded w-full"
                    />
                  </td>
                  {components.map((c) => (
                    <td key={c.name} className="p-2 border-b">
                      <input
                        type="number"
                        value={ing.composition[c.name] ?? 0}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          updateIngredient(ing.id, {
                            composition: { ...ing.composition, [c.name]: v },
                          });
                        }}
                        className="border px-2 py-1 rounded w-full"
                      />
                    </td>
                  ))}
                  <td className="p-2 border-b">
                    <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => removeIngredient(ing.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={addIngredient}>
            Add ingredient
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={finishIngredients}>
            Done ingredients
          </button>
        </div>
      </section>

      {productAmount !== null && (
        <section className="mb-6 bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Product details</h3>
          <div className="mb-2">Preparing: <b>{productAmount}</b></div>

          <div className="mb-2">Desired composition (enter values for each component)</div>
          <div className="grid grid-cols-2 gap-2 max-w-md">
            {components.map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <label className="w-20">{c.name}</label>
                <input
                  type="number"
                  value={desiredComp[c.name] ?? ''}
                  onChange={(e) => onDesiredChange(c.name, parseFloat(e.target.value) || 0)}
                  className="border px-2 py-1 rounded w-full"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="text-sm text-gray-600">Next: when you confirm desired composition I can assemble the equations and run a solver to compute ingredient amounts — tell me if you want me to implement the solver step now.</div>
    </div>
  );
}
