import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Helmet } from 'react-helmet';

const RecuperarContrasenia = () => {
    const [usuario, setUsuario] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Enviando solicitud de recuperación:", usuario); // Para depuración

         // Muestra el SweetAlert de carga al enviar
         Swal.fire({
            title: 'Enviando...',
            text: 'Por favor espera mientras procesamos tu solicitud.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        axios.post('https://javicook-mern.onrender.com/api/usuarios/recuperar', { usuario })
        .then(response => {
            Swal.fire({
                icon: 'success',
                title: '¡Correo enviado con éxito!',
                text: 'Revisa tu email para cambiar tu contraseña.',
                confirmButtonText: 'OK',
                width: '335px',   // Reducir el ancho para un tamaño más pequeño
                padding: '0.5em', // Ajusta el padding para menos espacio interno
                heightAuto: false, // Para evitar que SweetAlert ajuste automáticamente el alto
        
                // Opcional: reducir la fuente para mantener las proporciones
                customClass: {
                    popup: 'swal-envio-exitoso',
                    title: 'swal-small-title',
                    content: 'swal-small-text',
                    confirmButton: 'swal-small-button'
                }
            });
            setMensaje('');
            setError('');
            setUsuario('');
        })
            .catch(err => {
                Swal.close(); // Cierra el SweetAlert de carga antes de mostrar el mensaje de error
                setError(err.response.data.error);
                setMensaje('');
                
                // Borrar el mensaje de error después de 5 segundos
                setTimeout(() => setError(''), 5000);
            });
    };

    return (
        <div>
            <Helmet>
                <title>Recuperar contraseña</title>
                <link rel="icon" href="/favicon-login.png" />
            </Helmet>
            <body className='recuperar-contrasenia'>
                <header className="titulo-registrar">
                    <h1> Recuperación de contraseña</h1>
                </header>
                <section className="recuperar-section">
                    <h2 className="titulo-recuperar-pass">Recuperar Contraseña</h2>
                    <p className="p-recuperar-pass">
                        Si olvidaste tu contraseña, puedes recuperarla ingresando aquí tu nombre de usuario o email y te enviaremos un email con un link para que puedas lograr un cambio de contraseña
                    </p>

                    <form onSubmit={handleSubmit} className="recuperar-form">
                        <div className="entrada-recuperar">
                            <input 
                                type="text"
                                value={usuario} 
                                onChange={(e) => setUsuario(e.target.value)} 
                                placeholder="Ingrese usuario o email..." 
                                required 
                            />
                        </div>
                        <div style={{height:'20px'}}>
                            {error && <p className="error-usuario-recuperar">{error}</p>}
                        </div>
                        <button className="boton-recuperar-contrasenia" type="submit">Recuperar</button>

                        <div className="panel-links">
                            <span className="mensaje-ir-login">
                                <a href="/login" className="link">Volver a login</a>
                            </span>
                        </div>
                    </form>
                </section>

                {mensaje && <p className="mensaje-exito">{mensaje}</p>}
            </body>
        </div>
    );
};

export default RecuperarContrasenia;
