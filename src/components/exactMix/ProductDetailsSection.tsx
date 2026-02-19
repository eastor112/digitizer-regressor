import React from 'react';

type ComponentDef = { name: string; units: string };

interface ProductDetailsSectionProps {
  productAmountDisplay: number | null;
  productUnits: string;
  setProductUnits: React.Dispatch<React.SetStateAction<'g' | 'kg' | 'oz' | 'lb'>>;
  productAmountInput: string;
  setProductAmountInput: React.Dispatch<React.SetStateAction<string>>;
  confirmProductAmount: () => void;
  desiredComp: Record<string, number>;
  setDesiredComp: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  components: ComponentDef[];
  onDesiredChange: (component: string, value: number) => void;
  showSystem: boolean;
  setShowSystem: React.Dispatch<React.SetStateAction<boolean>>;
  assembleModel: () => void;
}

export default function ProductDetailsSection({
  productAmountDisplay,
  productUnits,
  setProductUnits,
  productAmountInput,
  setProductAmountInput,
  confirmProductAmount,
  desiredComp,
  components,
  onDesiredChange,
  showSystem,
  setShowSystem,
  assembleModel,
}: ProductDetailsSectionProps) {
  return (
    <section className='mb-6 bg-white p-4 rounded shadow'>
      <h3 className='font-medium mb-2'>Product details</h3>
      {productAmountDisplay === null ? (
        <div className='mb-4'>
          <p className='text-sm text-gray-600 mb-2'>
            Enter how much product will be prepared (in chosen units).
          </p>
          <div className='flex gap-2 items-center'>
            <input
              value={productAmountInput}
              onChange={(e) => setProductAmountInput(e.target.value)}
              className='border px-2 py-1 rounded flex-1'
              placeholder='Amount'
            />
            <select
              value={productUnits}
              onChange={(e) => setProductUnits(e.target.value as any)}
              className='border px-2 py-1 rounded'
            >
              <option value='g'>g</option>
              <option value='kg'>kg</option>
              <option value='oz'>oz</option>
              <option value='lb'>lb</option>
            </select>
            <button
              className='px-3 py-1 bg-blue-600 text-white rounded'
              onClick={confirmProductAmount}
            >
              Confirm
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className='mb-4'>
            <p className='text-sm text-gray-600 mb-2'>
              Product amount (editable)
            </p>
            <div className='flex gap-2 items-center'>
              <input
                value={productAmountInput}
                onChange={(e) => setProductAmountInput(e.target.value)}
                className='border px-2 py-1 rounded flex-1'
                placeholder='Amount'
              />
              <select
                value={productUnits}
                onChange={(e) => setProductUnits(e.target.value as any)}
                className='border px-2 py-1 rounded'
              >
                <option value='g'>g</option>
                <option value='kg'>kg</option>
                <option value='oz'>oz</option>
                <option value='lb'>lb</option>
              </select>
              <button
                className='px-3 py-1 bg-blue-600 text-white rounded'
                onClick={confirmProductAmount}
              >
                Update
              </button>
            </div>
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
        </>
      )}
    </section>
  );
}
