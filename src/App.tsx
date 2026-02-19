import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Digitizer from '@/pages/Digitizer';
import ExactMix from '@/pages/ExactMix';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/digitizer" element={<Digitizer />} />
        <Route path="/exact-mix" element={<ExactMix />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
