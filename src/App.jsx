import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import LearnPage from './pages/LearnPage';
import ChallengePage from './pages/ChallengePage';
import CustomChallengePage from './pages/CustomChallengePage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/room/:id" element={<RoomDetailPage />} />
          <Route path="/room/:id/learn" element={<LearnPage />} />
          <Route path="/room/:id/challenge" element={<ChallengePage />} />
          <Route path="/custom-challenge" element={<CustomChallengePage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
