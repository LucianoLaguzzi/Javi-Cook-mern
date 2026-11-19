import React, { useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet';
import '../style.css'; // Asegúrate de que la ruta sea correcta
import { API_BASE_URL } from '../config/api';
import { Link } from 'react-router-dom'; // Importar el hook useNavigate


const Registro = () => {
  const [nombre, setNombre] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [email, setEmail] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [erroresCampos, setErroresCampos] = useState({});



  const manejarRegistro = async (e) => {
    e.preventDefault();

    setErroresCampos({});
    setMensajeError('');
    setMensajeExito('');

    try {
        const response = await axios.post(`${API_BASE_URL}/api/usuarios/registrar`, {
            nombre,
            contrasenia,
            email,
        });

        setMensajeExito(response.data.mensaje);

        setNombre('');
        setContrasenia('');
        setEmail('');

    } catch (error) {

        console.error('Error en el registro:', error);

        if (error.response) {
            const errores = error.response.data.errores;

            if (errores) {
                setErroresCampos(errores);
            } else {
                setMensajeError(
                    error.response.data.mensaje || 'Error al registrar el usuario.'
                );
            }

        } else {
            setMensajeError('Error de conexión. Intentá nuevamente.');
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

        <header className="titulo-registrar">
          <h1>Creá tu cuenta en JaviCook</h1>
          <p>Un espacio para tus recetas favoritas.</p>
        </header>

        <section className="new-user-section">

          <form className="new-user-form" onSubmit={manejarRegistro}>
              
            <h2 className="new-user-title">Registre sus datos</h2>
              <div className="entrada">
                <input
                    type="text"
                    placeholder="Usuario"
                    value={nombre}
                    onChange={(e) => {
                        setNombre(e.target.value);
                        setErroresCampos((prev) => ({
                            ...prev,
                            nombre: ''
                        }));
                    }}
                    className={`inp-nuevo-usuario ${erroresCampos.nombre ? 'input-error' : ''}`}
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
                  onChange={(e) => {
                      setEmail(e.target.value);
                      setErroresCampos((prev) => ({
                          ...prev,
                          email: ''
                      }));
                  }}
                  className={`inp-nuevo-email ${erroresCampos.email ? 'input-error' : ''}`}
                  required
              />
              <i className="fas fa-envelope"></i>
            </div>


            <div className={`errores-registro ${Object.values(erroresCampos).some(Boolean) ? 'visible' : ''}`}>
              {Object.entries(erroresCampos).map(([campo, mensaje]) => (
                  mensaje && (
                      <div className="error-item" key={campo}>
                          <i className="fas fa-exclamation-circle"></i>
                          <p>{mensaje}</p>
                      </div>
                  )
              ))}
            </div>




            <button type="submit" className="boton-registrar-usuario">Registrarse</button>

            {mensajeExito && (
              <div className="exito-registro">
                  <i className="fas fa-check-circle"></i>
                  <p>{mensajeExito}</p>
              </div>
            )}

            <div className="panel-links">
              <span className="mensaje-ir-login">
                ¿Ya tenés usuario? <Link to="/login" className="link">Iniciar sesión</Link>
              </span>
            </div>
          </form>
        </section>

        <div className="volver-inicio">
            <Link to="/inicio" className="link-volver">
                ← Explorar recetas sin iniciar sesión
            </Link>
        </div>

      </div>
    </div>
  );
};

export default Registro;
