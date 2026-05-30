import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Vote from './pages/Vote';
import Results from './pages/Results';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Vote />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </Router>
  );
}

export default App;
