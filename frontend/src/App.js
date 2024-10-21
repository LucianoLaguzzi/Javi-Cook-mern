// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Inicio from './components/Inicio'; // o Recetas
import Registro from './components/Registro'; // Asegúrate de que la ruta es correcta
import DetalleReceta from './components/DetalleReceta';
import Perfil from './components/Perfil';




function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/inicio" element={<Inicio />} />  {/* Página después de login */}
                    <Route path="/registro" element={<Registro />} />
                    <Route path="/detalle-receta/:id" element={< DetalleReceta />} />
                    <Route path="/perfil/:id" element={<Perfil />} />

                </Routes>
            </div>
        </Router>
    );
}


export default App;
