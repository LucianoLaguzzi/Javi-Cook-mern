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
  const [pasos, setPasos] = useState('');
  const [tituloOriginal, setTituloOriginal] = useState(receta.titulo); // Estado para el título original
  const [tituloEditable, setTituloEditable] = useState(false);
  const [ingredientesCantidades, setIngredientesCantidades] = useState('');
  const [ingredientesEditable, setIngredientesEditable] = useState(false);
  const [ingredientesOriginales, setIngredientesOriginales] = useState(ingredientesCantidades); // Estado para los ingredientes originales
  const [pasosEditable, setPasosEditable] = useState(false);
  // Estado para manejar los pasos en edición
  const [pasosEditados, setPasosEditados] = useState(pasos.split('\r\n'));
  //Valoraciones
  const [valoracionUsuario, setValoracionUsuario] = useState(0); // Valor del usuario actual
  const [yaValorado, setYaValorado] = useState(false); // Para verificar si ya valoró
  const [valoracionHover, setValoracionHover] = useState(0); // Valoración temporal para hover
  const [edicionActiva, setEdicionActiva] = useState(false);  // Controla si la edición está activa
  const [loading, setLoading] = useState(false); // Estado para el cartel de carga al eliminar
  const [isLoading, setIsLoading] = useState(true); // Nuevo estado para loading de carga de recetas 


  const [tiempo, setTiempo] = useState(0); // Tiempo en segundos
  const [activo, setActivo] = useState(false); // Estado para iniciar/pausar el temporizador
  const [mostrarControles, setMostrarControles] = useState(false); // Para mostrar/ocultar controles
  const [inputTiempo, setInputTiempo] = useState(""); // Valor fijo del input en minutos
  
  const [tiempoInicial, setTiempoInicial] = useState(0);  // Guardar el tiempo inicial
  const [ultimaActualizacion, setUltimaActualizacion] = useState(Date.now());  // Registrar la última actualización

  const [comentarioAResponder, setComentarioAResponder] = useState(null);
const [respuesta, setRespuesta] = useState('');


  const botonRef = useRef(null);

  

  useEffect(() => {
    // Obtener detalles de la receta desde el backend usando Axios
    const obtenerReceta = async () => {
      try {
        setIsLoading(true); // Activa el loading antes de empezar

        const response = await axios.get(`https://javicook-mern.onrender.com/api/detalles/${id}`);
        setReceta(response.data);

        // Comparar IDs para determinar si es propietario
        if (response.data.usuario._id === usuarioEnSesion._id) {
          console.log("Es propietario de la receta")
          setEsPropietario(true);
        }

        setIngredientesCantidades(response.data.ingredientesCantidades.join('\r\n'));
        setPasos(response.data.pasos.join('\r\n'));



        // Aquí estamos asignando los comentarios correctamente
        const comentariosConRespuestas = response.data.comentarios.map((comentario) => {
          // Asegúrate de que las respuestas se asignen correctamente dentro de cada comentario
          return {
            ...comentario,
            respuestas: comentario.respuestas || [] // Si no tiene respuestas, inicialízalo como un arreglo vacío
          };
        });

        setComentarios(comentariosConRespuestas); // Asigna los comentarios al estado


        // Obtener la valoración del usuario
        const valoracionResponse = await axios.get(`https://javicook-mern.onrender.com/api/valoraciones/${id}/usuario/${usuarioEnSesion._id}`);
        if (valoracionResponse.data.valoracionUsuario) {
          setValoracionUsuario(valoracionResponse.data.valoracionUsuario);
          setYaValorado(true);
        }


      } catch (error) {
        console.error('Error al cargar la receta', error);
       } finally {
        setIsLoading(false); // Desactiva el loading después de completar la carga
      }
    };
    obtenerReceta();
  }, [id]);

  
  // Temporizador
  useEffect(() => {
    let interval;

    if (activo) {
      // Iniciar el temporizador
      interval = setInterval(() => {
        const now = Date.now();
        const elapsedTime = Math.floor((now - ultimaActualizacion) / 1000);  // Calcular el tiempo transcurrido en segundos
        const tiempoRestante = tiempoInicial - elapsedTime;  // Calcular el tiempo restante
  
        if (tiempoRestante <= 0) {
          // Si el tiempo llega a 0, detener el temporizador y actualizar el tiempo a 0
          clearInterval(interval);
          setActivo(false);
          setTiempo(0); // Asegurarse de que el tiempo sea 0

          // Agregar clase de color rojo al finalizar
          if (botonRef.current) botonRef.current.classList.add("fin");

          // Reproducir alarma
          const sonido = new Audio("../sounds/timer-alert.mp3");
          sonido.play();

          Swal.fire({
            title: "¡Tiempo terminado!",
            text: "El temporizador ha llegado a cero.",
            icon: "info",
            confirmButtonText: "Aceptar",
            customClass: { popup: "mi-alerta-temporizador" },
          });
        } else {
          // Actualizar el estado con el tiempo restante
          setTiempo(tiempoRestante);

          // Agregar titileo si quedan 10 segundos o menos
          if (tiempoRestante <= 10) {
            if (botonRef.current) botonRef.current.classList.add("titileo");
          }


        }
      }, 1000);  // Actualizar cada segundo
  
      return () => clearInterval(interval);  // Limpiar el intervalo al desmontar
    }
    // Eliminar clases si no está activo
    if (botonRef.current) botonRef.current.classList.remove("titileo", "fin");

  }, [activo, ultimaActualizacion, tiempoInicial]);
  
  // Métodos del temporizador
  const iniciarTemporizador = () => {
    if (tiempo > 0) {
      setActivo(true);
      setUltimaActualizacion(Date.now());  // Registrar el momento en que se inicia o reanuda el temporizador
    }
  };
  
  const pausarTemporizador = () => {
    setActivo(false);
    // Guardar el tiempo transcurrido al pausar
    const elapsedTime = Math.floor((Date.now() - ultimaActualizacion) / 1000);  // Tiempo transcurrido hasta el momento
    setTiempoInicial(tiempoInicial - elapsedTime); // Actualizar el tiempo inicial con lo que queda
  };
  
  const reiniciarTemporizador = () => {
    setActivo(false);
    setTiempo(0);
    setTiempoInicial(0);  // Reiniciar también el tiempo inicial
    setInputTiempo(""); // Borrar el input
  };
  
  const handleTiempoInput = (e) => {
    const valor = parseInt(e.target.value, 10);
    setInputTiempo(e.target.value);  // Actualizar el valor del input
    setTiempoInicial(isNaN(valor) ? 0 : valor * 60);  // Convertir minutos a segundos
    setTiempo(isNaN(valor) ? 0 : valor * 60);  // Establecer tiempo inicial
  };



 


  // Manejar la edición del título
  const cambiarTitulo = () => {
    setTituloOriginal(receta.titulo); // Guarda el título original
    setTituloEditable(true);
  };


  const cancelarTitulo = () => {
    setReceta({ ...receta, titulo: tituloOriginal }); // Restablece el título al original
    setTituloEditable(false);
  };

  // Función para guardar el nuevo título
  const guardarTitulo = async () => {
      try {
      await axios.put(`https://javicook-mern.onrender.com/api/recetas/${id}/titulo`, { titulo: receta.titulo });
      setTituloEditable(false);
      } catch (error) {
      console.error('Error al guardar el título', error);
      }
  };



  // Manejar la edición de ingredientes
  const cambiarIngredientes = () => {
    setIngredientesOriginales(ingredientesCantidades); // Guarda los ingredientes originales
    setIngredientesEditable(true);
  };

  // Función para cancelar la edición de ingredientes
  const cancelarIngredientes = () => {
    setIngredientesCantidades(ingredientesOriginales); // Restablece a los ingredientes originales
    setIngredientesEditable(false);
  };

    // Guardar ingredientes
    const guardarIngredientes = async () => {
        try {
          await axios.put(`https://javicook-mern.onrender.com/api/recetas/${id}/ingredientesCantidades`, { ingredientesCantidades });
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
        const response = await axios.put(`https://javicook-mern.onrender.com/api/recetas/${id}/pasos`, {
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

    try {
        const response = await axios.post(
            `https://javicook-mern.onrender.com/api/recetas/${id}/comentarios`,
            { comentario: nuevoComentario, usuario: usuarioEnSesion._id }
        );

        // Recupera el comentario con el usuario ya poblado
        const comentarioPoblado = response.data.comentarioGuardado;

        setComentarios((prevComentarios) => [...prevComentarios, comentarioPoblado]);
        setNuevoComentario('');
    } catch (error) {
        console.error('Error al agregar el comentario:', error);
    }
};

  // Función para agregar respuesta
  const agregarRespuesta = async () => {
    if (!respuesta) return;

    try {
        const response = await axios.post(
            `https://javicook-mern.onrender.com/api/recetas/${id}/comentarios`,
            { comentario: respuesta, usuario: usuarioEnSesion._id, parentCommentId: comentarioAResponder }
        );

        const nuevaRespuesta = response.data.comentarioGuardado;

        setComentarios((prevComentarios) =>
            prevComentarios.map((comentario) => {
                if (comentario._id === comentarioAResponder) {
                    return {
                        ...comentario,
                        respuestas: [...(comentario.respuestas || []), nuevaRespuesta],
                    };
                }
                return comentario;
            })
        );

        setRespuesta('');
        setComentarioAResponder(null);
    } catch (error) {
        console.error('Error al agregar la respuesta:', error);
    }
};

  // Función para manejar la respuesta
  const responderComentario = (comentarioId) => {
    setComentarioAResponder(comentarioId); // Establecer el comentario al que se va a responder
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
      await axios.post('https://javicook-mern.onrender.com/api/valoraciones', {
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

      // Activa el estado de loading
      setLoading(true);

      await axios.delete(`https://javicook-mern.onrender.com/api/recetas/${id}`, {
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
    } finally {
      // Desactiva el estado de loading
      setLoading(false);
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
 //const imageUrl = `${window.location.origin}/${receta.imagen?.replace('\\', '/')}`;
 const imageUrl = receta.imagen;

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


              {/* Mostrar un cartel de carga hasta q se traigan los datos */}
              {isLoading && (
                   <div className="loading-container-eliminar">
                    <div className="spinner-eliminar"></div>
                    <p className="loading-message-eliminar">Creando receta...</p>
                  </div>
                )}





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
                          <i className="fas fa-pencil-alt" title='Editar titulo'></i>
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
                                  const partes = ingrediente.split(':');
                                  if (partes.length === 2) {
                                      const ingredienteFormateado = `${partes[0].trim()}: ${partes[1].trim()}`;
                                      return <div key={index}>{ingredienteFormateado}</div>;
                                  }
                                  return <div key={index}>{ingrediente}</div>; 
                              })}
                          </div>
                          {esPropietario && (
                              <a className='btn-editar-ingredientes' onClick={cambiarIngredientes}>
                                  <i className="fas fa-pencil-alt" title='Editar ingredientes'></i>
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
                              <a className='btn-cancelar-ingredientes' onClick={cancelarIngredientes}>
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
                                <i className="fas fa-pencil-alt" title='Editar pasos'></i>
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

                {/* Mostrar un cartel de carga si está eliminando */}
                {loading && (
                   <div className="loading-container-eliminar">
                    <div className="spinner-eliminar"></div>
                    <p className="loading-message-eliminar">Eliminando receta...</p>
                  </div>
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
                      {/* Comentario principal */}
                      <div className="comentario-principal">
                        <div className="imagen-nombre">
                          <img
                            className="imagen-perfil-comentario"
                            src={comentario.usuario.imagenPerfil || "../images/default-imagen-perfil"}
                            alt={comentario.usuario.nombre}
                          />
                          <span className="usuario-comentario">{comentario.usuario.nombre || 'Usuario desconocido'}</span>
                        </div>
                        <span className="comentario-fecha">{new Date(comentario.fecha).toLocaleDateString()}</span>
                        <p className="texto-comentario">{comentario.comentario}</p>
                        <button className="boton-responder" onClick={() => responderComentario(comentario._id)}>Responder</button>
                      </div>

                      {/* Respuestas */}
                      {comentario.respuestas && comentario.respuestas.length > 0 && (
                        <div className="respuestas">
                          {comentario.respuestas.map((respuesta) => (
                            <div key={respuesta._id} className="respuesta-comentario">
                              <div className="imagen-nombre">
                                <img
                                  className="imagen-perfil-comentario"
                                  src={respuesta.usuario.imagenPerfil || "../images/default-imagen-perfil"}
                                  alt={respuesta.usuario.nombre}
                                />
                                <span className="usuario-comentario">{respuesta.usuario.nombre || 'Usuario desconocido'}</span>
                              </div>
                              <span className="comentario-fecha">{new Date(respuesta.fecha).toLocaleDateString()}</span>
                              <p>{respuesta.comentario}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Mostrar input de respuesta si está en modo respuesta */}
                      {comentarioAResponder === comentario._id && (
                        <div className="input-respuesta">
                          <input 
                            type="text" 
                            value={respuesta} 
                            onChange={(e) => setRespuesta(e.target.value)} 
                            placeholder="Escribe tu respuesta..." 
                          />
                          <button onClick={agregarRespuesta}>Enviar</button>
                        </div>
                      )}
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





        <div className={`temporizador ${mostrarControles ? "mostrar" : ""}`}>
          {/* Botón para desplegar/ocultar */}
          <button  ref={botonRef} className="boton-abre-tempo"title='Temporizador'
            onClick={() => setMostrarControles(!mostrarControles)}
            style={{
              marginBottom: mostrarControles ? "10px" : "0",
              padding: mostrarControles ? "5px" : "17px",
            }}
          >
           {mostrarControles ? (
              "Minimizar" // Texto cuando está desplegado
            ) : (
              <img 
                src="../images/cronometro.png" // Ruta de la imagen
                alt="Abrir Temporizador" 
                style={{ width: "25px", height: "25px" }} // Ajusta el tamaño
              />
            )}
          </button>

          {/* Controles visibles solo si mostrarControles es true */}
          {mostrarControles && (
            <div>
              <h4 className="titulo-tempo">Temporizador</h4>
              <p 
                className={`reloj-tempo ${
                  !activo && tiempo > 0 ? "parpadeo" : ""
                }`}
              >
                 <span className={!activo ? "pausa" : ""}>
                  {Math.floor(tiempo / 60)}:
                  {String(tiempo % 60).padStart(2, "0")}
                </span>
              </p>
              <input
                className="input-tempo"
                type="number"
                placeholder="Minutos"
                value={inputTiempo} // Mostrar el valor fijo ingresado
                onChange={handleTiempoInput}
              />
              <div className="contenedor-botones-tempo">
                <button className="iniciar-tempo" onClick={iniciarTemporizador}>
                  <i className="fas fa-play" style={{ color: "#0a7e1e" }}></i>
                </button>
                <button className="pausar-tempo" onClick={pausarTemporizador}>
                  <i className="fas fa-pause" style={{ color: "#fff" }}></i>
                </button>
                <button className="reiniciar-tempo" onClick={reiniciarTemporizador}>
                  <i class="fas fa-undo-alt" style={{ color: "#b50a0a" }}></i>
                </button>
              </div>
            </div>
          )}
        </div>



      
      </div>
      );
};
    

export default DetalleReceta;