// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, } from 'react-router-dom';
import Login from './components/Login';
import Inicio from './components/Inicio';
import Registro from './components/Registro';
import DetalleReceta from './components/DetalleReceta';
import Perfil from './components/Perfil';
import RecuperarContrasenia from './components/RecuperarConsetania';
import CambiarContrasenia from './components/CambiarContrasenia';
import LoadingScreen from './components/LoadingScreen';
import { Helmet } from 'react-helmet';




function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LoadingScreen />} /> {/* Pantalla de carga */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/inicio" element={<Inicio />} />  {/* Página después de login */}
                    <Route path="/registro" element={<Registro />} />
                    <Route path="/detalle-receta/:slug/:id" element={<DetalleReceta />} />
                    <Route path="/perfil/:id" element={<Perfil />} />
                    <Route path="/recuperar" element={<RecuperarContrasenia />} />
                    <Route path="/recuperar/:token" element={<CambiarContrasenia />} />

                    <Route
                        path="*"
                        element={
                            <div className="pagina-no-encontrada">
                            <Helmet>
                                <title>Página no encontrada - JaviCook</title>
                            </Helmet>

                            <h2>404</h2>
                            <p>La página que estás buscando no existe.</p>

                            <button onClick={() => window.location.href = '/inicio'}>
                                Ir al inicio
                            </button>
                            </div>
                        }
                    />

                </Routes>
            </div>
        </Router>
    );
}


export default App;
