import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import SetupPage from './pages/SetupPage';
// import VolleyballTracker from './pages/VolleyballTracker';
import VolleyballTracker from './pages/VolleyballTrackerV2';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/setup" replace />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/track" element={<VolleyballTracker />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;