import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Helmet } from 'react-helmet';

const CambiarContrasenia = () => {
    const { token } = useParams(); // Obtener el token de la URL
    const [nuevaContrasenia, setNuevaContrasenia] = useState('');
    const [confirmarContrasenia, setConfirmarContrasenia] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (nuevaContrasenia !== confirmarContrasenia) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Las contraseñas no coinciden.',
                confirmButtonText: 'OK',

                customClass: {
                    confirmButton: 'swal-small-button-error',
                }
            });
            return;
        }

        try {
            await axios.post('/api/usuarios/cambiar-contrasenia', // Ruta relativa
                { token, nuevaContrasenia },
                { headers: { 'Content-Type': 'application/json' } }
            );
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
            
        } catch (error) {
            console.error('Error al cambiar la contraseña:', error.response || error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Error al cambiar la contraseña. Inténtalo de nuevo.',
                confirmButtonText: 'OK',
            });
        }
    };  

    return (
        <div>
            <Helmet>
                <title>Cambiar contraseña</title>
                <link rel="icon" href="/favicon-login.png" />
            </Helmet>
            <body className='recuperar-contrasenia'>
                <header className="titulo-registrar">
                    <h1> Cambiar contraseña</h1>
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
                            />
                        </div>
                        <div className='entrada-recuperar'>
                            <input
                                type="password"
                                placeholder="Confirmar Contraseña"
                                value={confirmarContrasenia}
                                onChange={(e) => setConfirmarContrasenia(e.target.value)}
                            />
                        </div>

                        <button className='boton-cambiar-contrasenia' type="submit">Cambiar contraseña</button>

                        <div className="panel-links">
                            <span className="mensaje-ir-login">
                                <a href="/login" className="link">Ir al login</a>
                            </span>
                        </div>
    
                    </form>
                </section>
            </body>
        </div>
    );
};

export default CambiarContrasenia;
