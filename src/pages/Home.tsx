import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-900">
      <div className="space-y-6 text-center">
        <h1 className="text-4xl font-bold text-white">Useful Tools</h1>
        <p className="text-gray-300">Select a tool to get started</p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/digitizer"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
          >
            Go to Digitizer
          </Link>
          <Link
            to="/exact-mix"
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
          >
            Go to Exact Mix
          </Link>
          <Link
            to="/solver"
            className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-500"
          >
            Solver
          </Link>
        </div>
      </div>
    </div>
  );
}
