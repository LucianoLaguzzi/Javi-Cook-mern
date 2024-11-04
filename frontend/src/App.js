// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, } from 'react-router-dom';
import Login from './components/Login';
import Inicio from './components/Inicio'; // o Recetas
import Registro from './components/Registro'; // Asegúrate de que la ruta es correcta
import DetalleReceta from './components/DetalleReceta';
import Perfil from './components/Perfil';
import RecuperarContrasenia from './components/RecuperarConsetania';
import CambiarContrasenia from './components/CambiarContrasenia';
import LoadingScreen from './components/LoadingScreen'; // Importa el componente de carga





function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LoadingScreen />} /> {/* Pantalla de carga */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/inicio" element={<Inicio />} />  {/* Página después de login */}
                    <Route path="/registro" element={<Registro />} />
                    <Route path="/detalle-receta/:id" element={< DetalleReceta />} />
                    <Route path="/perfil/:id" element={<Perfil />} />
                    <Route path="/recuperar" element={<RecuperarContrasenia />} />
                    <Route path="/recuperar/:token" element={<CambiarContrasenia />} />

                </Routes>
            </div>
        </Router>
    );
}


export default App;
