import React from 'react';

type ComponentDef = { name: string; units: string };

interface ComponentsSectionProps {
  components: ComponentDef[];
  setComponents: React.Dispatch<React.SetStateAction<ComponentDef[]>>;
  newCompName: string;
  setNewCompName: React.Dispatch<React.SetStateAction<string>>;
  newCompUnits: 'percent' | 'g/100g' | 'g/kg' | 'g/g' | 'mg/kg' | 'ppb' | 'unitless';
  setNewCompUnits: React.Dispatch<React.SetStateAction<'percent' | 'g/100g' | 'g/kg' | 'g/g' | 'mg/kg' | 'ppb' | 'unitless'>>;
  addComponent: (name?: string, units?: string) => void;
  removeComponent: (name: string) => void;
}

export default function ComponentsSection({
  components,
  newCompName,
  setNewCompName,
  newCompUnits,
  setNewCompUnits,
  addComponent,
  removeComponent,
}: ComponentsSectionProps) {
  return (
    <section className='mb-6 bg-white p-4 rounded shadow'>
      <h3 className='font-medium mb-2'>Components</h3>
      <p className='text-sm text-gray-600 mb-3'>
        Define the components you will balance (for example: P = protein, Q =
        moisture). For each component select the units — percent means g per
        100 g of ingredient, g/kg means grams per 1000 g, g/g is fraction per
        gram, mg/kg (ppm) and ppb are parts per million/billion. These
        component definitions determine the columns of the system matrix A.
      </p>
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
      </div>

      <div className='flex gap-1 flex-wrap'>
        {components.map((c) => (
          <div
            key={c.name}
            className='flex items-center gap-1 bg-gray-100 px-1 py-0.5 rounded text-sm'
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
              className='text-xs text-red-600'
              onClick={() => removeComponent(c.name)}
            >
              remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
