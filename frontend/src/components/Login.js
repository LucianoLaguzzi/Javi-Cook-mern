import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Importar el hook useNavigate
import '../style.css';

function Login() {
    const [usuario, setUsuario] = useState('');
    const [contrasenia, setContrasenia] = useState('');
    const [error, setError] = useState('');
    const [mostrarError, setMostrarError] = useState(false); // Estado para mostrar/ocultar el error
    const navigate = useNavigate(); // Hook para redireccionar

    const handleLogin = async (e) => {
        e.preventDefault();
        setMostrarError(false); // Ocultar el mensaje de error cuando se intenta nuevamente
        try {
            const response = await axios.post('https://javicook-mern.onrender.com/api/usuarios/login', { //antes de /api va la url del backend
                nombre: usuario,
                contrasenia
            });         

            // Guarda la información del usuario en localStorage
            localStorage.setItem('usuario', JSON.stringify(response.data.usuario)); // Asumiendo que el usuario viene en la respuesta

            console.log('Login exitoso:', response.data);
            // Redirecciona al usuario o guarda el token de sesión
            navigate('/inicio'); // Cambia '/inicio' por la ruta que corresponda

        } catch (error) {
            setError('Usuario o contraseña incorrectos');
            setMostrarError(true); // Mostrar el mensaje de error
        }
    };

    // Usar useEffect para ocultar el mensaje de error después de 5 segundos
    useEffect(() => {
        if (mostrarError) {
            const timer = setTimeout(() => {
                setMostrarError(false); // Ocultar el mensaje después de 5 segundos
            }, 5000);

            return () => clearTimeout(timer); // Limpiar el timer si el componente se desmonta
        }
    }, [mostrarError]);

    return (
        <body className="login">
            <header>
                <h1>¡Bienvenido a JaviCook!</h1>
                <p>Por favor, inicia sesión para continuar.</p>
            </header>
            <section className="login-container">
                {mostrarError && (
                    <div className="error-container">
                        <p>{error}</p>
                    </div>
                )}

                <form className="login-form" onSubmit={handleLogin}>
                    <h2 className="login-title">Login</h2>

                    <div className="entrada">
                        <input type="text"
                            placeholder="Usuario"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            required
                            className="input-usuario"
                        />
                        <i className="fas fa-user"></i>
                    </div>

                    <div className="entrada">
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={contrasenia}
                            onChange={(e) => setContrasenia(e.target.value)}
                            required
                        />
                        <i className="fas fa-lock"></i>
                    </div>

                    <button type="submit" className="boton-iniciar-sesion">Iniciar sesión</button>

                    <div className="panel-links">
                        <span className="mensaje-ir-registrar">
                            ¿No tenés usuario? <a href="/registro" className="link">Registrarse</a>
                        </span>
                    </div>

                    <span className="mensaje-recuperar-contrasenia">
                        <a href="/recuperar" className="link">¿Olvidaste tu contraseña?</a>
                    </span>
                </form>
            </section>
        </body>
    );
}

export default Login;
