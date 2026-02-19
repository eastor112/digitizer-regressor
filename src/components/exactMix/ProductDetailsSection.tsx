import React from 'react';

type ComponentDef = { name: string; units: string };

interface ProductDetailsSectionProps {
  productAmount: number | null;
  desiredComp: Record<string, number>;
  setDesiredComp: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  components: ComponentDef[];
  onDesiredChange: (component: string, value: number) => void;
  showSystem: boolean;
  setShowSystem: React.Dispatch<React.SetStateAction<boolean>>;
  assembleModel: () => void;
}

export default function ProductDetailsSection({
  productAmount,
  desiredComp,
  components,
  onDesiredChange,
  showSystem,
  setShowSystem,
  assembleModel,
}: ProductDetailsSectionProps) {
  if (productAmount === null) return null;

  return (
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
      <div className='mt-3'>
        <button
          className='px-3 py-1 bg-gray-800 text-white rounded'
          onClick={() => {
            assembleModel();
            setShowSystem((s) => !s);
          }}
        >
          {showSystem ? 'Hide system of equations' : 'Show system of equations'}
        </button>
      </div>
    </section>
  );
}
