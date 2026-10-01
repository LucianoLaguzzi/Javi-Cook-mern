// Inicio.js
import React, { useState, useEffect, useRef } from 'react';
import '../style.css'; // Asegúrate de que la ruta sea correcta
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config/api';


const Inicio = () => {
    // Recupera la información del usuario del localStorage
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    //Estado para ver si esta logueado o pasa de una al home
    const isLogged = Boolean(usuario);




    const navigate = useNavigate(); // Hook para redireccionar
    const location = useLocation();

    // Estado para las recetas
    const [recetas, setRecetas] = useState([]);
    const [loading, setLoading] = useState(true); // Para manejar el estado de carga
    // Estados para el formulario de agregar receta
    const [topRecetas, setTopRecetas] = useState([]);
    const [favoritos, setFavoritos] = useState([]);
    const [recetasFiltradas, setRecetasFiltradas] = useState([]); // Recetas después del filtrado
    const [paginaActual, setPaginaActual] = useState(1); // Página actual
    const [recetasPorPagina, setRecetasPorPagina] = useState(6); // Número de recetas a mostrar por página
    const [menuVisible, setMenuVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Estado de carga al seleccionar aleatoriamente

    const [paginaFavoritos, setPaginaFavoritos] = useState(1); //Paginacion para favoritos


    const inputRef = useRef(null); // Referencia al campo de texto de búsqueda

    const panelRecetasRef = useRef(null);

    const favoritosSectionRef = useRef(null);

    //Calculos para mostrar bien las cantidades de recetas en la paginacion
    const indexOfLastReceta = paginaActual * recetasPorPagina; // Última receta en la página actual
    const indexOfFirstReceta = indexOfLastReceta - recetasPorPagina; // Primera receta en la página actual
    const recetasActuales = recetasFiltradas.slice(indexOfFirstReceta, indexOfLastReceta); // Recetas a mostrar 

    //Calculos para manejar la paginacion bien
    const totalRecetas = recetasFiltradas.length; // Total de recetas filtradas
    const totalPaginas = Math.max(1,Math.ceil(totalRecetas / Math.max(1, recetasPorPagina))); // Asegurar que sea al menos 1 // Calcular el total de páginas


    const recetasFavoritas = recetas.filter(receta =>
        favoritos.includes(receta._id)
    );

    const indexOfLastFavorito =
        paginaFavoritos * recetasPorPagina;

    const indexOfFirstFavorito =
        indexOfLastFavorito - recetasPorPagina;

    const favoritosActuales = recetasFavoritas.slice(
        indexOfFirstFavorito,
        indexOfLastFavorito
    );

    const totalPaginasFavoritos = Math.max(
        1,
        Math.ceil(recetasFavoritas.length / recetasPorPagina)
    );





    const usuarioEnSesion = JSON.parse(localStorage.getItem('usuario'));

 

    //Precargar sonidos:
    const sonidos = {
        item: new Audio("../sounds/item.mp3"),
        item2: new Audio("../sounds/item2.mp3"),
        magic: new Audio("../sounds/click-subitem.mp3"),
        popup: new Audio("../sounds/popup-item.mp3"),
        card: new Audio("../sounds/card.mp3"),
    };

    //Traer las recetas para las tarjetas
    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/recetas`)
        .then(response => {
            setRecetas(response.data);
            setRecetasFiltradas(response.data); // Inicialmente mostrar todas
            setLoading(false);
        })
        .catch(error => {
            console.error("Error al cargar las recetas", error);
            setLoading(false);
        });

        // Cargar el top 3 de recetas
        axios.get(`${API_BASE_URL}/api/recetas/top3`)
        .then(response => {
            setTopRecetas(response.data);
        })
        .catch(error => {
            console.error('Error al obtener el top 3 de recetas:', error);
        });

        // Obtener recetas favoritas del usuario
        // Verificar si hay un usuario en sesión antes de obtener favoritos
        if (usuarioEnSesion) {
            axios.get(`${API_BASE_URL}/api/usuarios/${usuarioEnSesion._id}/favoritos`)
                .then(response => {
                setFavoritos(response.data.map(receta => receta._id));  // Guardar solo IDs
                })
                .catch(error => {
                console.error("Error al cargar recetas favoritas", error);
            });
        }


        // Precargar sonidos
        Object.values(sonidos).forEach((sonido) => sonido.load());

    }, []);



    useEffect(() => {
        const panel = panelRecetasRef.current;

        if (!panel) return;

        const actualizarCantidadPorPagina = () => {
            const estilos = getComputedStyle(panel);

            const columnas = estilos.gridTemplateColumns
                .split(/\s+/)
                .filter(valor => valor && valor !== 'none')
                .length;

            // Nunca permitir una medición inválida.
            if (!Number.isFinite(columnas) || columnas < 1) {
                return;
            }

            const nuevaCantidad =
                columnas === 1
                    ? 6
                    : Math.min(columnas * 2, 12);

            setRecetasPorPagina(prev =>
                prev === nuevaCantidad ? prev : nuevaCantidad
            );
        };

        actualizarCantidadPorPagina();

        const observer = new ResizeObserver(() => {
            actualizarCantidadPorPagina();
        });

        observer.observe(panel);

        return () => observer.disconnect();
    }, [
        loading,
        recetasFiltradas.length,
        paginaActual,
        recetasPorPagina
    ]);


    useEffect(() => {
        setPaginaActual(pagina => {
            if (pagina < 1) {
                return 1;
            }

            if (pagina > totalPaginas) {
                return totalPaginas;
            }

            return pagina;
        });
    }, [totalPaginas]);


    useEffect(() => {
        setPaginaFavoritos(pagina => {
            if (pagina < 1) {
                return 1;
            }

            if (pagina > totalPaginasFavoritos) {
                return totalPaginasFavoritos;
            }

            return pagina;
        });
    }, [totalPaginasFavoritos]);



    // Efecto para mostrar bien la seccion de recetas al cambiar la pagina en paginacion
    useEffect(() => {
        window.scrollTo(0, 0); // Desplazar hacia la parte superior
    }, [paginaActual]);

    


    useEffect(() => {
        const panel = panelRecetasRef.current;

        if (!panel) return;

        const actualizarCantidadPorPagina = () => {
            const columnas = getComputedStyle(panel)
                .gridTemplateColumns
                .split(/\s+/)
                .filter(Boolean)
                .length;

            let nuevaCantidad;

            if (columnas === 1) {
                // En celular mantenemos 6 para no obligar a pasar
                // de página demasiado seguido.
                nuevaCantidad = 6;
            } else {
                // Hasta dos filas por página.
                nuevaCantidad = Math.min(columnas * 2, 12);
            }

            setRecetasPorPagina(prev =>
                prev === nuevaCantidad ? prev : nuevaCantidad
            );
        };

        actualizarCantidadPorPagina();

        const observer = new ResizeObserver(actualizarCantidadPorPagina);
        observer.observe(panel);

        return () => observer.disconnect();
    }, [loading, recetasFiltradas.length]);






    // Manejar el toggle de favoritos
    const toggleFavorito = (recetaId) => {

        const isFavorito = favoritos.includes(recetaId);
    
        if (isFavorito) {
            // Eliminar de favoritos
            axios.delete(`${API_BASE_URL}/api/usuarios/${usuarioEnSesion._id}/favoritos`, { data: { recetaId } })
                .then(response => {
                    setFavoritos(prevFavoritos => prevFavoritos.filter(fav => fav !== recetaId)); // Eliminar de favoritos localmente
                })
                .catch(error => console.error('Error al eliminar de favoritos:', error));
        } else {
            // Agregar a favoritos
            axios.post(`${API_BASE_URL}/api/usuarios/${usuarioEnSesion._id}/favoritos`, { recetaId }) // Hacer POST para agregar a favoritos
                .then(response => {
                    setFavoritos(prevFavoritos => [...prevFavoritos, recetaId]); // Agregar a favoritos localmente
                })
                .catch(error => console.error('Error al agregar a favoritos:', error));
        }
    };


    
    // Función para quitar los acentos (normalizar)
    const quitarTildes = (texto) => {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    // Función para manejar el filtrado por ingredientes y título
    const manejarFiltroIngredientes = (input) => {
        // Normalizamos la entrada de búsqueda para quitar los tildes
        const palabrasClave = quitarTildes(input).toLowerCase().split(/[\s,]+/).filter(Boolean); //Lo que el usuario pone en el input

        if (palabrasClave.length === 0) {
            // Mostrar todas las recetas si no se ingresó ningún ingrediente o título
            setRecetasFiltradas(recetas);
        } else {
            const recetasFiltradas = recetas.filter((receta) => {
                const ingredientesReceta = quitarTildes(receta.ingredientes[0]).toLowerCase().split(', '); //Obtenidos de la "original"
                const tituloReceta = quitarTildes(receta.titulo).toLowerCase(); //Obtenidos de la "original"

                // Boolean que verificar si todos los ingredientes buscados están en los ingredientes de la receta
                const coincidenIngredientes = palabrasClave.every(ingrediente =>
                    ingredientesReceta.some(ingReceta => ingReceta.includes(ingrediente))
                );

                // Boolean que verificar si todos los términos buscados coinciden en el título de la receta
                const coincideTitulo = palabrasClave.every(palabra =>
                    tituloReceta.includes(palabra)
                );

                // Retornar true en el .filter solo si todos los ingredientes y/o el título coinciden, es decir si alguna de las variables dio true.
                return coincideTitulo || coincidenIngredientes;
            });

            setRecetasFiltradas(recetasFiltradas);
        }
    };
    

    const obtenerRecetaAleatoria = async (categoria) => {
        try {
            setIsLoading(true); // Mostrar loading antes de la solicitud

            // Buscar el botón correspondiente utilizando el atributo data-categoria
            const categoriaBoton = document.querySelector(`[data-categoria="${categoria}"]`);
            
            // Añadir la clase para el efecto de destello
            categoriaBoton.classList.add('shine-effect');
           
            const categoriaCodificada = encodeURIComponent(categoria);
            const response = await axios.get(`${API_BASE_URL}/api/recetas/random/${categoriaCodificada}`);

            // Si no hay recetas disponibles
            if (!response.data._id) {
                Swal.fire({
                    title: '¡Ups!',
                    text: 'No hay recetas disponibles en esta categoría.',
                    icon: 'info',
                    confirmButtonText: 'Entendido',
                    customClass: {
                        popup: 'sweet-popup-random',
                        title: 'sweet-title-random',
                        confirmButton: 'sweet-button-random',
                    },
                });
                // Eliminar el efecto después de mostrar el SweetAlert
                categoriaBoton.classList.remove('shine-effect');
                setIsLoading(false); // Ocultar loading si no hay receta
                return;
            }

            // Si hay una receta, redirigir al detalle
            const slug = generarSlug(response.data.titulo);

            navigate(`/detalle-receta/${slug}/${response.data._id}`);

            // Eliminar el efecto después de la redirección
            categoriaBoton.classList.remove('shine-effect');
           
    
        } catch (error) {
            console.error("Error al obtener receta aleatoria:", error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo obtener una receta aleatoria. Intenta nuevamente.',
                icon: 'error',
                confirmButtonText: 'Entendido',
                customClass: {
                    popup: 'sweet-popup-random',
                    title: 'sweet-title-random',
                    confirmButton: 'sweet-button-random',
                },
            });
        } finally {
            setIsLoading(false); // Ocultar loading en cualquier caso
        }
    };

     // Función para reproducir un sonido específico
    const reproducirSonido = (key) => {
        const sonido = sonidos[key];
        if (sonido) {
            sonido.currentTime = 0; // Reinicia el sonido si ya está reproduciéndose
            sonido.play();
        }
    };

    const capitalizarPrimeraLetra = (texto) => {
        if (!texto) return ''; // Maneja el caso de texto vacío
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    };


    //Evento para controlar el boton de nueva receta en el bottom:
    // Función para ajustar la posición del botón
    const ajustarPosicionBoton = () => {
        const btnAgregarReceta = document.getElementById('btnAbrirModalAgregarReceta');
        const footer = document.getElementById('footer');
        const distanciaDesdeElFooter = 5; // Distancia desde la parte superior del footer
    
        // Verificar si el botón y el footer existen
        if (btnAgregarReceta && footer) {
            const footerRect = footer.getBoundingClientRect();
    
            if (footerRect.top < window.innerHeight) {
                // Si el footer está en la vista
                btnAgregarReceta.style.bottom = `${footerRect.height + distanciaDesdeElFooter}px`;
            } else {
                // Si el footer no está en la vista
                btnAgregarReceta.style.bottom = '20px'; // posición original
            }
        }
    };
    
    // Añadir un evento de scroll
    useEffect(() => {
        window.addEventListener('scroll', ajustarPosicionBoton);
        return () => {
            window.removeEventListener('scroll', ajustarPosicionBoton);
        };
    }, []);
    


    //BUSQUEDA DEL FILTRO POR VOZ
    let reconocimientoVoz;
    let reconocedorActivo = false;

    const iniciarReconocimiento = () => {

        //Verificar si es para un dispositivo iPhone, que usa safari - Quitar
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        // Verificar si la API de reconocimiento de voz está disponible
        const Recognition = window.webkitSpeechRecognition || window.SpeechRecognition;

        //Esta disponible para iPhone? - Quitar
        if (!Recognition || isSafari) {
            alert("El reconocimiento de voz no es compatible con este navegador. Por favor, prueba con Chrome.");
            return;
        }

        //Aca ya verifica si hay problemas en el resto de dispositivos
        if (!Recognition) {
            alert("La API de reconocimiento de voz no es compatible con este navegador.");
            return;
        }

        reconocimientoVoz = new Recognition();
        reconocimientoVoz.lang = "es-AR";
        reconocimientoVoz.continuous = false;  // Cambiar a `false` para que se detenga automáticamente al final de cada frase
        reconocimientoVoz.interimResults = true;

        reconocimientoVoz.onstart = () => {
            reconocedorActivo = true;
            console.log("Reconocimiento de voz iniciado...");
        };

        reconocimientoVoz.onerror = (event) => {
            console.error("Error de reconocimiento de voz:", event.error);
            alert("Hubo un error con el reconocimiento de voz.");
            reconocedorActivo = false;
        };

        reconocimientoVoz.onend = () => {
            reconocedorActivo = false;
            console.log("Reconocimiento de voz finalizado.");
            // Opcional: Reiniciar automáticamente en el celular o dispositivo que funcione mejor con reconocimiento continuo
            // reconocimientoVoz.start();
        };

        reconocimientoVoz.onresult = (event) => {
            let transcripcionFinal = "";
            let transcripcionIntermedia = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    transcripcionFinal += event.results[i][0].transcript;
                } else {
                    transcripcionIntermedia += event.results[i][0].transcript;
                }
            }

            inputRef.current.value = transcripcionFinal || transcripcionIntermedia;   //Lo transcribe en el input
            manejarFiltroIngredientes(transcripcionFinal || transcripcionIntermedia); //Funcion para mostrar las tarjetas acordes
        };

        reconocimientoVoz.start();
    };

    // Función para activar y desactivar el reconocimiento de voz
    const toggleReconocimiento = () => {
        if (reconocedorActivo) {
            reconocimientoVoz.stop();  // Detener el reconocimiento si está activo
            console.log("Reconocimiento de voz detenido.");
        } else {
            iniciarReconocimiento();   // Iniciar el reconocimiento si está inactivo
        }
    };

    


    const handleLogoClick = () => {
        if (location.pathname !== "/inicio") {
            navigate("/inicio");
        }

        // Siempre vuelve arriba
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    const cambiarPaginaFavoritos = (nuevaPagina) => {
        setPaginaFavoritos(nuevaPagina);

        setTimeout(() => {
            if (!favoritosSectionRef.current) return;

            const posicion =
                favoritosSectionRef.current.getBoundingClientRect().top +
                window.scrollY -
                110;

            window.scrollTo({
                top: posicion,
                behavior: 'smooth'
            });
        }, 50);
    };


    

    const generarSlug = (texto) =>
        texto.toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');


    
    return (
        <div>
            <Helmet>
                <title>JaviCook - Recetas</title>
                <link rel="icon" href="/favicon.png" />
            </Helmet>

            <div className="body-main">
                <div className="main-content">






 {/* CAMBIOS VAN A COMENZAR ACA*/}   
                    <div className="encabezado">
                        <div className="barra-navegacion">

                            <div className="nav-left">
                                <img
                                    src="../images/JaviCook_logo.png"
                                    alt="Logotipo"
                                    className="logo-principal"
                                    onClick={handleLogoClick}
                                />

                                {isLogged && (
                                    <div className="usuario-nav">
                                        <span className="bienvenido-text">
                                            Bienvenido,
                                        </span>

                                        <button
                                            className="link-al-perfil"
                                            title="Ir al perfil"
                                            onClick={() => navigate(`/perfil/${usuarioEnSesion._id}`)}
                                        >
                                            {usuario.nombre}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="nav-center">
                                <span className="subtitulo">
                                    Inspírate con recetas exclusivas
                                </span>
                            </div>

                            <div className="nav-right">
                                {isLogged ? (
                                    <button
                                        className="logout-button"
                                        title="Cerrar sesión"
                                        onClick={() => {
                                            localStorage.removeItem('usuario');
                                            navigate('/login');
                                        }}
                                    >
                                        <img
                                            src="/images/cubiertos-cruzados.png"
                                            className="img-cerrar-sesion"
                                            alt="Cerrar sesión"
                                        />
                                    </button>
                                ) : (
                                    <div className="auth-links">
                                        <button
                                            className="auth-link"
                                            onClick={() => navigate('/login')}
                                        >
                                            Iniciar sesión
                                        </button>

                                        <button
                                            className="auth-link"
                                            onClick={() => navigate('/registro')}
                                        >
                                            Registrarse
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>


                    <div className="barra-secundaria">
                        <a href="#recetas" className="link-secundario"  onMouseEnter={() => reproducirSonido("item")}  onMouseUp={() => reproducirSonido("popup")}>Recetas</a>
                        <a href="#top3" className="link-secundario"   onMouseEnter={() => reproducirSonido("item")} onMouseUp={() => reproducirSonido("popup")}>Top 3</a>
                        <a href="#favoritos" className="link-secundario" onMouseEnter={() => reproducirSonido("item")}  onMouseUp={() => reproducirSonido("popup")}>Favoritos</a>
                        <div 
                            className="dropdown"
                            onMouseEnter={() => setMenuVisible(true)}
                            onMouseLeave={() => setMenuVisible(false)}
                        >
                            <a href="#" className="link-secundario" onMouseEnter={() => reproducirSonido("item")}>Aleatorio</a>
                            {menuVisible && (
                                <div className="dropdown-menu">
                                    <button  className="shine-effect" data-categoria="Desayuno/Merienda" onClick={() => obtenerRecetaAleatoria("Desayuno/Merienda")} onMouseEnter={() => reproducirSonido("item2")} onMouseUp={() => reproducirSonido("magic")}>Desayuno/Merienda</button>
                                    <button  className="shine-effect" data-categoria="Almuerzo/Cena" onClick={() => obtenerRecetaAleatoria("Almuerzo/Cena")}onMouseEnter={() => reproducirSonido("item2")} onMouseUp={() => reproducirSonido("magic")}>Almuerzo/Cena</button>
                                    <button  className="shine-effect" data-categoria="Brunch" onClick={() => obtenerRecetaAleatoria("Brunch")} onMouseEnter={() => reproducirSonido("item2")} onMouseUp={() => reproducirSonido("magic")}>Brunch</button>
                                    <button  className="shine-effect" data-categoria="Bebida/Trago" onClick={() => obtenerRecetaAleatoria("Bebida/Trago")} onMouseEnter={() => reproducirSonido("item2")} onMouseUp={() => reproducirSonido("magic")}>Bebida/Trago</button>
                                    <button  className="shine-effect" data-categoria="Veggie" onClick={() => obtenerRecetaAleatoria("Veggie")} onMouseEnter={() => reproducirSonido("item2")} onMouseUp={() => reproducirSonido("magic")}>Veggie</button>
                                    <button  className="shine-effect" data-categoria="Guarnición" onClick={() => obtenerRecetaAleatoria("Guarnición")} onMouseEnter={() => reproducirSonido("item2")} onMouseUp={() => reproducirSonido("magic")}>Guarnición</button>
                                    <button  className="shine-effect" data-categoria="Postre"onClick={() => obtenerRecetaAleatoria("Postre")}onMouseEnter={() => reproducirSonido("item2")} onMouseUp={() => reproducirSonido("magic")}>Postre</button>
                                    
                                </div>
                            )}
                        </div>
                    </div>



  {/* CAMBIOS TERMINAN ACA*/}











                    <main className="principal">

                        {/* Mostrar un cartel de carga hasta q se traigan los datos o vuelva de inactividad */}
                        {isLoading && (
                            <div className="loading-container-eliminar">
                                <div className="spinner-eliminar"></div>
                                <p className="loading-message-eliminar">Obteniendo receta aleatoria...</p>
                            </div>
                        )}


                        {/* Sección de filtro */}
                        <section className="filtro">
                            <h2>Buscá tus recetas por ingredientes</h2>
                            <div className="filtro-ing">
                                <input 
                                    type="text" 
                                    className="text-filtro" 
                                    placeholder="Buscar por ingrediente/s o nombre ..." 
                                    onChange={(e) => manejarFiltroIngredientes(e.target.value)} // Filtrado en tiempo real
                                    ref={inputRef}
                                />
                                
                                <button onClick={toggleReconocimiento} className="microfono">
                                    <i className="fas fa-microphone"></i>
                                </button>
                            </div>
                        </section>

                        {/* Sección de recetas disponibles */}
                        <section id='recetas' className="recetas">
                            <div className="titulo-section-recetas">
                                <h2 className="titulo-seccion">Recetas disponibles</h2>
                            </div>

                            {loading ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p className='cargando-recetas'>Cargando recetas...</p>
                                </div>
                            ) : (
                                recetas.length === 0 ? ( // Si no hay recetas en absoluto
                                    <span className='mensaje-no-recetas'>Aún no tienes recetas. ¡Empieza agregando una!</span>
                                ) : (
                                    recetasActuales.length > 0 ? ( // Si hay recetas, y recetasActuales tiene coincidencias
                                        <div className="panel-recetas panel-recetas-inicio"
                                            ref={panelRecetasRef}
                                        >
                                            {recetasActuales.map((receta) => (
                                                <div key={receta.id} className="tarjeta-receta tarjeta-inicio" onMouseEnter={() => reproducirSonido("card")} >
                                                    <div className="imagen-contenedor-chica">
                                                        <img src={receta.imagen} alt={receta.titulo} />
                                                        <div className="info-imagen">
                                                            <span className="nombre-usuario">{receta.usuario.nombre}</span>  
                                                            <span className="fecha-subida">{new Date(receta.fecha).toLocaleDateString('es-AR')}</span>
                                                        </div>

                                                        {isLogged && (
                                                            <i className={`fas fa-heart icono-favorito ${favoritos.includes(receta._id) ? 'favorito' : ''}`}
                                                                title={favoritos.includes(receta._id) ? 'Quitar de favoritos' : 'Guardar como favorito'}
                                                                onClick={() => toggleFavorito(receta._id)}
                                                            ></i>
                                                        )}

                                                    </div>
                                                    <h2>{capitalizarPrimeraLetra(receta.titulo)}</h2>
                                                    <p>Categoría: {receta.categoria}</p>


                                                    <div className="meta-receta">


                                                       <span className="dato-tiempo">
                                                            <i className="far fa-clock"></i>

                                                            <span className="texto-tiempo">
                                                                <small>Tiempo</small>
                                                                <strong>{receta.tiempoPreparacion} min</strong>
                                                            </span>
                                                        </span>



                                                        <span className={`dificultad-${receta.dificultad.toLowerCase()}`}>
                                                            {receta.dificultad}
                                                        </span>
                                                    </div>




                                                    
                                                    <div className="valoracion">
                                                        <div className="estrellas">
                                                            {[...Array(5)].map((_, i) => (
                                                                <i
                                                                    key={i}
                                                                    className={`fa${i < Math.round(receta.valoracion) ? 's' : 'r'} fa-star`}
                                                                ></i>
                                                            ))}
                                                        </div>
                                                    </div>


                                                    <a
                                                        className="ver-mas"
                                                        onClick={() =>
                                                            navigate(`/detalle-receta/${generarSlug(receta.titulo)}/${receta._id}`)
                                                        }
                                                        >
                                                        Ver más
                                                    </a>

                                                </div>
                                            ))}
                                        </div>
                                    ) : ( // Si hay recetas, pero recetasActuales está vacío (filtro sin coincidencias)
                                        <span className='mensaje-no-recetas'>No se encontraron recetas con esos ingredientes.</span>
                                    )
                                )
                            )}

                            {/* Controles de Paginación */}
                            {totalPaginas > 1 && (
                                <div className="paginacion">
                                    <button 
                                        onClick={() => setPaginaActual(paginaActual > 1 ? paginaActual - 1 : 1)}
                                        disabled={paginaActual === 1}
                                    >
                                        Anterior
                                    </button>
                                    <span className='texto-paginacion'>Página {paginaActual} de {totalPaginas}</span>
                                    <button 
                                        onClick={() => setPaginaActual(paginaActual < totalPaginas ? paginaActual + 1 : totalPaginas)}
                                        disabled={paginaActual === totalPaginas}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}


                            {/* Botón para agregar una nueva receta si se esta logueado*/}
                            {isLogged && (
                                <div className="div-agregar-receta">
                                   <button
                                        id="btnAbrirModalAgregarReceta"
                                        className="add-recipe-btn"
                                        onClick={() => navigate("/crear-receta")}
                                        >
                                        <i className="fas fa-plus"></i> Nueva receta
                                    </button>
                                </div>
                            )}

                        </section>


                        {/* Sección de Top 3 Recetas */}
                        <section id='top3' className="top3">
                            <p className="titulo-seccion">Top 3 Recetas</p>


                            {topRecetas.length > 0 ? (
                                <div className="panel-recetas panel-recetas-inicio">
                                    {topRecetas.map((receta) => (
                                        <div
                                            key={receta.id}
                                            className="tarjeta-receta tarjeta-inicio"
                                            onMouseEnter={() => reproducirSonido("card")}
                                        >
                                            <div className="imagen-contenedor-chica">
                                                <img src={receta.imagen} alt={receta.titulo} />

                                                <div className="info-imagen">
                                                    <span className="nombre-usuario">
                                                        {receta.usuario.nombre}
                                                    </span>

                                                    <span className="fecha-subida">
                                                        {new Date(receta.fecha).toLocaleDateString('es-AR')}
                                                    </span>
                                                </div>
                                            </div>

                                            <h2>{capitalizarPrimeraLetra(receta.titulo)}</h2>

                                            <p>Categoría: {receta.categoria}</p>

                                            <div className="meta-receta">
                                                <span className="dato-tiempo">
                                                    <i className="far fa-clock"></i>

                                                    <span className="texto-tiempo">
                                                        <small>Tiempo</small>
                                                        <strong>{receta.tiempoPreparacion} min</strong>
                                                    </span>
                                                </span>

                                                <span className={`dificultad-${receta.dificultad.toLowerCase()}`}>
                                                    {receta.dificultad}
                                                </span>
                                            </div>

                                            <div className="valoracion">
                                                <div className="estrellas">
                                                    {[...Array(5)].map((_, i) => (
                                                        <i
                                                            key={i}
                                                            className={`fa${i < Math.round(receta.valoracion) ? 's' : 'r'} fa-star`}
                                                        ></i>
                                                    ))}
                                                </div>
                                            </div>

                                            <a
                                                className="ver-mas"
                                                onClick={() =>
                                                    navigate(
                                                        `/detalle-receta/${generarSlug(receta.titulo)}/${receta._id}`
                                                    )
                                                }
                                            >
                                                Ver más
                                            </a>
                                        </div>
                                    ))}
                                    
                                </div>
                            ) : (
                                <div className="top3-vacio">
                                    <div className="top3-vacio-icono">
                                        <i className="fas fa-trophy"></i>
                                    </div>

                                    <h3>Todavía no hay un Top 3</h3>

                                    <p>
                                        A medida que las recetas reciban valoraciones,
                                        acá aparecerán las mejor puntuadas.
                                    </p>
                                </div>
                            )}
                        </section>



                        {isLogged && (            
                            <section id="favoritos" className="favoritos" ref={favoritosSectionRef}>
                                <p className="titulo-seccion">Mis Recetas Favoritas</p>
                                {favoritos.length === 0 ? (
                                    <div className="favoritos-vacio">
                                        <div className="favoritos-vacio-icono">
                                            <i className="fas fa-heart"></i>
                                        </div>

                                        <h3>Todavía no tenés recetas favoritas</h3>

                                        <p>
                                            Las recetas que guardes con el corazón aparecerán acá
                                            para que puedas encontrarlas fácilmente.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="panel-recetas panel-recetas-inicio">
                                        {favoritosActuales.map(receta => (
                                            <div key={receta._id} className="tarjeta-receta tarjeta-inicio" onMouseEnter={() => reproducirSonido("card")}>
                                                <div className="imagen-contenedor-chica">
                                                    <img src={receta.imagen} alt={receta.titulo} />

                                                    <div className="info-imagen">
                                                        <span className="nombre-usuario">
                                                            {receta.usuario.nombre}
                                                        </span>

                                                        <span className="fecha-subida">
                                                            {new Date(receta.fecha).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <h2>{capitalizarPrimeraLetra(receta.titulo)}</h2>

                                                <p>Categoría: {receta.categoria}</p>

                                                <div className="meta-receta">
                                                    <span className="dato-tiempo">
                                                        <i className="far fa-clock"></i>

                                                        <span className="texto-tiempo">
                                                            <small>Tiempo</small>
                                                            <strong>{receta.tiempoPreparacion} min</strong>
                                                        </span>
                                                    </span>

                                                    <span className={`dificultad-${receta.dificultad.toLowerCase()}`}>
                                                        {receta.dificultad}
                                                    </span>
                                                </div>

                                                <div className="valoracion">
                                                    <div className="estrellas">
                                                        {[...Array(5)].map((_, i) => (
                                                            <i
                                                                key={i}
                                                                className={`fa${i < Math.round(receta.valoracion) ? 's' : 'r'} fa-star`}
                                                            ></i>
                                                        ))}
                                                    </div>
                                                </div>

                                                <a
                                                    className="ver-mas"
                                                    onClick={() =>
                                                        navigate(
                                                            `/detalle-receta/${generarSlug(receta.titulo)}/${receta._id}`
                                                        )
                                                    }
                                                >
                                                    Ver más
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}


                                {totalPaginasFavoritos > 1 && (
                                    <div className="paginacion paginacion-favoritos">

                                        <button
                                            onClick={() =>
                                                cambiarPaginaFavoritos(
                                                    paginaFavoritos > 1
                                                        ? paginaFavoritos - 1
                                                        : 1
                                                )
                                            }
                                            disabled={paginaFavoritos === 1}
                                        >
                                            Anterior
                                        </button>

                                        <span className="texto-paginacion">
                                            Página {paginaFavoritos} de {totalPaginasFavoritos}
                                        </span>

                                        <button
                                            onClick={() =>
                                                cambiarPaginaFavoritos(
                                                    paginaFavoritos < totalPaginasFavoritos
                                                        ? paginaFavoritos + 1
                                                        : totalPaginasFavoritos
                                                )
                                            }
                                            disabled={
                                                paginaFavoritos === totalPaginasFavoritos
                                            }
                                        >
                                            Siguiente
                                        </button>

                                    </div>
                                )}
                            </section>
                        )}

                        <footer id='footer' className="footer">
                            © Sitio desarrollado por Javito | Todos los derechos reservados
                        </footer>

                    </main>
                </div>
            </div>
        </div>

    );
};

export default Inicio;