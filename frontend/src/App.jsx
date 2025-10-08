import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Register from './pages/Register';
import DetalleProyecto from './components/DetalleProyecto';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import MisProyectos from './pages/MisProyectos';
import './App.css';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} /> 
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* Rutas que requieren Navbar */}
        <Route element={<><Navbar /><Outlet /></>}>
          <Route path="/home" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<DetalleProyecto />} /> {/* Ruta dinámica */}
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/mis-proyectos" element={<MisProyectos />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;