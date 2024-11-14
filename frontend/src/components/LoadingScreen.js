import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style.css';

const LoadingScreen = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 4000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="logo-container">
                    <img src="../images/JaviCook_logo.png" alt="Logo de la App" className="logo" />
                    <h1 className="app-title">Tus Recetas Favoritas</h1>
                </div>
                <p className="loading-message">¡Descubre, comparte y guarda tus mejores recetas!</p>
                <div className="spinner2"></div>
                <p className="loading-text">Cargando...</p>

            </div>
           
        </div>

        
    );
};
                      

export default LoadingScreen;
