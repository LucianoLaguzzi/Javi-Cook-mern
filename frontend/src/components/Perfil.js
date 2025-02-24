import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet';
import Swal from 'sweetalert2';



const Perfil = () => {
    const [usuario, setUsuario] = useState(null);
    const [recetas, setRecetas] = useState([]);
    const [editandoNombre, setEditandoNombre] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState(usuario ? usuario.nombre : '');
    const [editandoEmail, setEditandoEmail] = useState(false);
    const [nuevoEmail, setNuevoEmail] = useState(usuario ? usuario.email : '');
    const [imagenPerfil, setImagenPerfil] = useState(null);
    const [mostrarRecetas, setMostrarRecetas] = useState(false);
    const [mostrandoBotonGuardar, setMostrandoBotonGuardar] = useState(false);

    const [notificaciones, setNotificaciones] = useState([]);
    const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);


    const navigate = useNavigate();
    
    const usuarioEnSesion = JSON.parse(localStorage.getItem('usuario'));


    useEffect(() => {
        if (usuarioEnSesion) {
            setUsuario(usuarioEnSesion);
            setNuevoNombre(usuarioEnSesion.nombre);
            setNuevoEmail(usuarioEnSesion.email);
            obtenerNotificaciones();
        } else {
            console.error('No se encontró el usuario en el almacenamiento local');
        }

        const obtenerRecetas = async () => {
            try {
                const response = await axios.get(`https://javicook-mern.onrender.com/api/recetas/usuario/${usuarioEnSesion._id}`);
                setRecetas(response.data);
            } catch (error) {
                console.error('Error al obtener las recetas del usuario:', error);
            }
        };

        if (usuarioEnSesion) {
            obtenerRecetas();
        }
    }, []);


    const obtenerNotificaciones = async () => {
        try {
            const response = await axios.get(`https://javicook-mern.onrender.com/api/notificaciones/${usuarioEnSesion._id}`);
            setNotificaciones(response.data);
        } catch (error) {
            console.error('Error al obtener las notificaciones:', error);
        }
    };


    const marcarComoLeida = async (id) => {
        try {
            await axios.put(`https://javicook-mern.onrender.com/api/notificaciones/marcarLeida/${id}`);
            setNotificaciones(prev => prev.map(notif => notif._id === id ? { ...notif, leida: true } : notif));
        } catch (error) {
            console.error('Error al marcar la notificación como leída:', error);
        }
    };


    const manejarClickNotificacion = async (notif) => {
        if (!notif.leida) {
            await marcarComoLeida(notif._id);
        }
        if (notif.enlace) {
            window.location.href = notif.enlace;  // Redirige a la receta
        }
    };

    const eliminarNotificacion = async (e, id) => {
        e.stopPropagation(); // Evita que se dispare el click de redirección
    
        try {
            await axios.delete(`https://javicook-mern.onrender.com/api/notificaciones/eliminar/${id}`);
            setNotificaciones(prev => prev.filter(notif => notif._id !== id));
        } catch (error) {
            console.error('Error al eliminar la notificación:', error);
        }
    };


    const formatearMensaje = (mensaje) => {
        // Separa el mensaje en partes usando una expresión regular que detecta palabras que empiezan con "@"
        const partes = mensaje.split(/(@\w+)/g);
        return partes.map((parte, i) => {
          // Si la parte empieza con @, envuélvela en un span con una clase para estilizarla
          if (parte.startsWith('@')) {
            return <span key={i} className="mencion">{parte}</span>;
          }
          return parte;
        });
      };


    const toggleRecetas = (e) => {
        e.preventDefault();
        setMostrarRecetas(!mostrarRecetas);
    };



    // Manejar la selección de la imagen
    const manejarImagen = (event) => {  
        const archivo = event.target.files[0];
        setImagenPerfil(archivo);
        
        // Crear una URL temporal para mostrar una vista previa de la imagen
        const vistaPrevia = URL.createObjectURL(archivo);
        document.getElementById('imagePreview').src = vistaPrevia;
        
        // Mostrar el botón de "Guardar" al seleccionar una nueva imagen
        setMostrandoBotonGuardar(true);
    };

  
   // Función para guardar la imagen de perfil
    const guardarImagen = async () => {
        const formData = new FormData();
        formData.append('imagenPerfil', imagenPerfil);

        try {
            const response = await axios.put(
                `https://javicook-mern.onrender.com/api/usuarios/imagen-perfil/${usuario._id}`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            console.log('Imagen de perfil actualizada:', response.data);

            // Actualizar el estado y el localStorage
            const usuarioActualizado = { ...usuario, imagenPerfil: response.data.imagenPerfil };
            setUsuario(usuarioActualizado);
            localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));


            setMostrandoBotonGuardar(false);
        } catch (error) {
            console.error('Error al guardar la imagen:', error.response ? error.response.data : error);
        }
    };

    
    




    // Función para actualizar usuario en el backend
    const actualizarUsuario = async (actualizado) => {
        try {
            const response = await axios.put(`https://javicook-mern.onrender.com/api/usuarios/actualizarPerfil/${usuario._id}`, actualizado);
            
            // Actualiza el estado del usuario
            setUsuario(response.data);
            
            // Actualiza el usuario en el localStorage para que persista el cambio sin necesidad de recargar
            localStorage.setItem('usuario', JSON.stringify(response.data));

            Swal.fire({
                icon: 'success',
                title: 'Perfil actualizado',
                text: 'Los cambios se han guardado correctamente.',
              });
            
        } catch (error) {
            
            // Si la respuesta tiene un mensaje de error lo usamos para SweetAlert
            if (error.response && error.response.data && error.response.data.error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al actualizar',
                    text: error.response.data.error,
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error inesperado',
                    text: 'Hubo un error al actualizar el perfil, inténtelo de nuevo más tarde.',
                });
            }
            // Lanza el error para que la función que llamó a actualizarUsuario pueda manejarlo
            throw error;
        }
    };

    // Función para guardar el nuevo nombre
    const guardarNombre = async () => {
        if (nuevoNombre !== usuario.nombre) {
            try {
                await actualizarUsuario({ ...usuario, nombre: nuevoNombre });
                // Si se actualizó correctamente, terminamos la edición
                setEditandoNombre(false);
            } catch (error) { 
            // Si hay error (por ejemplo, nombre duplicado), revertimos el valor del input
            setNuevoNombre(usuario.nombre)
            setEditandoNombre(false);
            }
        } else {
            setEditandoNombre(false);
        }
        
    };

    // Función para guardar el nuevo email
    const guardarEmail = async () => {
        if (nuevoEmail !== usuario.email) {
          try {
            await actualizarUsuario({ ...usuario, email: nuevoEmail });
            // Si se actualizó correctamente, terminamos la edición
            setEditandoEmail(false);
          } catch (error) {
            // Si hay error (por ejemplo, email duplicado), revertimos el valor del input
            setNuevoEmail(usuario.email);
            setEditandoEmail(false);
          }
        } else {
          setEditandoEmail(false);
        }
      };

    // Función para cancelar la edición de nombre
    const cancelarNombre = () => {
        setNuevoNombre(usuario.nombre);
        setEditandoNombre(false);
    };

    // Función para cancelar la edición de email
    const cancelarEmail = () => {
        setNuevoEmail(usuario.email);
        setEditandoEmail(false);
    };


    
    const capitalizarPrimeraLetra = (texto) => {
        if (!texto) return ''; // Maneja el caso de texto vacío
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    };

    return (
        <div>
            <Helmet>
                <title>{`Perfil del Usuario - ${usuarioEnSesion.nombre}`}</title>
                <link rel="icon" href="/favicon-login.png"/>
            </Helmet>
        
            <div className="body-pefil">
                <div className="encabezado">
                    <div className="barra-navegacion">
                        <img src="../images/JaviCook_logo.png" alt="Logotipo" className="logo-principal" />

                    
                        <div className="bienvenido-text">
                            <span >Bienvenido, {usuarioEnSesion?.nombre}!</span>
                        </div>

                        <div className="subtitulo-perfil">
                            <span > Pefil del usuario </span>
                        </div>

                        <img src="../images/cubiertos-cruzados.png" className="img-cerrar-sesion" alt="Cerrar Sesión" 
                            onClick={() => {
                                localStorage.removeItem('usuario');
                                console.log('Cerrar sesión');
                                navigate('/login');
                                window.history.pushState(null, '', '/login'); // Asegura que no pueda regresar a la página anterior
                            }}  />
                    </div>
                </div>





                <div className='notifica'>
                    <div className="icono-notificaciones">
                    <i  className={`fas fa-bell campana ${mostrarNotificaciones ? 'campana-activa' : 'campana-inactiva'}`} 
                        onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}>
                    </i>
                        {notificaciones.filter(n => !n.leida).length > 0 && (
                            <span className="contador-notificaciones">{notificaciones.filter(n => !n.leida).length}</span>
                        )}

                        {mostrarNotificaciones && (
                            <div className="lista-notificaciones">
                                {notificaciones.length > 0 ? (
                                    notificaciones.map(notif => (
                                        <div key={notif._id} 
                                        className={`notificacion ${notif.leida ? 'leida' : ''}`}
                                        onClick={() => manejarClickNotificacion(notif)}
                                        >
                                            <p>{formatearMensaje(notif.mensaje)}</p>
                                            <button className="btn-eliminar" title='Eliminar notificación' onClick={(e) => eliminarNotificacion(e, notif._id)}>
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-notification">No tienes notificaciones.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>






                

                <section class="perfil-section">
                    <div className="perfil-form">
                        <h1>Perfil del usuario</h1>

                        <div className="perfil-imagen">
                            <div className="image-container">
                                <img
                                    id="imagePreview"
                                    src={usuario && usuario.imagenPerfil ? `${usuario.imagenPerfil}` : '/default-imagen-perfil.jpg'}
                                    alt="Imagen de Perfil"
                                    className="imagen-perfil"
                                />
                                <label htmlFor="imagen" className="edit-icon">
                                    <i className="fa fa-camera" title="Editar imagen"></i>
                                </label>
                            </div>
                            <input
                                type="file"
                                id="imagen"
                                accept="image/*"
                                onChange={manejarImagen}
                                className="input-imagen2"
                            />
                            {mostrandoBotonGuardar && (
                                <button onClick={guardarImagen} className="boton-guardar-imagen">
                                    Guardar
                                </button>
                            )}
                        </div>

                        <div className='inputs-perfil'>
                            <div className="perfil-usuario">
                                {/* Sección del nombre de usuario */}
                                <div className="perfil-inputs">
                                    <div className="div-label-perfil">
                                        <label className="perfil-label-usuario">Usuario:</label>
                                    </div>

                                    {/* Muestra el nombre o el input de edición */}
                                    {editandoNombre ? (
                                        <input
                                            type="text"
                                            value={nuevoNombre}
                                            onChange={(e) => setNuevoNombre(e.target.value)}
                                            className="input-nuevo-nombre"
                                        />
                                    ) : (<div className='output-nombre-usuario'>
                                            <span className="output-nombre-usuario-texto">{usuario ? usuario.nombre : 'Cargando...'}</span>
                                        </div>
                                    )}

                                </div> 

                                    {/* Botón para editar nombre */}
                                    {!editandoNombre && (
                                        <a className="btn-editar-user" title="Editar Usuario" onClick={() => setEditandoNombre(true)}>
                                            <i className="fas fa-pencil-alt"></i>
                                        </a>
                                    )}
                                

                                {/* Botones de cancelar y guardar solo si está editando */}
                                {editandoNombre && (
                                    <div className="cancel-ok">
                                        <a className="btn-cancelar-user" title="Cancelar" onClick={cancelarNombre}>
                                            <i className="fas fa-times-circle"></i>
                                        </a>
                                        <a className="btn-guardar-icon" title="Guardar" onClick={guardarNombre}>
                                            <i className="fas fa-check-circle"></i>
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className='perfil-email'>
                                {/* Sección del email del usuario */}
                                <div className="perfil-inputs">
                                    <div className="div-label-perfil">
                                        <label className="perfil-label-email">Email:</label>
                                    </div>

                                    {/* Muestra el email o el input de edición */}
                                    {editandoEmail ? (
                                        <input
                                            type="text"
                                            value={nuevoEmail}
                                            onChange={(e) => setNuevoEmail(e.target.value)}
                                            className="input-nuevo-email"
                                        />
                                    ) : (
                                        <div className='output-email-usuario'>
                                            <span className="output-email-usuario-texto">{usuario ? usuario.email : 'Cargando...'}</span>
                                        </div>
                                    )}
                                    
                                    </div>

                                    {/* Botón para editar email */}
                                    {!editandoEmail && (
                                        <a className="btn-editar-email" title="Editar Email" onClick={() => setEditandoEmail(true)}>
                                            <i className="fas fa-pencil-alt"></i>
                                        </a>
                                    )}
                                

                                {/* Botones de cancelar y guardar solo si está editando */}
                                {editandoEmail && (
                                    <div className="cancel-ok">
                                        <a className="btn-cancelar-email" title="Cancelar" onClick={cancelarEmail}>
                                            <i className="fas fa-times-circle"></i>
                                        </a>
                                        <a className="btn-guardar-icon" title="Guardar" onClick={guardarEmail}>
                                            <i className="fas fa-check-circle"></i>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="div-recetas-usuario">
                            <a href="#" className="link" onClick={toggleRecetas}>Ver recetas del usuario</a>
                            {mostrarRecetas && (
                                <div className="recetas-del-usuario">
                                    {recetas.length > 0 ? (
                                        <ul>
                                            {recetas.map((receta) => (
                                                <li key={receta._id} className="tarjeta-receta2">
                                                    <a
                                                        href="#"
                                                        className="receta-etiqueta"
                                                        onClick={() => navigate(`/detalle-receta/${receta._id}`)}
                                                    >
                                                        {capitalizarPrimeraLetra(receta.titulo)}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (   
                                        <p>No tienes recetas subidas aún.</p>
                                    )}
                                </div>
                            )}
                        </div>


                        <div className="perfil-link-index">
                            <span className="mensaje-ir-index">
                                <a onClick={() => {navigate('/inicio');}} className="link"> Volver a las recetas</a>
                            </span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Perfil;
