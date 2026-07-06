import { Routes, Route, useLocation } from 'react-router-dom';
import StarField from './components/StarField';
import GlowOrbs from './components/GlowOrbs';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import SongDetail from './pages/SongDetail';

function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <>
      <StarField />
      <GlowOrbs />
      <CustomCursor />

      {!isLanding && <Navbar />}

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/library" element={<Library />} />
        <Route path="/song/:id" element={<SongDetail />} />
      </Routes>
    </>
  );
}

export default App;
