import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Digitizer from '@/pages/Digitizer';
import ExactMix from '@/pages/ExactMix';
import Solver from '@/pages/Solver';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/digitizer" element={<Digitizer />} />
        <Route path="/exact-mix" element={<ExactMix />} />
        <Route path="/solver" element={<Solver />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
