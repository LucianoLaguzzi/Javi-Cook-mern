// Inicio.js
import React, { useState, useEffect, useRef } from 'react';
import '../style.css'; // Asegúrate de que la ruta sea correcta
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet';
import Cropper from 'react-easy-crop'; // Importa el componente de recorte
import Swal from 'sweetalert2';

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
    const [recetasFiltradas, setRecetasFiltradas] = useState([]); // Recetas después del filtrado
    const [paginaActual, setPaginaActual] = useState(1); // Página actual
    const [recetasPorPagina] = useState(6); // Número de recetas a mostrar por página
    const [crop, setCrop] = useState({ x: 0, y: 0 }); // Coordenadas de recorte
    const [zoom, setZoom] = useState(1); // Nivel de zoom para el recorte
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null); // Área recortada
    const [errorTitulo, setErrorTitulo] = useState("");
    const [errorIngredientesCantidades, setErrorIngredientesCantidades] = useState("");
    const [errorPasos, setErrorPasos] = useState("");
    const [errorImagen, setErrorImagen] = useState("");
    const [errorDificultad, setErrorDificultad] = useState("");
    const [errorCategoria, setErrorCategoria] = useState("");
    const [errorTiempo, setErrorTiempo] = useState("");
    const [errorIngredientes, setErrorIngredientes] = useState("");
    const [menuVisible, setMenuVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Estado de carga al seleccionar aleatoriamente

    const inputRef = useRef(null); // Referencia al campo de texto de búsqueda



    //Calculos para mostrar bien las cantidades de recetas en la paginacion
    const indexOfLastReceta = paginaActual * recetasPorPagina; // Última receta en la página actual
    const indexOfFirstReceta = indexOfLastReceta - recetasPorPagina; // Primera receta en la página actual
    const recetasActuales = recetasFiltradas.slice(indexOfFirstReceta, indexOfLastReceta); // Recetas a mostrar

    //Calculos para manejar la paginacion bien
    const totalRecetas = recetasFiltradas.length; // Total de recetas filtradas
    const totalPaginas = Math.ceil(totalRecetas / recetasPorPagina); // Calcular el total de páginas



    const usuarioEnSesion = JSON.parse(localStorage.getItem('usuario'));

    // Llenar con placeholders si hay menos de 3 recetas
    const tarjetasFaltantes = 3 - topRecetas.length;

    //Traer las recetas para las tarjetas
    useEffect(() => {
        axios.get('https://javicook-mern.onrender.com/api/recetas')
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
        axios.get('https://javicook-mern.onrender.com/api/recetas/top3')
        .then(response => {
            setTopRecetas(response.data);
        })
        .catch(error => {
            console.error('Error al obtener el top 3 de recetas:', error);
        });

        // Obtener recetas favoritas del usuario
        // Verificar si hay un usuario en sesión antes de obtener favoritos
        if (usuarioEnSesion) {
            axios.get(`https://javicook-mern.onrender.com/api/usuarios/${usuarioEnSesion._id}/favoritos`)
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
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImagen(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Maneja el recorte
    const handleCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const getCroppedImg = async () => {
        if (!imagen || !croppedAreaPixels) return;
        const image = await fetch(imagen).then((res) => res.blob()); // Convierte a blob
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = await createImageBitmap(image);

        // Configura el tamaño del canvas
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        // Dibuja la imagen en el canvas
        ctx.drawImage(
            img,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
        );

        // Obtiene la imagen recortada
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg');
        });
    };

    const quitarMinuto = (e) => {
        e.preventDefault();
        // Convierte el valor actual a un número y resta 1
        const nuevoTiempo = parseInt(tiempoPreparacion, 10) - 1;
        // Asegúrate de no ir a un número negativo
        setTiempoPreparacion(Math.max(nuevoTiempo, 0));
    };
    
    const agregarMinuto = (e) => {
        e.preventDefault();
        // Convierte el valor actual a un número y suma 1
        const nuevoTiempo = parseInt(tiempoPreparacion, 10) + 1;
        setTiempoPreparacion(nuevoTiempo);
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


    // Efecto para mostrar bien la seccion de recetas al cambiar la pagina en paginacion
    useEffect(() => {
        window.scrollTo(0, 0); // Desplazar hacia la parte superior
    }, [paginaActual]);


    // Manejar el toggle de favoritos
    const toggleFavorito = (recetaId) => {
        const isFavorito = favoritos.includes(recetaId);
    
        if (isFavorito) {
            // Eliminar de favoritos
            axios.delete(`https://javicook-mern.onrender.com/api/usuarios/${usuarioEnSesion._id}/favoritos`, { data: { recetaId } })
                .then(response => {
                    setFavoritos(prevFavoritos => prevFavoritos.filter(fav => fav !== recetaId)); // Eliminar de favoritos localmente
                })
                .catch(error => console.error('Error al eliminar de favoritos:', error));
        } else {
            // Agregar a favoritos
            axios.post(`https://javicook-mern.onrender.com/api/usuarios/${usuarioEnSesion._id}/favoritos`, { recetaId }) // Hacer POST para agregar a favoritos
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
        const palabrasClave = quitarTildes(input).toLowerCase().split(/[\s,]+/).filter(Boolean);

        if (palabrasClave.length === 0) {
            // Mostrar todas las recetas si no se ingresó ningún ingrediente o título
            setRecetasFiltradas(recetas);
        } else {
            const recetasFiltradas = recetas.filter((receta) => {
                const ingredientesReceta = quitarTildes(receta.ingredientes[0]).toLowerCase().split(', ');
                const tituloReceta = quitarTildes(receta.titulo).toLowerCase();

                // Verificar si todos los ingredientes buscados están en los ingredientes de la receta
                const coincidenIngredientes = palabrasClave.every(ingrediente =>
                    ingredientesReceta.some(ingReceta => ingReceta.includes(ingrediente))
                );

                // Verificar si todos los términos buscados coinciden en el título de la receta
                const coincideTitulo = palabrasClave.every(palabra =>
                    tituloReceta.includes(palabra)
                );

                // Retornar true solo si todos los ingredientes y/o el título coinciden
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
            
            // Esperar un momento para ver el efecto antes de realizar la acción
            setTimeout(async () => {
                const categoriaCodificada = encodeURIComponent(categoria);
                const response = await axios.get(`https://javicook-mern.onrender.com/api/recetas/random/${categoriaCodificada}`);
    
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
                navigate(`/detalle-receta/${response.data._id}`);
                // Eliminar el efecto después de la redirección
                categoriaBoton.classList.remove('shine-effect');
            }, 1000);
    
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

    


    


    //                                                  Aca ya van los metodos de la vista:

        // Referencias de los campos
        const tituloRef = useRef();
        const cantidadIngredienteRef = useRef();
        const pasosRef = useRef();
        const imagenRef = useRef();
        const dificultadRef = useRef();
        const categoriaRef = useRef();
        const tiempoPreparacionRef = useRef();
        const ingredientesRef = useRef();




    //Envio del formulario para dar de alta receta
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        setErrorTitulo("");
        setErrorIngredientesCantidades(""); 
        setErrorPasos(""); 
        setErrorImagen("");
        setErrorDificultad("");
        setErrorCategoria("");
        setErrorTiempo("");
        setErrorIngredientes("");
    
        // Variable para rastrear si hay errores
        let hasError = false;
    
        // Manejo de errores en los campos
        if (!titulo) {
            setErrorTitulo("Por favor, ingrese el nombre de la receta.");
            tituloRef.current.focus(); // Foco en el primer campo con error
            hasError = true;
        } 
        if (!cantidadIngrediente){
            setErrorIngredientesCantidades("Por favor, ingrese ingredientes y cantidades.");
            cantidadIngredienteRef.current.focus();
            hasError = true;
        } 
        if (pasos[0] === ''){
            setErrorPasos("Por favor, ingrese pasos de la receta.");
            pasosRef.current.focus();
            hasError = true;
        } 
        if (!imagen){
            setErrorImagen("Por favor, ingrese una imagen de la receta.");
            imagenRef.current.focus();
            hasError = true;
        } 
        if (!dificultad){
            setErrorDificultad("Por favor, seleccione dificultad");
            dificultadRef.current.focus();
            hasError = true;
        } 
        if (!categoria){
            setErrorCategoria("Por favor, seleccione categoria");
            categoriaRef.current.focus();
            hasError = true;
        } 
        if (!tiempoPreparacion){
            setErrorTiempo("Por favor, coloque tiempo de preparación");
            tiempoPreparacionRef.current.focus();
            hasError = true;
        } 
        if (!ingredientes){
            setErrorIngredientes("Por favor, inserte ingredientes de la receta");
            ingredientesRef.current.focus();
            hasError = true;
        } 
    
        // Si hay algún error, termina la función aquí
        if (hasError) return;
    
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
        

        try {
            // Subir la imagen a Cloudinary
            const croppedImage = await getCroppedImg();
            const nombreReceta = nuevaReceta.titulo || 'receta'; // Asegúrate de que el título esté disponible
            const nombreArchivo = `${nombreReceta.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
            const formDataImagen = new FormData();
            formDataImagen.append('file', croppedImage);
            formDataImagen.append('upload_preset', 'recipe_images');
            formDataImagen.append('folder', 'recetas');  // Especificamos la carpeta 'recetas'
            formDataImagen.append('public_id', nombreArchivo);  // Usamos el nombre que hemos generado


            const response = await axios.post('https://api.cloudinary.com/v1_1/dzaqvpxqk/image/upload', formDataImagen);
            const imagenUrl = response.data.secure_url;

            // Añadir la URL de la imagen a los datos de la receta
            nuevaReceta.imagen = imagenUrl;

            const formData = new FormData();
            for (const key in nuevaReceta) {
                formData.append(key, nuevaReceta[key]);
            }

            console.log('Datos antes de enviar:', nuevaReceta);

            // Asegúrate de que ingredientesCantidades tenga el valor correcto
            const hiddenInputIngredientes = document.querySelector(".inputOcultoIngredientesCantidades");
            formData.append('ingredientesCantidades', hiddenInputIngredientes.value); // Asegúrate de que este valor se envíe correctamente
            

            // Enviar la receta al servidor
            const resultado = await axios.post('https://javicook-mern.onrender.com/api/recetas', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setRecetas(prevRecetas => [resultado.data, ...prevRecetas]);
            setRecetasFiltradas(prevRecetas => [resultado.data, ...prevRecetas]);

            cerrarModal();
            resetFormulario();
        } catch (error) {
            console.error("Error al guardar la receta", error.response ? error.response.data : error);
            alert("Hubo un error al guardar la receta. Por favor, intenta de nuevo.");
        }
        
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
    window.addEventListener('scroll', ajustarPosicionBoton);
    


    //BUSQUEDA DEL FILTRO POR VOZ
    let reconocimientoVoz;
    let reconocedorActivo = false;

    const iniciarReconocimiento = () => {
        // Verificar si la API de reconocimiento de voz está disponible
        const Recognition = window.webkitSpeechRecognition || window.SpeechRecognition;
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

            inputRef.current.value = transcripcionFinal || transcripcionIntermedia;
            manejarFiltroIngredientes(transcripcionFinal || transcripcionIntermedia);
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






                    <div className="barra-secundaria">
                        <a href="#recetas" className="link-secundario">Recetas</a>
                        <a href="#top3" className="link-secundario">Top 3</a>
                        <a href="#favoritos" className="link-secundario">Favoritos</a>




                        <div 
                            className="dropdown"
                            onMouseEnter={() => setMenuVisible(true)}
                            onMouseLeave={() => setMenuVisible(false)}
                        >
                            <a href="#" className="link-secundario">Aleatorio</a>
                            {menuVisible && (
                                <div className="dropdown-menu">
                                    <button  className="shine-effect" data-categoria="Desayuno/Merienda" onClick={() => obtenerRecetaAleatoria("Desayuno/Merienda")}>Desayuno/Merienda</button>
                                    <button  className="shine-effect" data-categoria="Almuerzo/Cena" onClick={() => obtenerRecetaAleatoria("Almuerzo/Cena")}>Almuerzo/Cena</button>
                                    <button  className="shine-effect" data-categoria="Brunch" onClick={() => obtenerRecetaAleatoria("Brunch")}>Brunch</button>
                                    <button  className="shine-effect" data-categoria="Bebida/Trago" onClick={() => obtenerRecetaAleatoria("Bebida/Trago")}>Bebida/Trago</button>
                                    <button  className="shine-effect" data-categoria="Veggie" onClick={() => obtenerRecetaAleatoria("Veggie")}>Veggie</button>
                                    <button  className="shine-effect" data-categoria="Guarnición" onClick={() => obtenerRecetaAleatoria("Guarnición")}>Guarnición</button>
                                    <button  className="shine-effect" data-categoria="Postre"onClick={() => obtenerRecetaAleatoria("Postre")}>Postre</button>
                                    
                                </div>
                            )}
                        </div>






                    </div>












                    <main className="principal">
                        
                        {/* Mostrar un cartel de carga hasta q se traigan los datos o vuelva de inactividad */}
                        {isLoading && (
                            <div className="loading-container-eliminar">
                                <div className="spinner-eliminar"></div>
                                <p className="loading-message-eliminar">Creando receta...</p>
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
                                <h2>Recetas disponibles</h2>
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
                                        <div className="panel-recetas">
                                            {recetasActuales.map((receta) => (
                                                <div key={receta.id} className="tarjeta-receta">
                                                    <div className="imagen-contenedor-chica">
                                                        <img src={receta.imagen} alt={receta.titulo} />
                                                        <div className="info-imagen">
                                                            <span className="nombre-usuario">{receta.usuario.nombre}</span>  
                                                            <span className="fecha-subida">{new Date(receta.fecha).toLocaleDateString('es-AR')}</span>
                                                        </div>
                                                        <i className={`fas fa-heart icono-favorito ${favoritos.includes(receta._id) ? 'favorito' : ''}`}
                                                            title={favoritos.includes(receta._id) ? 'Quitar de favoritos' : 'Guardar como favorito'}
                                                            onClick={() => toggleFavorito(receta._id)}
                                                        ></i>
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
                                    ) : ( // Si hay recetas, pero recetasActuales está vacío (filtro sin coincidencias)
                                        <span className='mensaje-no-recetas'>No se encontraron recetas con esos ingredientes.</span>
                                    )
                                )
                            )}

                            {/* Controles de Paginación */}
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


                            {/* Botón para agregar una nueva receta */}
                            <div className="div-agregar-receta">
                                <button id="btnAbrirModalAgregarReceta" className="add-recipe-btn" onClick={abrirModal}>
                                    <i className="fas fa-plus"></i> Nueva receta
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
                                                    ref={tituloRef}
                                                    type="text" 
                                                    id="titulo-r" 
                                                    placeholder="Inserte nombre de la receta" 
                                                    className={`receta-titulo ${errorTitulo ? 'input-error' : ''}`} // Clase condicional para el borde rojo
                                                    value={titulo} // Vinculamos el estado del título
                                                    onChange={(e) => setTitulo(e.target.value)} // Actualizamos el estado
                                                />
                                            </div>
                                            <div className="modal-error-titulo"  style={{height:'20px'}}>
                                                {errorTitulo && <div id="modalErrorTitulo" > {errorTitulo} </div>}
                                            </div>

                                            {/* Campos de los ingredientes y sus cantidades */}
                                            <div className="div-cantidad-ingredientes-receta">
                                                <label htmlFor="cantidadIngrediente" className="label-cantidad-ingrediente">Ingredientes y cantidades:</label>
                                                <textarea
                                                    ref={cantidadIngredienteRef}
                                                    id="cantidadIngrediente"
                                                    className={`text-area-cantidad-ingrediente ${errorIngredientesCantidades ? 'input-error' : ''}`}
                                                    placeholder="Ejemplo:&#10;Sal: 20gr &#10;Agua: 300cc"
                                                    value={cantidadIngrediente} // Asignamos el estado como valor
                                                    onChange={actualizarIngredientesCantidades} // Manejador de cambio
                                                ></textarea>
                                                <input type="hidden" className="inputOcultoIngredientesCantidades" name="ingredientesCantidades" />
                                                <div className="p-aclaracion-cantidad-ingrediente">
                                                    <p className="instruccion-ingrediente-cantidad">Separe el ingrediente de la cantidad con 2 puntos (:)</p>
                                                </div>
                                            </div>
                                            <div className="modal-error-ingredientes-cantidades"  style={{height:'20px'}}>
                                                {errorIngredientesCantidades && <div id="modalErrorIngredientesCantidades" > {errorIngredientesCantidades} </div>}
                                           </div>

                                            {/* Campos de los pasos */}
                                            <div className="div-pasos-receta">
                                                <div id="pasosPanel" className="pasos-panel">
                                                    {pasos.map((paso, index) => (
                                                        <div key={index} className="paso">
                                                            <label htmlFor={`paso${index + 1}`} className="label-pasos">Paso {index + 1}:</label>
                                                            <textarea
                                                                ref={pasosRef}
                                                                id={`paso${index + 1}`}
                                                                className={`text-area-pasos ${errorPasos ? 'input-error' : ''}`}
                                                                placeholder="Agregar paso..."
                                                                value={paso}
                                                                onChange={(e) => handlePasoChange(index, e.target.value)}
                                                                onInput={autoResize}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="modal-error-paso" style={{height:'20px'}}>
                                                    {errorPasos && <div id="modalErrorPasos" > {errorPasos} </div>}
                                                </div>
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
                                                <input 
                                                ref={imagenRef}
                                                type="file" 
                                                id="imagen" 
                                                name="file" 
                                                accept="image/*" 
                                                onChange={previewImage} 
                                                className={`input-imagen ${errorImagen ? 'input-error' : ''}`}
                                                />
                                                <div  className="modal-error-imagen" style={{height:'20px'}}>
                                                    {errorImagen && <div id="modalErrorImagen"> {errorImagen} </div>}
                                                </div>
                                                <div className={`imagen-preview ${imagen ? 'visible' : ''}`}>
                                                    {imagen && (
                                                        <Cropper
                                                        image={imagen}
                                                        crop={crop}
                                                        zoom={zoom}
                                                        aspect={4 / 3} // Cambia el aspecto según sea necesario
                                                        onCropChange={setCrop}
                                                        onZoomChange={setZoom}
                                                        onCropComplete={handleCropComplete}
                                                        style={{ 
                                                            width: '100%', // Se asegura de que ocupe todo el espacio del contenedor
                                                            height: '100%' // También asegura que ocupe toda la altura
                                                        }}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            
                                            {/* Dificultad */}
                                            <div className="div-dificultad">
                                                <label htmlFor="dificultad" className="label-dificultad">Seleccione la dificultad de la receta: </label>
                                                <select 
                                                ref={dificultadRef}
                                                id="dificultad" 
                                                className={`menu-dificultad ${errorDificultad ? 'input-error' : ''}`} 
                                                value={dificultad} 
                                                onChange={(e) => setDificultad(e.target.value)} 
                                                >
                                                    <option value="">Seleccione...</option>
                                                    <option value="Fácil">Fácil</option>
                                                    <option value="Intermedio">Intermedio</option>
                                                    <option value="Difícil">Difícil</option>
                                                </select>
                                            </div>
                                            <div className="modal-error-dificultad" style={{height:'20px'}}>
                                                {errorDificultad && <div id="modalErrorDificultad"> {errorDificultad} </div>}
                                            </div>

                                            {/* Categoría */}
                                            <div className="div-categoria">
                                                <label htmlFor="categoria" className="label-categoria">Seleccione la categoría de la receta: </label>
                                                <select 
                                                ref={categoriaRef}
                                                id="categoria" 
                                                className= {`menu-categoria ${errorCategoria ? 'input-error' : ''}`}  
                                                value={categoria} 
                                                onChange={(e) => setCategoria(e.target.value)} 
                                                >
                                                    {/* Si agrego cateogoria nueva aca tengo que agregarla al random seleccionable tambien*/}
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
                                            <div className="modal-error-categoria" style={{height:'20px'}}>
                                                {errorCategoria && <div id="modalErrorCategoria" > {errorCategoria} </div>}
                                            </div>  

                                            {/* Tiempo de preparación */}
                                            <div className="div-tiempo-preparacion">
                                                <label htmlFor="tiempoPreparacion" className="label-tiempo-preparacion">Tiempo de preparación (minutos): </label>
                                                
                                                <button 
                                                    id="btnQuitarTiempo" 
                                                    className="btn-quitar-tiempo" 
                                                    title="Quitar 1 minuto" 
                                                    onClick={quitarMinuto}>
                                                    <i className="fas fa-minus"></i>
                                                </button>
                                                
                                                <input 
                                                    ref={tiempoPreparacionRef}
                                                    type="text" 
                                                    id="tiempoPreparacion" 
                                                    className={`input-tiempo-preparacion ${errorTiempo ? 'input-error' : ''}`}   
                                                    value={tiempoPreparacion} 
                                                    onChange={(e) => setTiempoPreparacion(e.target.value)}
                                                />
                                                
                                                <button 
                                                    id="btnAgregarTiempo" 
                                                    className="btn-agregar-tiempo" 
                                                    title="Agregar 1 minuto" 
                                                    onClick={agregarMinuto}>
                                                    <i className="fas fa-plus"></i>
                                                </button>
                                            </div>

                                            <div className="modal-error-tiempo-preparacion" style={{height:'20px'}}>
                                                {errorTiempo && <div id="modalErrorTiempoPreparacion" > {errorTiempo} </div>}
                                            </div>

                                            {/* Ingredientes */}
                                            <div className="div-ingredientes">
                                                <label className="label-ingredientes">Ingredientes característicos de la receta:</label>
                                                <input 
                                                ref={ingredientesRef}
                                                type="text" 
                                                id="ingredientesInput" 
                                                className= {`input-ingredientes  ${errorIngredientes ? 'input-error' : ''}`}   
                                                placeholder="Ingrese ingredientes..." 
                                                name="ingredientes" value={ingredientes} 
                                                onChange={(e) => setIngredientes(e.target.value)} 
                                                />
                                            </div>
                                            <div className="p-aclaracion-ingrediente">
                                                <p className="instruccion-ingrediente">Separe cada ingrediente por una coma ( , )</p>
                                            </div>
                                            <div className="modal-error-ingredientes" style={{height:'20px'}}>
                                                {errorIngredientes && <div id="modalErrorIngredientes" >{errorIngredientes} </div>}
                                            </div>

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
                        <section id='top3' className="top3">
                            <p className="top-recetas-titulo">Top 3 Recetas</p>
                            <div className="panel-recetas">
                                {topRecetas.map((receta) => (
                                    <div key={receta.id} className="tarjeta-receta">
                                        <div className="imagen-contenedor-chica">
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




                        <section id="favoritos" className="favoritos">
                            <p className="favoritos-titulo">Mis Recetas Favoritas</p>
                            {favoritos.length === 0 ? (
                                <span className="mensaje-no-recetas-favoritas">Aún no has agregado recetas a tu sección de favoritas. ¡Agrega las recetas que más te hayan gustado para encontrarlas más fácilmente!</span>
                            ) : (
                                <div className="panel-recetas">
                                    {recetas.filter(receta => favoritos.map(fav => fav.toString()).includes(receta._id)).map(receta => (
                                        <div key={receta._id} className="tarjeta-receta">
                                            <div className="imagen-contenedor-chica">
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
