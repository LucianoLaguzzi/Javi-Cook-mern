import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../style.css';
import axios from 'axios';
import { Helmet } from 'react-helmet';
import Swal from 'sweetalert2';

const DetalleReceta = () => {
      
  const usuarioEnSesion = JSON.parse(localStorage.getItem('usuario'));
  const { id } = useParams(); // Para obtener el id de la receta desde la URL
  const navigate = useNavigate();


  const [receta, setReceta] = useState({});
  const [esPropietario, setEsPropietario] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [ingredientesCantidades, setIngredientesCantidades] = useState('');
  const [pasos, setPasos] = useState('');
  const [tituloEditable, setTituloEditable] = useState(false);
  const [ingredientesEditable, setIngredientesEditable] = useState(false);
  const [pasosEditable, setPasosEditable] = useState(false);
  // Estado para manejar los pasos en edición
  const [pasosEditados, setPasosEditados] = useState(pasos.split('\r\n'));

  //Valoraciones
  const [valoracionUsuario, setValoracionUsuario] = useState(0); // Valor del usuario actual
  const [yaValorado, setYaValorado] = useState(false); // Para verificar si ya valoró
  const [valoracionHover, setValoracionHover] = useState(0); // Valoración temporal para hover

  const [edicionActiva, setEdicionActiva] = useState(false);  // Controla si la edición está activa






  

  useEffect(() => {
    // Obtener detalles de la receta desde el backend usando Axios
    const obtenerReceta = async () => {
      try {
        const response = await axios.get(`/api/detalles/${id}`);
        setReceta(response.data);

        // Comparar IDs para determinar si es propietario
        if (response.data.usuario._id === usuarioEnSesion._id) {
          console.log("Es propietario de la receta")
          setEsPropietario(true);
        }

        setIngredientesCantidades(response.data.ingredientesCantidades.join('\r\n'));

        setPasos(response.data.pasos.join('\r\n'));

        // Verificar la estructura de los comentarios
        console.log('Comentarios obtenidos:', response.data.comentarios);

        setComentarios(response.data.comentarios || []); // Inicializar comentarios

        
        // Obtener la valoración del usuario
        const valoracionResponse = await axios.get(`/api/valoraciones/${id}/usuario/${usuarioEnSesion._id}`);
        if (valoracionResponse.data.valoracionUsuario) {
          setValoracionUsuario(valoracionResponse.data.valoracionUsuario);
          setYaValorado(true);
        }


      } catch (error) {
        console.error('Error al cargar la receta', error);
      }
    };
    obtenerReceta();
  }, [id]);


 
  // Manejar la edición del título
  const cambiarTitulo = () => setTituloEditable(true);
  const cancelarTitulo = () => setTituloEditable(false);

  // Función para guardar el nuevo título
  const guardarTitulo = async () => {
      try {
      await axios.put(`/api/recetas/${id}/titulo`, { titulo: receta.titulo });
      setTituloEditable(false);
      } catch (error) {
      console.error('Error al guardar el título', error);
      }
  };


    // Guardar ingredientes
    const guardarIngredientes = async () => {
        try {
          await axios.put(`/api/recetas/${id}/ingredientesCantidades`, { ingredientesCantidades });
          setIngredientesEditable(false);
        } catch (error) {
        console.error('Error al guardar ingredientes', error);
        }
    };

    // Guardar pasos
  const guardarPasos = async () => {
    try {
        // Combina los pasos en un solo string separado por '\r\n'
        const pasosFormateados = pasosEditados.join('\r\n');

        // Usa una URL relativa para evitar clavar localhost
        const response = await axios.put(`/api/recetas/${id}/pasos`, {
            pasos: pasosFormateados
        });

        if (response.status === 200) {
            console.log("Pasos actualizados correctamente");
            // Después de guardar, actualiza el estado de los pasos originales
            setPasos(pasosFormateados);  // Actualiza el estado de los pasos mostrados
            setPasosEditable(false);      // Salir del modo edición
        } else {
            console.error("Error al actualizar los pasos");
        }
    } catch (error) {
        console.error("Error al hacer la solicitud para actualizar los pasos", error);
    }
  };

  // Agregar comentario
  const agregarComentario = async () => {
    if (!nuevoComentario) return;

    console.log('Comentario a enviar:', nuevoComentario);
    console.log('Usuario en sesión:', usuarioEnSesion);

    try {
      const response = await axios.post(`/api/recetas/${id}/comentarios`, {
          comentario: nuevoComentario,
          usuario: usuarioEnSesion._id
      });

      // Esto debería devolver el comentario guardado, incluyendo la referencia al usuario
      setComentarios((prevComentarios) => [...prevComentarios, response.data.comentarioGuardado]); // Actualiza los comentarios
      setNuevoComentario(''); // Limpiar el input
    } catch (error) {
      // Manejar errores más detalladamente
      if (error.response) {
          // La solicitud se realizó y el servidor respondió con un código de estado
          console.error('Error al agregar el comentario:', error.response.data);
      } else if (error.request) {
          // La solicitud se realizó pero no se recibió respuesta
          console.error('No se recibió respuesta del servidor:', error.request);
      } else {
          // Algo sucedió al configurar la solicitud
          console.error('Error en la configuración de la solicitud:', error.message);
      }
    }
  };
  
  // Función para capitalizar la primera letra de cada paso
  const capitalizarPrimeraLetra = (texto) => {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };



  // useEffect para cargar los pasos al activar el modo edición
  useEffect(() => {
    if (pasosEditable) {
        setPasosEditados(pasos.split('\r\n')); // Cargar los pasos actuales al estado de edición
    }
  }, [pasosEditable]);

  // Función para manejar cambios en un paso específico
  const manejarCambioPaso = (index, nuevoValor) => {
    const nuevosPasos = [...pasosEditados];
    nuevosPasos[index] = nuevoValor;
    setPasosEditados(nuevosPasos);
  };

  // Función para agregar un nuevo paso
  const agregarPaso = () => {
    setPasosEditados([...pasosEditados, '']); // Añadir un nuevo paso vacío
  };

  // Función para quitar el último paso
  const quitarPaso = () => {
    if (pasosEditados.length > 1) {
        setPasosEditados(pasosEditados.slice(0, -1)); // Quitar el último paso
    }
  };



 //Valoracion receta:
  const manejarValoracion = async (valor) => {
    try {
      // Si está en modo de edición o es una nueva valoración
      await axios.post('/api/valoraciones', {
        recetaId: id,
        usuarioId: usuarioEnSesion._id,
        valor,
      });

      setValoracionUsuario(valor);
      setYaValorado(true);


      
      // Desactivar el modo de edición
      setEdicionActiva(false);

    } catch (error) {
      console.log('Error al valorar la receta:', error);
    }
  };







  const confirmarEliminar = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4caf50',  // Verde del botón aceptar
      cancelButtonColor: '#d33',      // Rojo del botón cancelar
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#2a2a2a',          // Color del popup más claro que #333333
      color: 'rgb(150 150 150)',                  // Color del texto del popup (blanco)
      customClass: {
        popup: 'custom-popup-class',  // Clase personalizada para más estilos
        confirmButton: 'boton-confirmar-verde',
        cancelButton: 'boton-cancelar-rojo'  // Clases personalizadas para uniformar los botones
      }
    }).then((result) => {
      if (result.isConfirmed) {
        eliminarReceta();  // Llama a la función de eliminación solo si se confirma
      }
    });
  };
  
  const eliminarReceta = async () => {
    try {
      await axios.delete(`/api/recetas/${id}`, {
        data: { usuarioId: usuarioEnSesion._id }
      });
      
     // SweetAlert para éxito al eliminar
    Swal.fire({
      title: 'Receta eliminada',
      text: 'La receta ha sido eliminada con éxito.',
      icon: 'success',
      confirmButtonColor: '#4caf50',  // Verde del botón
      background: '#2a2a2a',          // Fondo oscuro
      color: 'rgb(150 150 150)',      // Color del texto
      customClass: {
        popup: 'custom-popup-class',
        confirmButton: 'boton-confirmar-verde'
      }
    }).then(() => {
      // Redirigir a la página de inicio
      navigate('/inicio');
    });

    } catch (error) {
      console.error('Error al eliminar la receta:', error);
      alert('Hubo un problema al eliminar la receta.');
    }
  };

  




                              //Evento para cancelar la edicion de valorar
  // Aquí defines el useRef
  const estrellasRef = useRef(null);

  useEffect(() => {
    const manejarClickFuera = (event) => {
      // Si haces clic fuera del contenedor de estrellas, desactiva la edición
      if (estrellasRef.current && !estrellasRef.current.contains(event.target)) {
        setEdicionActiva(false);
      }
    };

    // Añadir el evento al hacer clic en cualquier parte del documento
    document.addEventListener('mousedown', manejarClickFuera);

    // Limpiar el evento al desmontar el componente
    return () => {
      document.removeEventListener('mousedown', manejarClickFuera);
    };
  }, []);



  //Mensaje bloqueante
  if (!usuarioEnSesion) {
    return (
      <div className="overlay-bloqueante">
        <div className="mensaje-bloqueante">
          <p>Debes iniciar sesión para interactuar con esta página.</p>
          <button onClick={() => navigate('/login')}>Iniciar sesión</button>
        </div>
      </div>
    );
  }


 // Crear la URL absoluta de la imagen
 const imageUrl = `${window.location.origin}/${receta.imagen?.replace('\\', '/')}`;
    return (
      <div>
        <Helmet>
        <title>{`JaviCook - ${receta.titulo ? capitalizarPrimeraLetra(receta.titulo) : ''}`}</title>
        <link rel="icon" href="/receta-icon.png"/>
        </Helmet>
      
        <div className="body-detalles">
          <div className="encabezado">
            <div className="barra-navegacion">
              <img src="../images/JaviCook_logo.png" alt="Logotipo" className="logo-principal" />
              <span className="bienvenido-text">Bienvenido, {usuarioEnSesion?.nombre}!</span>

              <span class="subtitulo-detalle-receta"> Detalles de la receta </span>
              <img src="../images/cubiertos-cruzados.png" className="img-cerrar-sesion" alt="Cerrar Sesión" 
                onClick={() => {
                    localStorage.removeItem('usuario');
                    console.log('Cerrar sesión');
                    navigate('/login');
                    window.history.pushState(null, '', '/login'); // Asegura que no pueda regresar a la página anterior
                }}  />
            </div>
          </div>
    
          <main className="principal">
            <section className="tarjeta-grande">
              <div className="panel-detalles">
                <div className="div-detalles-titulo">
                  
                  {!tituloEditable ? (
                    <>
                      <p className='detalles-titulo'>
                        {receta.titulo ? capitalizarPrimeraLetra(receta.titulo) : ''}
                      </p>

                      
                      {!esPropietario && (
                        <a className="btn-editar-titulo"  style={{opacity : 0, cursor: 'default'}}>
                          <i className="fas fa-pencil-alt"></i>
                        </a>
                      )}
                      {esPropietario && (
                        <a className="btn-editar-titulo" onClick={cambiarTitulo}>
                          <i className="fas fa-pencil-alt"></i>
                        </a>
                      )}
                    </>

                  ) : (
                    <>
                      <input className='nuevo-titulo'
                        value= {receta.titulo}
                        onChange={(e) => setReceta({ ...receta, titulo: e.target.value })}
                      />

                      <div className='cancel-ok-titulo'>
                        <a className='btn-cancelar-titulo' onClick={cancelarTitulo}>
                          <i className="fas fa-times-circle"></i>
                        </a>
                        <a className='btn-guardar-titulo' onClick={guardarTitulo}>
                          <i className="fas fa-check-circle"></i>
                        </a>
                      </div>
                    </>
                  )}
                </div>
    
                <div className="imagen-contenedor">
                  <img src={imageUrl} alt={receta.titulo} className="panel-img" />
                  <div className="detalles-usuario-fecha">
                    <span>{receta.usuario?.nombre}</span>
                    <span>{new Date(receta.fecha).toLocaleDateString()}</span>
                  </div>
                </div>
    
                <p className="detalles-tiempo-dificultad">
                  <span>Tiempo de preparación: {receta.tiempoPreparacion}' <i class="far fa-clock"/></span>
                  <span className={`detalles-dificultad-${receta.dificultad?.toLowerCase()}`}>{receta.dificultad}</span>
                </p>
    
                <div className="detalles-categoria">
                  <p>Categoría:</p>
                  <span>{receta.categoria}</span>
                </div>
    
                <div className="detalles-cantidades">
                  <p>Ingredientes</p>
                  {!ingredientesEditable ? (
                      <>
                      <div className='valores-cantidad'>
                          {ingredientesCantidades.split('\n').map((ingrediente, index) => {
                              // Separar el ingrediente y la cantidad con un espacio después de ":"
                              const partes = ingrediente.split(':');
                              
                              if (partes.length === 2) {
                                  const ingredienteFormateado = `${partes[0].trim()}: ${partes[1].trim()}`;
                                  return <div key={index}>{ingredienteFormateado}</div>;
                              }
          
                              return <div key={index}>{ingrediente}</div>; // Si no sigue el formato "ingrediente: cantidad", se muestra tal cual.
                          })}
                      </div>
                      {esPropietario && (
                          <a className='btn-editar-ingredientes' onClick={() => setIngredientesEditable(true)}>
                              <i className="fas fa-pencil-alt"></i>
                          </a>
                      )}
                  </>
                  ) : (
                      <>
                          <textarea
                              className='text-area-ingredientes'
                              value={ingredientesCantidades}
                              onChange={(e) => setIngredientesCantidades(e.target.value)}
                          />
                          <div className='cancel-ok-ingredientes'>
                              <a className='btn-cancelar-ingredientes' onClick={() => setIngredientesEditable(false)}>
                                  <i className="fas fa-times-circle"></i>
                              </a>
                              <a className='btn-guardar-ingredientes' onClick={guardarIngredientes}>
                                  <i className="fas fa-check-circle"></i>
                              </a>
                          </div>
                      </>
                  )}
                </div>
                
                <hr className='divider'></hr>
    
                <div className="detalles-pasos">
                  <p>Pasos</p>
                  {!pasosEditable ? (
                      <>
                        {/* Mapear los pasos para mostrar el número y el contenido */}
                        {pasos.split('\n').map((paso, index) => (
                            <div className="paso-item" key={index}>
                                <div className="numero-paso">{index + 1}</div> {/* Número de paso */}
                                <div className="texto-paso">{capitalizarPrimeraLetra(paso)}</div> {/* Texto del paso */}
                            </div>
                        ))}

                        {esPropietario && (
                            <a className='btn-editar-pasos' onClick={() => setPasosEditable(true)}>
                                <i className="fas fa-pencil-alt"></i>
                            </a>
                        )}
                      </>
                  ) : (
                        <>
                        {/* Mostrar textarea para cada paso en modo edición */}
                        <div class="div-pasos-receta">
                          <div id="pasosPanel" className="pasos-panel">
                            {pasosEditados.map((paso, index) => (
                              <div key={index} className="paso">
                                <label htmlFor={`paso${index + 1}`} className="label-pasos">Paso {index + 1}:</label>
                                <textarea
                                  id={`paso${index + 1}`}
                                  className="text-area-pasos"
                                  placeholder="Escribe el paso..."
                                  value={paso}
                                  onChange={(e) => manejarCambioPaso(index, e.target.value)}
                                />
                              </div>
                            ))} 
                             
                          </div>

                          {/* Botones para agregar o quitar pasos */}
                          <div className="div-agregar-quitar-pasos">
                              <button className="btn-agregar-paso" onClick={agregarPaso}>
                                  <i className="fas fa-plus"></i> Paso
                              </button>
                              <button
                                  className="btn-quitar-paso"
                                  onClick={quitarPaso}
                                  style={{ display: pasosEditados.length > 1 ? 'block' : 'none' }}
                              >
                                  <i className="fas fa-minus"></i> Paso
                              </button>
                          </div>

                          <div className='cancel-ok-pasos'>
                              <a className='btn-cancelar-pasos' onClick={() => setPasosEditable(false)}>
                                  <i className="fas fa-times-circle"></i>
                              </a>
                              <a className='btn-guardar-pasos' onClick={guardarPasos}>
                                  <i className="fas fa-check-circle"></i>
                              </a>
                          </div>
                        
                        </div>
                        </>
                      )}
              </div>


              <hr className='divider'></hr>



              {/*Aca va la valoracion*/}
              <span className='titulo-valoracion'>Tu valoración para esta receta</span>
                <div className="detalles-valoracion" ref={estrellasRef}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <i
                      key={i}
                      className={`fa ${i <= (valoracionHover || valoracionUsuario) ? 'fas fa-star' : 'far fa-star'}`}
                      style={{ cursor: edicionActiva || !yaValorado ? 'pointer' : 'default' }}
                      onClick={() => (edicionActiva || !yaValorado) && manejarValoracion(i)} // Permitir click si está en modo edición o aún no ha valorado
                      onMouseEnter={() => (edicionActiva || !yaValorado) && setValoracionHover(i)}
                      onMouseLeave={() => setValoracionHover(0)}
                    />
                  ))}
                </div>

                {/* Botón para activar la edición */}
                {yaValorado && !edicionActiva && (
                  <a onClick={() => setEdicionActiva(true)} className="boton-editar">
                    Editar valoración
                  </a>
                )}

                {/* Mostrar mensaje de edición */}
                {edicionActiva && (
                  <p className="mensaje-edicion">Puedes editar tu valoración ahora.</p>
                )}

              {esPropietario && (
                <hr className='divider'></hr>
              )}

                                      {/* Eliminar receta */}
              {esPropietario && (
                <button className="link-eliminar-receta" onClick={confirmarEliminar}>
                  <i className="fas fa-trash-alt" title="Eliminar receta"></i>
                </button>
              )}









              <div className="detalles-comentarios">
                <i class="far fa-comment-alt"></i>
                <h3>Comentarios</h3>
              </div>

              <div className="input-comentarios">
                <input
                  className="input-comentario"
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  placeholder="Agregar comentario..."
                />
                <button className='boton-comentario' onClick={agregarComentario}>Enviar</button>
              </div>

              <div className="comentarios-usuarios">
                  {comentarios && comentarios.length > 0 ? (
                      comentarios.map((comentario) => (
                          <div key={comentario._id} className="contenedores-spam">
                              <div className="imagen-nombre">
                                  {comentario.usuario && comentario.usuario.imagenPerfil ? (
                                      <img className='imagen-perfil-comentario' src={comentario.usuario.imagenPerfil} alt={comentario.usuario.nombre} />
                                  ) : (
                                      <img src="../images/default-imagen-perfil" alt="Usuario desconocido" />
                                  )}
                                  <span className='usuario-comentario'>{comentario.usuario ? comentario.usuario.nombre : 'Usuario desconocido'}</span>
                              </div>
                              <span className='comentario-fecha'>{new Date(comentario.fecha).toLocaleDateString()}</span>
                              <p className='texto-comentario'>{comentario.comentario}</p>
                          </div>
                      ))
                  ) : (
                      <p>No hay comentarios aún.</p>
                  )}
              </div>

              <hr className='divider'></hr>

              <a className="link"  onClick={() => {navigate('/inicio');}} >Ver otras recetas
                <i class="fas fa-undo"></i>
              </a>

            </div>
            </section>
          </main>
        </div>
      
      </div>
      );
};
    

export default DetalleReceta;