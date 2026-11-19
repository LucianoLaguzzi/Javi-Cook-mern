import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Helmet } from 'react-helmet';
import { API_BASE_URL } from '../config/api';

const CambiarContrasenia = () => {
    const { token } = useParams(); // Obtener el token de la URL
    const [nuevaContrasenia, setNuevaContrasenia] = useState('');
    const [confirmarContrasenia, setConfirmarContrasenia] = useState('');
    const [error, setError] = useState('');
    const [mostrarError, setMostrarError] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMostrarError(false);

        if (nuevaContrasenia !== confirmarContrasenia) {
            setError('Las contraseñas no coinciden.');
            setMostrarError(true);
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/usuarios/cambiar-contrasenia`, // Ruta relativa
                { token, nuevaContrasenia },
                { headers: { 'Content-Type': 'application/json' } }
            );

            // Verificar si el mensaje es el esperado
            if (response.status === 200) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Contraseña cambiada!',
                    text: 'Tu contraseña ha sido cambiada con éxito.',
                    confirmButtonText: 'OK',

                    customClass: {
                        popup: 'swal-envio-exitoso',
                        title: 'swal-small-title',
                        content: 'swal-small-text',
                        confirmButton: 'swal-small-button',
                    }
                });

                // Limpiar los campos después de un envío exitoso
                setNuevaContrasenia('');
                setConfirmarContrasenia('');
            } else {
                throw new Error('Error al cambiar la contraseña');
            }
            
        } catch (error) {
            console.error('Error al cambiar la contraseña:', error.response || error);

            if (error.response?.status === 400) {
                setError('El enlace para cambiar la contraseña no es válido o ya fue utilizado.');
            } else if (error.response?.status === 404) {
                setError('No encontramos la cuenta asociada a este enlace.');
            } else {
                setError('No pudimos cambiar tu contraseña. Intentá nuevamente.');
            }

            setMostrarError(true);
        }
    };  


    useEffect(() => {
        if (mostrarError) {
            const timer = setTimeout(() => {
                setMostrarError(false);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [mostrarError]);

    return (
        <div>
            <Helmet>
                <title>Cambiar contraseña</title>
                <link rel="icon" href="/favicon-login.png" />
            </Helmet>
            <div className="recuperar-contrasenia">
                <header className="titulo-recuperar">
                    <h1>Cambiar contraseña</h1>
                    <p>Ya falta poco para recuperar tu cuenta de JaviCook.</p>
                </header>

                <section className="cambiar-section">
                    <form className='recuperar-form' onSubmit={handleSubmit}>   
                        <h2 className='titulo-recuperar-pass'>Ingresa tu nueva contraseña</h2>

                        <p className="p-recuperar-pass">Ingrese su nueva contraseña y confírmela para poder acceder a su cuenta nuevamente.</p>

                        

                        <div className='entrada-recuperar'>
                            <input
                                type="password"
                                placeholder="Nueva Contraseña"
                                value={nuevaContrasenia}
                                onChange={(e) => setNuevaContrasenia(e.target.value)}
                                required
                            />
                        </div>
                        <div className='entrada-recuperar'>
                            <input
                                type="password"
                                placeholder="Confirmar Contraseña"
                                value={confirmarContrasenia}
                                onChange={(e) => setConfirmarContrasenia(e.target.value)}
                                required
                            />
                        </div>

                        <div
                            className={`error-container ${mostrarError ? 'visible' : ''}`}
                            role="alert"
                            aria-hidden={!mostrarError}
                        >
                            <i className="fas fa-exclamation-circle"></i>
                            <p>{error}</p>
                        </div>

                        <button className='boton-cambiar-contrasenia' type="submit">Cambiar contraseña</button>

                        <div className="panel-links">
                            <span className="mensaje-ir-login">
                                <a href="/login" className="link">Ir al login</a>
                            </span>
                        </div>
    
                    </form>
                </section>
            </div>
        </div>
    );
};

export default CambiarContrasenia;
