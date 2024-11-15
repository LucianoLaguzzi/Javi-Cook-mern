import React, { useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet';
import '../style.css'; // Asegúrate de que la ruta sea correcta

const Registro = () => {
  const [nombre, setNombre] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [email, setEmail] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const manejarRegistro = async (e) => {
    e.preventDefault(); // Evitar que el formulario se envíe de manera convencional

    try {
      const response = await axios.post('https://javicook-mern.onrender.com/api/usuarios/registrar', {
        nombre,
        contrasenia,
        email,
      });

      // Si la respuesta es exitosa
      setMensajeExito(response.data.mensaje);
      setNombre('');
      setContrasenia('');
      setEmail('');
      setMensajeError(''); // Limpiar el mensaje de error
    } catch (error) {
      
      console.error('Error en el registro:', error); // Imprimir el error
 
      if (error.response) {
        setMensajeError(error.response.data.mensaje || 'Error al registrar el usuario');
      } else {
        setMensajeError('Error de conexión');
      }
    }
  };

  return (

    <div>
      <Helmet>
          <title>Registrar usuario</title>
          <link rel="icon" href="/favicon-login.png" />
      </Helmet>
    
      <div className="body-new-user">
        {mensajeError && (
          <div id="error-container">
            <i className="fa fa-exclamation-circle"></i>
            <p>{mensajeError}</p>
          </div>
        )}

        {mensajeExito && (
          <div id="exito-container">
            <i className="fa fa-check-circle"></i>
            <p>{mensajeExito}</p>
          </div>
        )}

        <header className="titulo-registrar">
          <h1>Registrar nuevo usuario</h1>
        </header>

        <section className="new-user-section">

          <form className="new-user-form" onSubmit={manejarRegistro}>
              
          <h2 className="new-user-title">Registre sus datos</h2>
            <div className="entrada">
              <input
                type="text"
                placeholder="Usuario"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="inp-nuevo-usuario"
                required
              />
              <i className="fas fa-user"></i>
            </div>

            <div className="entrada">
              <input
                type="password"
                placeholder="Contraseña"
                value={contrasenia}
                onChange={(e) => setContrasenia(e.target.value)}
                className="inp-nueva-pass"
                required
              />
              <i className="fas fa-lock"></i>
            </div>

            <div className="entrada">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="inp-nuevo-email"
                required
              />
              <i className="fas fa-envelope"></i>
            </div>

            <button type="submit" className="boton-registrar-usuario">Registrarse</button>

            <div className="panel-links">
              <span className="mensaje-ir-login">
                ¿Ya tenés usuario? <a href="/login" className="link">Iniciar sesión</a>
              </span>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Registro;
