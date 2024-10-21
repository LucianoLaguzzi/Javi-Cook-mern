// Inicio.js
import React, { useState, useEffect } from 'react';
import '../style.css'; // Asegúrate de que la ruta sea correcta
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet';

const Inicio = () => {
    // Recupera la información del usuario del localStorage
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const navigate = useNavigate(); // Hook para redireccionar

    // Estado para las recetas
    const [recetas, setRecetas] = useState([]);
    const [loading, setLoading] = useState(true); // Para manejar el estado de carga
    const [modalVisible, setModalVisible] = useState(false); // Estado para controlar el modal

    // Estados para el formulario de agregar receta
    const [titulo, setTitulo] = useState('');
    const [cantidadIngrediente, setCantidadIngrediente] = useState('');
    const [pasos, setPasos] = useState(['']);
    const [imagen, setImagen] = useState(null);
    const [dificultad, setDificultad] = useState('');
    const [categoria, setCategoria] = useState('');
    const [tiempoPreparacion, setTiempoPreparacion] = useState('');
    const [ingredientes, setIngredientes] = useState('');
    const [topRecetas, setTopRecetas] = useState([]);
    const [favoritos, setFavoritos] = useState([]);

    //Para el filtro:
    const [recetasFiltradas, setRecetasFiltradas] = useState([]); // Recetas después del filtrado

    const usuarioEnSesion = JSON.parse(localStorage.getItem('usuario'));

    // Llenar con placeholders si hay menos de 3 recetas
    const tarjetasFaltantes = 3 - topRecetas.length;

    //Traer las recetas para las tarjetas
    useEffect(() => {
        axios.get('/api/recetas')
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
        axios.get('/api/recetas/top3')
        .then(response => {
            setTopRecetas(response.data);
        })
        .catch(error => {
            console.error('Error al obtener el top 3 de recetas:', error);
        });

        // Obtener recetas favoritas del usuario
        // Verificar si hay un usuario en sesión antes de obtener favoritos
        if (usuarioEnSesion) {
            axios.get(`/api/usuarios/${usuarioEnSesion._id}/favoritos`)
                .then(response => {
                    setFavoritos(response.data.map(receta => receta._id));  // Guardar solo IDs
                })
                .catch(error => {
                    console.error("Error al cargar recetas favoritas", error);
                });
        }
    }, []);

    // Función para abrir el modal
    const abrirModal = () => {
        setModalVisible(true);
    };

    // Función para cerrar el modal
    const cerrarModal = () => {
        setModalVisible(false);
        // Reseteamos el formulario al cerrar
        resetFormulario();
    };

    // Función para resetear el formulario
    const resetFormulario = () => {
        setTitulo('');
        setCantidadIngrediente('');
        setPasos(['']);
        setImagen(null);
        setDificultad('');
        setCategoria('');
        setTiempoPreparacion('');
        setIngredientes('');
    };

    // Función para manejar el cambio en el textarea de ingredientes y cantidades
    const actualizarIngredientesCantidades = (e) => {
        const value = e.target.value;
        setCantidadIngrediente(value); // Actualiza el estado

        // Actualiza el input oculto
        const hiddenInput = document.querySelector(".inputOcultoIngredientesCantidades");
        hiddenInput.value = value;  // Guardamos el valor del textarea en el input oculto

        // Verifica el valor
        console.log("Valor de ingredientes y cantidades:", value);
    };
    

    // Función para manejar el cambio en cada textarea
    const hiddenInput = document.getElementById("inputOculto");

    const handlePasoChange = (index, value) => {
        const nuevosPasos = [...pasos];
        nuevosPasos[index] = value;
        setPasos(nuevosPasos);

        // Actualizamos el input oculto con todos los pasos
        document.getElementById("inputOculto").value = nuevosPasos.join("\r\n");
    };

    // Función para agregar un nuevo paso
    const agregarPaso = (e) => {
        e.preventDefault();
        setPasos([...pasos, '']); // Agregamos un nuevo campo de paso vacío
        aplicarAutoResize();
    };

    // Función para quitar el último paso
    const quitarPaso = (e) => {
        e.preventDefault();
        if (pasos.length > 1) {
            const nuevosPasos = pasos.slice(0, -1); // Quitamos el último paso
            setPasos(nuevosPasos);
            
            // Actualizamos el input oculto con los nuevos pasos
            document.getElementById("inputOculto").value = nuevosPasos.join("\r\n");
        }
    };

    const previewImage = (event) => {
        const preview = document.getElementById('previewImagen');
        const file = event.target.files[0];
    
        if (file) {
            const reader = new FileReader();
            reader.onload = function() {
                preview.src = reader.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);

            // Actualiza el estado de la imagen con el archivo seleccionado
            setImagen(file);

        } else {
            preview.src = '#';  // Reiniciamos la preview si no hay archivo
            setImagen(null); // Si no hay archivo, asegúrate de limpiar el estado
        }
    };

    const quitarMinuto = (e) => {
        e.preventDefault();
        const tiempoPreparacion = document.getElementById("tiempoPreparacion");
        let tiempo = parseInt(tiempoPreparacion.value, 10);
    
        if (tiempo > 0) {
            tiempoPreparacion.value = tiempo - 1;
        }
    };

    const agregarMinuto = (e) => {
        e.preventDefault();
        const tiempoPreparacion = document.getElementById("tiempoPreparacion");
        let tiempo = parseInt(tiempoPreparacion.value, 10) || 0;
        tiempoPreparacion.value = tiempo + 1;
    };

    const autoResize = (e) => {
        const textarea = e.target;
        textarea.style.height = '0'; // Reinicia la altura para calcularla de nuevo
        textarea.style.height = textarea.scrollHeight + 'px'; // Ajusta la altura al scrollHeight
    };

    // Función para aplicar autoResize a todos los textareas
    const aplicarAutoResize = () => {
        const textAreas = document.querySelectorAll(".text-area-pasos");

        textAreas.forEach(textarea => {
            textarea.style.height = '0';
            textarea.style.height = textarea.scrollHeight + 'px';
            textarea.addEventListener('input', autoResize);
        });
    };

    // Llamamos a aplicarAutoResize al cargar la página para los textareas ya existentes
    useEffect(() => {
        aplicarAutoResize();
    }, []);


    // Manejar el toggle de favoritos
    const toggleFavorito = (recetaId) => {
        const isFavorito = favoritos.includes(recetaId);
    
        if (isFavorito) {
            // Eliminar de favoritos
            axios.delete(`/api/usuarios/${usuarioEnSesion._id}/favoritos`, { data: { recetaId } })
                .then(response => {
                    setFavoritos(prevFavoritos => prevFavoritos.filter(fav => fav !== recetaId)); // Eliminar de favoritos localmente
                })
                .catch(error => console.error('Error al eliminar de favoritos:', error));
        } else {
            // Agregar a favoritos
            axios.post(`/api/usuarios/${usuarioEnSesion._id}/favoritos`, { recetaId }) // Hacer POST para agregar a favoritos
                .then(response => {
                    setFavoritos(prevFavoritos => [...prevFavoritos, recetaId]); // Agregar a favoritos localmente
                })
                .catch(error => console.error('Error al agregar a favoritos:', error));
        }
    };


    
    // Función para manejar el filtrado por ingredientes
    const manejarFiltroIngredientes = (input) => {
        const ingredientesBuscados = input.toLowerCase().split(/[\s,]+/).filter(Boolean); // Dividir por espacios o comas, ignorando entradas vacías
        if (ingredientesBuscados.length === 0) {
            // Mostrar todas las recetas si no se ingresó ningún ingrediente
            setRecetasFiltradas(recetas);
        } else {
            // Filtrar las recetas que contienen todos los ingredientes buscados
            const recetasFiltradasPorIngrediente = recetas.filter((receta) => {
                const ingredientesReceta = receta.ingredientes[0].toLowerCase().split(', ');
                // Verificar si todos los ingredientes buscados están en los ingredientes de la receta
                return ingredientesBuscados.every(ingrediente => 
                    ingredientesReceta.some(ingReceta => ingReceta.includes(ingrediente))
                );
            });
    
            setRecetasFiltradas(recetasFiltradasPorIngrediente);
        }
    };
    
    
    


    //                                                  Aca ya van los metodos de la vista:

    //Envio del formulario para dar de alta receta
    const handleSubmit = (e) => {
        e.preventDefault();
        const nuevaReceta = {
            titulo,
            cantidadIngrediente,
            pasos: hiddenInput.value,
            dificultad,
            categoria,
            tiempoPreparacion,
            ingredientes,
            usuario: usuario._id,
        };
    
        const formData = new FormData();
        for (const key in nuevaReceta) {
            formData.append(key, nuevaReceta[key]);
        }
    
        // Asegúrate de que el archivo imagen se adjunta correctamente
        if (imagen) {
            formData.append('imagen', imagen); // Aquí el nombre 'imagen' debe coincidir con lo que multer espera
        }

        // Asegúrate de que ingredientesCantidades tenga el valor correcto
        const hiddenInputIngredientes = document.querySelector(".inputOcultoIngredientesCantidades");
        formData.append('ingredientesCantidades', hiddenInputIngredientes.value); // Asegúrate de que este valor se envíe correctamente
    
        // Enviar la receta al servidor
        axios.post('/api/recetas', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        .then(response => {
            setRecetas(prevRecetas => [...prevRecetas, response.data]);
            cerrarModal();
            resetFormulario();
        })
        .catch(error => {
            console.error("Error al guardar la receta", error.response ? error.response.data : error);
            alert("Hubo un error al guardar la receta. Por favor, intenta de nuevo.");
        });
    };



    const capitalizarPrimeraLetra = (texto) => {
        if (!texto) return ''; // Maneja el caso de texto vacío
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    };
    

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


    // Función para generar tarjetas vacías si faltan recetas
    const generarTarjetasPlaceholder = (num) => {
    const placeholders = [];
    for (let i = 0; i < num; i++) {
        placeholders.push(
            <div key={`placeholder-${i}`} className="tarjeta-receta">
                <div className="imagen-contenedor">
                    <img src="images/default-image.jpg" alt="Receta no valorada" />
                </div>
                <h2>Sin título</h2>
                <p className="default-text">
                No hay suficientes recetas valoradas para formar un Top 3 en este momento. 
                Tu opinión ayuda a otros usuarios a encontrar recetas de calidad, aprovecha y valora las recetas que hayas probado para ser parte de nuestra comunidad y mejorar la experiencia de todos! 
                </p>
            </div>
        );
    }
    return placeholders;
    };
    

    

    
    return (
        <div>
            <Helmet>
                <title>JaviCook - Recetas</title>
                <link rel="icon" href="/favicon.png" />
            </Helmet>

            <div className="body-main">
                <div className="main-content">
                    <div className="encabezado">
                        <div className="barra-navegacion">
                            <img src="../images/JaviCook_logo.png" alt="Logotipo" className="logo-principal" />
                            {usuario && (
                                <>
                                    <span className="bienvenido-text">Bienvenido, </span>
                                    <button className="link-al-perfil" title="Ir al perfil" onClick={() => navigate(`/perfil/${usuarioEnSesion._id}`)}>
                                        {usuario.nombre} !
                                    </button>
                                </>
                            )}
                            <span className="subtitulo"> Inspírate con recetas exclusivas </span>
                            <img 
                                src="/images/cubiertos-cruzados.png" 
                                className="img-cerrar-sesion" 
                                title="Cerrar Sesión" 
                                onClick={() => {
                                    localStorage.removeItem('usuario');
                                    console.log('Cerrar sesión');
                                    navigate('/login');
                                }} 
                                alt="Cerrar sesión"
                            />
                        </div>
                    </div>

                    <main className="principal">
                 
                       {/* Sección de filtro */}
                        <section className="filtro">
                            <h2>Buscá tus recetas por ingredientes</h2>
                            <div className="filtro-ing">
                                <input 
                                    type="text" 
                                    className="text-filtro" 
                                    placeholder="Buscar por ingrediente/s ..." 
                                    onChange={(e) => manejarFiltroIngredientes(e.target.value)} // Filtrado en tiempo real
                                />
                            </div>
                        </section>

                        {/* Sección de recetas disponibles */}
                        <section className="recetas">
                            <div className="titulo-section-recetas">
                                <h2>Recetas disponibles</h2>
                            </div>

                            {loading ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p className='cargando-recetas'>Cargando recetas...</p>
                                </div>
                            ) : (
                                recetasFiltradas.length > 0 ? (
                                    <div className="panel-recetas">
                                        {recetasFiltradas.map((receta) => (
                                            <div key={receta.id} className="tarjeta-receta">
                                                <div className="imagen-contenedor">
                                                    <img src={receta.imagen} alt={receta.titulo} />
                                                    <div className="info-imagen">
                                                        <span className="nombre-usuario">{receta.usuario.nombre}</span>  
                                                        <span className="fecha-subida">{new Date(receta.fecha).toLocaleDateString('es-AR')}</span>
                                                    </div>
                                                    <i className={`fas fa-heart icono-favorito ${favoritos.includes(receta._id) ? 'favorito' : ''}`}
                                                        title={favoritos.includes(receta._id) ? 'Quitar de favoritos' : 'Guardar como favorito'}
                                                        onClick={() => toggleFavorito(receta._id)}
                                                    ></i> {/* Implementar el toogle */}
                                                </div>
                                                <h2>{capitalizarPrimeraLetra(receta.titulo)}</h2>
                                                <p>Categoría: {receta.categoria}</p>
                                                <p>
                                                    <span className="tiempo">Tiempo de preparación: {receta.tiempoPreparacion}'</span>
                                                    <i className="far fa-clock"></i> 
                                                    <span className={`dificultad-${receta.dificultad.toLowerCase()}`}>{receta.dificultad}</span>
                                                </p>
                                                <div className="valoracion">
                                                    <p>Valoración Promedio</p>
                                                    <div className="estrellas">
                                                        {[...Array(5)].map((_, i) => (
                                                            <i key={i} className={`fa${i < Math.round(receta.valoracion) ? 's' : 'r'} fa-star`}></i>
                                                        ))}
                                                    </div>
                                                </div>
                                                <a className="ver-mas" onClick={() => navigate(`/detalle-receta/${receta._id}`)}>
                                                    Ver más
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className='mensaje-no-recetas'>No se encontraron recetas con esos ingredientes.</span>
                                )
                            )}



                            {/* BOTON PARA VER MAS RECETAS
                            
                            {recetas.length > 0 && (
                                <div className="ver-mas-recetas">
                                    <button onClick={() => console.log('Cargar más recetas')}>Ver más recetas...</button>
                                </div>
                            )}
                            */}


                            {/* Botón para agregar una nueva receta */}
                            <div className="div-agregar-receta">
                                <button id="btnAbrirModalAgregarReceta" className="add-recipe-btn" onClick={abrirModal}>
                                    <i className="fas fa-plus"></i> Agregar receta
                                </button>
                            </div>

                            
                            {modalVisible && (
                            <div id="modalAgregarReceta" className="modal">
                                <div className="modal-content">
                                    <span className="close" title="Cerrar" onClick={cerrarModal}>
                                        <i className="fas fa-times"></i>
                                    </span>

                                    <h2 id="titulo-modal">Agregar nueva receta</h2>

                                    {/* Formulario para agregar receta */}
                                <form className="form-receta" id="form-receta" encType="multipart/form-data" onSubmit={handleSubmit}>
                                    <div className="contenedor-receta">

                                        {/* Campos de título */}
                                        <div className="div-titulo-receta">
                                            <label htmlFor="titulo-r" className="label-titulo-receta">Nombre de la receta: </label>
                                            <input 
                                                type="text" 
                                                id="titulo-r" 
                                                placeholder="Inserte nombre de la receta" 
                                                className="receta-titulo"
                                                value={titulo} // Vinculamos el estado del título
                                                onChange={(e) => setTitulo(e.target.value)} // Actualizamos el estado
                                            />
                                        </div>
                                        <div id="modalErrorTitulo" className="modal-error-titulo"></div>

                                        {/* Campos de los ingredientes y sus cantidades */}
                                        <div className="div-cantidad-ingredientes-receta">
                                            <label htmlFor="cantidadIngrediente" className="label-cantidad-ingrediente">Ingredientes y cantidades:</label>
                                            <textarea
                                                id="cantidadIngrediente"
                                                className="text-area-cantidad-ingrediente"
                                                placeholder="Ejemplo:&#10;Sal: 20gr &#10;Agua: 300cc"
                                                value={cantidadIngrediente} // Asignamos el estado como valor
                                                onChange={actualizarIngredientesCantidades} // Manejador de cambio
                                            ></textarea>
                                            <input type="hidden" className="inputOcultoIngredientesCantidades" name="ingredientesCantidades" />
                                            <div className="p-aclaracion-cantidad-ingrediente">
                                                <p className="instruccion-ingrediente-cantidad">Separe el ingrediente de la cantidad con 2 puntos (:)</p>
                                            </div>
                                        </div>

                                        {/* Campos de los pasos */}
                                        <div className="div-pasos-receta">
                                            <div id="pasosPanel" className="pasos-panel">
                                                {pasos.map((paso, index) => (
                                                    <div key={index} className="paso">
                                                        <label htmlFor={`paso${index + 1}`} className="label-pasos">Paso {index + 1}:</label>
                                                        <textarea
                                                            id={`paso${index + 1}`}
                                                            className="text-area-pasos"
                                                            placeholder="Agregar paso..."
                                                            value={paso}
                                                            onChange={(e) => handlePasoChange(index, e.target.value)}
                                                            onInput={autoResize}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div id="modalErrorPasos" className="modal-error-paso"></div>
                                            <input type="hidden" id="inputOculto" name="pasos" />

                                            <div className="div-agregar-quitar-pasos">
                                                <button id="btnAgregarPaso" className="btn-agregar-paso" title="Agregar paso" onClick={agregarPaso}>
                                                    <i className="fas fa-plus"></i>  Paso
                                                </button>

                                                <button id="btnQuitarPaso" className="btn-quitar-paso" title="Quitar paso" onClick={quitarPaso} style={{ display: pasos.length > 1 ? 'block' : 'none' }}>
                                                    <i className="fas fa-minus"></i> Paso
                                                </button>
                                            </div>
                                        </div>
                                    

                                        {/* Imagen */}
                                        <div className="div-imagen">
                                            <label htmlFor="imagen" className="label-imagen-receta">Imagen de la receta:</label>
                                            <input type="file" id="imagen" name="file" accept="image/*" onChange={previewImage} className="input-imagen" />
                                            <div id="modalErrorImagen" className="modal-error-imagen"></div>
                                            <div className="imagen-preview">
                                                <img id="previewImagen" className="preview-imagen" src="#" alt="Previesualización de la imagen" />
                                            </div>
                                        </div>

                                        {/* Dificultad */}
                                        <div className="div-dificultad">
                                            <label htmlFor="dificultad" className="label-dificultad">Seleccione la dificultad de la receta: </label>
                                            <select id="dificultad" className="menu-dificultad" value={dificultad} onChange={(e) => setDificultad(e.target.value)}>
                                                <option value="">Seleccione...</option>
                                                <option value="Fácil">Fácil</option>
                                                <option value="Intermedio">Intermedio</option>
                                                <option value="Difícil">Difícil</option>
                                            </select>
                                        </div>
                                        <div id="modalErrorDificultad" className="modal-error-dificultad"></div>

                                        {/* Categoría */}
                                        <div className="div-categoria">
                                            <label htmlFor="categoria" className="label-categoria">Seleccione la categoría de la receta: </label>
                                            <select id="categoria" className="menu-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                                                <option value="">Seleccione...</option>
                                                <option value="Desayuno/Merienda">Desayuno/Merienda</option>
                                                <option value="Almuerzo/Cena">Almuerzo/Cena</option>
                                                <option value="Brunch">Brunch</option>
                                                <option value="Bebida/trago">Bebida/Trago</option>
                                                <option value="Veggie">Veggie</option>
                                                <option value="Guarnición">Guarnición</option>
                                                <option value="Postre">Postre</option>
                                            </select>
                                        </div>
                                        <div id="modalErrorCategoria" className="modal-error-categoria"></div>

                                        {/* Tiempo de preparación */}
                                        <div className="div-tiempo-preparacion">
                                            <label htmlFor="tiempoPreparacion" className="label-tiempo-preparacion">Tiempo de preparación (minutos): </label>
                                            <button id="btnQuitarTiempo" className="btn-quitar-tiempo" title="Quitar 1 minuto" onClick={quitarMinuto}>
                                                <i className="fas fa-minus"></i>
                                            </button>
                                            <input type="text" id="tiempoPreparacion" className="input-tiempo-preparacion" value={tiempoPreparacion} onChange={(e) => setTiempoPreparacion(e.target.value)} />
                                            <button id="btnAgregarTiempo" className="btn-agregar-tiempo" title="Agregar 1 minuto" onClick={agregarMinuto}>
                                                <i className="fas fa-plus"></i>
                                            </button>
                                        </div>
                                        <div id="modalErrorTiempoPreparacion" className="modal-error-tiempo-preparacion"></div>

                                        {/* Ingredientes */}
                                        <div className="div-ingredientes">
                                            <label className="label-ingredientes">Ingredientes característicos de la receta:</label>
                                            <input type="text" id="ingredientesInput" className="input-ingredientes" placeholder="Ingrese ingredientes esenciales de la receta..." name="ingredientes" value={ingredientes} onChange={(e) => setIngredientes(e.target.value)} />
                                        </div>
                                        <div className="p-aclaracion-ingrediente">
                                            <p className="instruccion-ingrediente">Separe cada ingrediente por una coma ( , )</p>
                                        </div>
                                        <div id="modalErrorIngredientes" className="modal-error-ingredientes"></div>

                                        {/* Botón para guardar receta */}
                                        <button type="submit" id="boton-enviar" className="btn-guardar-receta">
                                            Guardar receta
                                        </button>
                                    </div>
                                </form>

                                </div>
                            </div>
                            )}
                        </section>


                        {/* Sección de Top 3 Recetas */}
                        <section className="top3">
                            <p className="top-recetas-titulo">Top 3 Recetas</p>
                            <div className="panel-recetas">
                                {topRecetas.map((receta) => (
                                    <div key={receta.id} className="tarjeta-receta">
                                        <div className="imagen-contenedor">
                                            <img src={receta.imagen} alt={receta.titulo} />
                                            <div className="info-imagen">
                                                <span className="nombre-usuario">{receta.usuario.nombre}</span>
                                                <span className="fecha-subida">{new Date(receta.fecha).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <h2>{capitalizarPrimeraLetra(receta.titulo)}</h2>
                                        <p>Categoría: {receta.categoria}</p>
                                        <p>
                                            <span className="tiempo">Tiempo de preparación: {receta.tiempoPreparacion}'</span>
                                            <i className="far fa-clock"></i>
                                            <span className={`dificultad-${receta.dificultad.toLowerCase()}`}>{receta.dificultad}</span>
                                        </p>
                                        <div className="valoracion">
                                            <p>Valoración Promedio</p>
                                            <div className="estrellas">
                                                <i className={`fa${receta.valoracion >= 1 ? 's' : 'r'} fa-star`}></i>
                                                <i className={`fa${receta.valoracion >= 2 ? 's' : 'r'} fa-star`}></i>
                                                <i className={`fa${receta.valoracion >= 3 ? 's' : 'r'} fa-star`}></i>
                                                <i className={`fa${receta.valoracion >= 4 ? 's' : 'r'} fa-star`}></i>
                                                <i className={`fa${receta.valoracion >= 5 ? 's' : 'r'} fa-star`}></i>
                                            </div>
                                        </div>
                                        <a href={`/detalle-receta/${receta._id}`} className="ver-mas">Ver más</a>
                                    </div>
                                ))}
                                {generarTarjetasPlaceholder(tarjetasFaltantes)}
                            </div>
                        </section>




                        <section className="favoritos">
                            <p className="favoritos-titulo">Mis Recetas Favoritas</p>
                            {favoritos.length === 0 ? (
                                <span className="mensaje-no-recetas-favoritas">Aún no has agregado recetas a tu sección de favoritas. ¡Agrega las recetas que más te hayan gustado para encontrarlas más fácilmente!</span>
                            ) : (
                                <div className="panel-recetas">
                                    {recetas.filter(receta => favoritos.map(fav => fav.toString()).includes(receta._id)).map(receta => (
                                        <div key={receta._id} className="tarjeta-receta">
                                            <div className="imagen-contenedor">
                                                <img src={receta.imagen} alt={receta.titulo} />
                                                <div className="info-imagen">
                                                    <span className="nombre-usuario">{receta.usuario.nombre}</span>
                                                    <span className="fecha-subida">{new Date(receta.fecha).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <h2>{capitalizarPrimeraLetra(receta.titulo)}</h2>
                                            <p>Categoría: {receta.categoria}</p>
                                            <p>
                                                <span className="tiempo">Tiempo de preparación: {receta.tiempoPreparacion}'</span>
                                                <i className="far fa-clock"></i>
                                                <span className={`dificultad-${receta.dificultad.toLowerCase()}`}>{receta.dificultad}</span>
                                            </p>

                                            <div className="valoracion">
                                                <p>Valoración Promedio</p>
                                                <div className="estrellas">
                                                    {[...Array(5)].map((_, i) => (
                                                        <i key={i} className={`fa${i < receta.valoracion ? 's' : 'r'} fa-star`}></i>
                                                    ))}
                                                </div>
                                            </div>

                                            <a className="ver-mas" onClick={() => navigate(`/detalle-receta/${receta._id}`)}>
                                                Ver más
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                       



                        <footer className="footer">
                            © Sitio desarrollado por Javito | Todos los derechos reservados
                        </footer>

                    </main>
                </div>
            </div>
            
        </div>
        
        
    );
};

export default Inicio;
