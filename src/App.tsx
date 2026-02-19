import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.tsx';
import Digitizer from './pages/Digitizer.tsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/digitizer" element={<Digitizer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
