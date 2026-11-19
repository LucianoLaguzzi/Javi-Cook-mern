import React, { useState, useEffect, useRef } from "react";
import "../style.css";
import axios from "axios";
import Cropper from "react-easy-crop";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

const CrearReceta = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  /* ------------------ ESTADOS ------------------ */

  const [titulo, setTitulo] = useState("");
  const [filasIngredientes, setFilasIngredientes] = useState([
    { nombre: "", cantidad: "" }
  ]);
  const [pasos, setPasos] = useState([""]);
  const [imagen, setImagen] = useState(null);
  const [dificultad, setDificultad] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tiempoPreparacion, setTiempoPreparacion] = useState("");
  const [ingredientes, setIngredientes] = useState("");

  const [imagenesPasosFiles, setImagenesPasosFiles] = useState([null]);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [errorTitulo, setErrorTitulo] = useState("");
  const [errorIngredientesCantidades, setErrorIngredientesCantidades] = useState("");
  const [errorPasos, setErrorPasos] = useState("");
  const [errorImagen, setErrorImagen] = useState("");
  const [errorDificultad, setErrorDificultad] = useState("");
  const [errorCategoria, setErrorCategoria] = useState("");
  const [errorTiempo, setErrorTiempo] = useState("");
  const [errorIngredientes, setErrorIngredientes] = useState("");

  const [cargandoNuevaReceta, setCargandoNuevaReceta] = useState(false);

  /* ------------------ REFS ------------------ */

    const tituloRef = useRef();
   const ingredientesFilasRef = useRef([]);
    const pasosRef = useRef();
    const imagenRef = useRef();
    const dificultadRef = useRef();
    const categoriaRef = useRef();
    const tiempoPreparacionRef = useRef();
    const ingredientesRef = useRef();

    /* ------------------ PASOS ------------------ */

    

    const handlePasoChange = (index, value) => {
        const nuevosPasos = [...pasos];
        nuevosPasos[index] = value;
        setPasos(nuevosPasos);
    };

    const agregarPaso = (e) => {
        e.preventDefault();
        setPasos((prev) => [...prev, ""]);
        setImagenesPasosFiles((prev) => [...prev, null]);
    };

    const quitarPaso = (e) => {
        e.preventDefault();

        if (pasos.length > 1) {
            setPasos((prev) => prev.slice(0, -1));
            setImagenesPasosFiles((prev) => prev.slice(0, -1));
        }
    };
  /* ------------------ IMAGEN PRINCIPAL ------------------ */

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

  /* ------------------ CROPPER ------------------ */

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const getCroppedImg = async () => {
    if (!imagen || !croppedAreaPixels) return;

    const image = await fetch(imagen).then((res) => res.blob());

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const img = await createImageBitmap(image);

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  };

  /* ------------------ IMAGEN PASOS ------------------ */

  const manejarImagenPaso = (index, file) => {
    if (!file) return;

    const preview = URL.createObjectURL(file);

    setImagenesPasosFiles((prev) => {
      const copia = [...prev];

      copia[index] = {
        file,
        preview,
      };

      return copia;
    });
  };

    /* ------------------ SUBMIT ------------------ */
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
        

        const enfocarPrimerError = (ref) => {
            if (!hasError) {
                ref?.current?.focus();
            }
            hasError = true;
        };

        if (!titulo.trim()) {
            setErrorTitulo("Ingresá el nombre de la receta.");
            enfocarPrimerError(tituloRef);
        }

        const filasCompletas = filasIngredientes.filter(
            (fila) => fila.nombre.trim() && fila.cantidad.trim()
        );

        const filasIncompletas = filasIngredientes.some(
            (fila) =>
                (fila.nombre.trim() && !fila.cantidad.trim()) ||
                (!fila.nombre.trim() && fila.cantidad.trim())
        );

        if (filasCompletas.length === 0 || filasIncompletas) {
            setErrorIngredientesCantidades(
                filasCompletas.length === 0
                    ? "Agregá al menos un ingrediente con su cantidad."
                    : "Completá el ingrediente y la cantidad en cada fila."
            );

            const primeraFilaIncompleta = filasIngredientes.findIndex(
                (fila) =>
                    !fila.nombre.trim() ||
                    !fila.cantidad.trim()
            );

            if (!hasError) {
                ingredientesFilasRef.current[primeraFilaIncompleta]?.focus();
            }

            hasError = true;
        }

        const pasosIncompletos = pasos.some(paso => !paso.trim());
        if (pasosIncompletos) {
            setErrorPasos("Completá todos los pasos de preparación.");
            if (!hasError) {
                const primerPasoVacio = pasos.findIndex(paso => !paso.trim());
                document.getElementById(`paso${primerPasoVacio + 1}`)?.focus();
            }
            hasError = true;
        }

        if (!imagen) {
            setErrorImagen("Seleccioná una imagen principal para la receta.");
            enfocarPrimerError(imagenRef);
        }

        if (!dificultad) {
            setErrorDificultad("Seleccioná la dificultad.");
            enfocarPrimerError(dificultadRef);
        }

        if (!categoria) {
            setErrorCategoria("Seleccioná una categoría.");
            enfocarPrimerError(categoriaRef);
        }

        const tiempo = Number(tiempoPreparacion);

        if (!tiempoPreparacion || !Number.isInteger(tiempo) || tiempo < 1) {
            setErrorTiempo("Ingresá un tiempo válido, de al menos 1 minuto.");
            enfocarPrimerError(tiempoPreparacionRef);
        }

        if (!ingredientes.trim()) {
            setErrorIngredientes("Ingresá los ingredientes de la receta.");
            enfocarPrimerError(ingredientesRef);
        }

        //Si hay algún error en algun campo, no continuar con la creación de la receta
        if (hasError) return;
    


        const nuevaReceta = {
            titulo,
            ingredientesCantidades: filasCompletas
                .map((fila) => `${fila.nombre.trim()}:${fila.cantidad.trim()}`)
                .join("\n"),
            pasos: pasos.join("\n"),
            dificultad,
            categoria,
            tiempoPreparacion,
            ingredientes,
            usuario: usuario._id,
        };
        
        setCargandoNuevaReceta(true); // Activa el estado de carga

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


            const imagenesPasosUrls = [];

            for (const file of imagenesPasosFiles) {
                 if (!file?.file) {
                    imagenesPasosUrls.push(null);
                    continue;
                }

                const formDataPaso = new FormData();
                formDataPaso.append('file', file.file);
                formDataPaso.append('upload_preset', 'recipe_images');
                formDataPaso.append('folder', 'recetas');

                const res = await axios.post(
                    'https://api.cloudinary.com/v1_1/dzaqvpxqk/image/upload',
                    formDataPaso
                );

                imagenesPasosUrls.push(res.data.secure_url);
            }

            // Añadir la URL de la imagen a los datos de la receta
            nuevaReceta.imagen = imagenUrl;

            const formData = new FormData();
            for (const key in nuevaReceta) {
                formData.append(key, nuevaReceta[key]);
            }

            console.log('Datos antes de enviar:', nuevaReceta);


            
            nuevaReceta.imagenesPasos = JSON.stringify(imagenesPasosUrls);

           formData.append('imagenesPasos', JSON.stringify(imagenesPasosUrls));

            // Enviar la receta al servidor
            const resultado = await axios.post(`${API_BASE_URL}/api/recetas`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            navigate("/inicio");

        } catch (error) {
            console.error("Error al guardar la receta", error.response ? error.response.data : error);
            alert("Hubo un error al guardar la receta. Por favor, intenta de nuevo.");
        } finally {
            setCargandoNuevaReceta(false); // Desactiva el estado de carga

        }
        
    };

/* ------------------ OTRAS FUNCIONES ------------------ */

    const actualizarFilaIngrediente = (index, campo, valor) => {
        setFilasIngredientes((prev) =>
            prev.map((fila, i) =>
                i === index ? { ...fila, [campo]: valor } : fila
            )
        );

        setErrorIngredientesCantidades("");
    };

    const agregarFilaIngrediente = () => {
        setFilasIngredientes((prev) => [
            ...prev,
            { nombre: "", cantidad: "" }
        ]);
    };

    const quitarFilaIngrediente = (index) => {
        setFilasIngredientes((prev) =>
            prev.filter((_, i) => i !== index)
        );

        setErrorIngredientesCantidades("");
    };


    const autoResize = (e) => {
        const textarea = e.target;
        textarea.style.height = '0'; // Reinicia la altura para calcularla de nuevo
        textarea.style.height = textarea.scrollHeight + 'px'; // Ajusta la altura al scrollHeight
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



  /* ------------------ RENDER ------------------ */

    return (
        <div id="modalAgregarReceta" className="modal">
            <div className="modal-content">

                <div className="recipe-editor-header">
                    <h2 id="titulo-modal">Nueva receta</h2>

                    <button
                        type="button"
                        className="close-recipe"
                        title="Cerrar"
                        aria-label="Cerrar"
                        onClick={() => navigate("/inicio")}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form
                    className="form-receta"
                    id="form-receta"
                    encType="multipart/form-data"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <div className="contenedor-receta">

                        {/* Campos de título */}
                        <div className="div-titulo-receta">
                            <label htmlFor="titulo-r" className="label-titulo-receta">
                                Nombre de la receta
                            </label>

                            <input
                                ref={tituloRef}
                                type="text"
                                id="titulo-r"
                                placeholder="Escribí el nombre de tu receta"
                                className={`receta-titulo ${errorTitulo ? 'input-error' : ''}`}
                                value={titulo}
                                onChange={(e) => {
                                    setTitulo(e.target.value);
                                    if (errorTitulo) setErrorTitulo("");
                                }}
                            />
                        </div>


                        <div className="modal-error-titulo">
                            {errorTitulo && (
                                <div className="error-container visible" role="alert">
                                    <i className="fas fa-exclamation-circle"></i>
                                    <p>{errorTitulo}</p>
                                </div>
                            )}
                        </div>

                        {/* Ingredientes y cantidades */}
                        <div className="div-cantidad-ingredientes-receta">

                            <div className="cabecera-ingredientes">
                                <label className="label-cantidad-ingrediente">
                                    Ingredientes y cantidades
                                </label>

                            </div>

                            <div className="lista-ingredientes-crear">

                                <div className="cabecera-fila-ingredientes">
                                    <span>Ingrediente</span>
                                    <span>Cantidad</span>
                                    <span></span>
                                </div>

                                {filasIngredientes.map((fila, index) => (
                                    <div className="fila-ingrediente-crear" key={index}>

                                        <input
                                            ref={(el) => ingredientesFilasRef.current[index] = el}
                                            type="text"
                                            placeholder="Ej. Harina"
                                            value={fila.nombre}
                                            className={`input-fila-ingrediente ${
                                                errorIngredientesCantidades ? 'input-error' : ''
                                            }`}
                                            onChange={(e) =>
                                                actualizarFilaIngrediente(index, "nombre", e.target.value)
                                            }
                                        />

                                        <input
                                            type="text"
                                            placeholder="Ej. 200 g"
                                            value={fila.cantidad}
                                            className={`input-fila-cantidad ${
                                                errorIngredientesCantidades ? 'input-error' : ''
                                            }`}
                                            onChange={(e) =>
                                                actualizarFilaIngrediente(index, "cantidad", e.target.value)
                                            }
                                        />

                                        {filasIngredientes.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn-quitar-ingrediente-crear"
                                                title="Eliminar ingrediente"
                                                onClick={() => quitarFilaIngrediente(index)}
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        )}

                                    </div>
                                ))}

                            </div>

                            <button
                                type="button"
                                className="btn-agregar-ingrediente-crear"
                                onClick={agregarFilaIngrediente}
                            >
                                <i className="fas fa-plus"></i>
                                Agregar ingrediente
                            </button>

                        </div>

                        <div className="modal-error-ingredientes-cantidades">
                            {errorIngredientesCantidades && (
                                <div className="error-container visible">
                                    <i className="fas fa-exclamation-circle"></i>
                                    <p>{errorIngredientesCantidades}</p>
                                </div>
                            )}
                        </div>

                        {/* Campos de los pasos */}
                        <div className="div-pasos-receta">

                             <div className="cabecera-pasos">
                                <h3>Preparación</h3>
                            </div>
                            <div id="pasosPanel" className="pasos-panel">
                                {pasos.map((paso, index) => (
                                    <div key={index} className="paso">
                                        <div className="paso-header">
                                            <label
                                                htmlFor={`paso${index + 1}`}
                                                className="label-pasos"
                                            >
                                                {String(index + 1).padStart(2, "0")}
                                            </label>

                                            <span className="paso-titulo">
                                                Paso {index + 1}
                                            </span>
                                        </div>

                                        <div className="paso-editor">
                                            <textarea
                                                ref={pasosRef}
                                                id={`paso${index + 1}`}
                                                className={`text-area-pasos ${
                                                    errorPasos && !paso.trim() ? 'input-error' : ''
                                                }`}
                                                placeholder="Escribí qué hacer en este paso..."
                                                value={paso}
                                                onChange={(e) => {
                                                    handlePasoChange(index, e.target.value);

                                                    const nuevosPasos = [...pasos];
                                                    nuevosPasos[index] = e.target.value;

                                                    if (nuevosPasos.every(paso => paso.trim())) {
                                                        setErrorPasos("");
                                                    }
                                                }}
                                                onInput={autoResize}
                                            />

                                            <label
                                            htmlFor={`filePaso${index}`}
                                            className="btn-subir-imagen"
                                            title="Agregar imagen al paso"
                                        >
                                            <i className="fas fa-image"></i>
                                            <span>Añadir imagen</span>
                                        </label>

                                            <input
                                                id={`filePaso${index}`}
                                                type="file"
                                                accept="image/*"
                                                className="input-file-oculto"
                                                onChange={(e) => manejarImagenPaso(index, e.target.files[0])}
                                            />
                                        </div>

                                        {imagenesPasosFiles[index]?.preview && (
                                            <img
                                                src={imagenesPasosFiles[index].preview}
                                                alt={`Vista previa del paso ${index + 1}`}
                                                className="preview-imagen-paso"
                                            />
                                        )}


                                    </div>
                                ))}
                            </div>


                            <div className="modal-error-paso">
                                {errorPasos && (
                                    <div className="error-container visible" role="alert">
                                        <i className="fas fa-exclamation-circle"></i>
                                        <p>{errorPasos}</p>
                                    </div>
                                )}
                            </div>
                            
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
                        <div className="seccion-imagen">

                            <div className="cabecera-imagen">
                                <h3>Imagen principal</h3>
                            </div>

                            <div className="div-imagen">

                                <div className="contenido-seleccion-imagen">
                                    <span>Seleccioná una imagen</span>

                                    <label
                                        htmlFor="imagen"
                                        className="btn-seleccionar-imagen"
                                    >
                                        <i className="fas fa-image"></i>
                                        <span>Elegir imagen</span>
                                    </label>
                                </div>

                                <input
                                    ref={imagenRef}
                                    type="file"
                                    id="imagen"
                                    name="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        previewImage(e);
                                        if (e.target.files[0]) {
                                            setErrorImagen("");
                                        }
                                    }}

                                    className={`input-imagen ${errorImagen ? 'input-error' : ''}`}
                                />


                                <div className="modal-error-imagen">
                                    {errorImagen && (
                                        <div className="error-container visible" role="alert">
                                            <i className="fas fa-exclamation-circle"></i>
                                            <p>{errorImagen}</p>
                                        </div>
                                    )}
                                </div>

                                <div className={`imagen-preview ${imagen ? 'visible' : ''}`}>
                                    {imagen && (
                                        <Cropper
                                            image={imagen}
                                            crop={crop}
                                            zoom={zoom}
                                            aspect={4 / 3}
                                            onCropChange={setCrop}
                                            onZoomChange={setZoom}
                                            onCropComplete={handleCropComplete}
                                            style={{
                                                width: '100%',
                                                height: '100%'
                                            }}
                                        />
                                    )}
                                </div>

                            </div>

                        </div>

                        
                        {/* Datos de la receta */}
                        <div className="detalles-receta">

                            <div className="campo-detalle-receta">
                                <label htmlFor="dificultad">
                                    Dificultad
                                </label>

                                <select
                                    ref={dificultadRef}
                                    id="dificultad"
                                    className={`select-detalle-receta ${
                                        errorDificultad ? 'input-error' : ''
                                    }`}
                                    value={dificultad}
                                    onChange={(e) => {
                                        setDificultad(e.target.value);
                                        if (errorDificultad) setErrorDificultad("");
                                    }}
                                >
                                    <option value="">Seleccione...</option>
                                    <option value="Fácil">Fácil</option>
                                    <option value="Intermedio">Intermedio</option>
                                    <option value="Difícil">Difícil</option>
                                </select>

                                <div className="error-detalle-receta">
                                    {errorDificultad && (
                                        <div className="error-container visible" role="alert">
                                            <i className="fas fa-exclamation-circle"></i>
                                            <p>{errorDificultad}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="campo-detalle-receta">
                                <label htmlFor="categoria">
                                    Categoría
                                </label>

                                <select
                                    ref={categoriaRef}
                                    id="categoria"
                                    className={`select-detalle-receta ${
                                        errorCategoria ? 'input-error' : ''
                                    }`}
                                    value={categoria}
                                    onChange={(e) => {
                                        setCategoria(e.target.value);
                                        if (errorCategoria) setErrorCategoria("");
                                    }}
                                >
                                    <option value="">Seleccione...</option>
                                    <option value="Desayuno/Merienda">Desayuno/Merienda</option>
                                    <option value="Almuerzo/Cena">Almuerzo/Cena</option>
                                    <option value="Brunch">Brunch</option>
                                    <option value="Bebida/trago">Bebida/Trago</option>
                                    <option value="Veggie">Veggie</option>
                                    <option value="Guarnición">Guarnición</option>
                                    <option value="Postre">Postre</option>
                                </select>


                                <div className="error-detalle-receta">
                                    {errorCategoria && (
                                        <div className="error-container visible" role="alert">
                                            <i className="fas fa-exclamation-circle"></i>
                                            <p>{errorCategoria}</p>
                                        </div>
                                    )}
                                </div>

                            </div>

                            <div className="campo-detalle-receta">
                                <label htmlFor="tiempoPreparacion">
                                    Tiempo de preparación (min)
                                </label>

                                <div className="control-tiempo-receta">
                                    <button
                                        id="btnQuitarTiempo"
                                        className="btn-tiempo"
                                        title="Quitar 1 minuto"
                                        onClick={quitarMinuto}
                                    >
                                        <i className="fas fa-minus"></i>
                                    </button>

                                    <input
                                        ref={tiempoPreparacionRef}
                                        type="text"
       
                                        id="tiempoPreparacion"
                                        className={`input-tiempo-receta ${
                                            errorTiempo ? 'input-error' : ''
                                        }`}
                                        value={tiempoPreparacion}
                                        onChange={(e) => {
                                            setTiempoPreparacion(e.target.value);
                                            if (errorTiempo) setErrorTiempo("");
                                        }}
                                    />


                                    <button
                                        id="btnAgregarTiempo"
                                        className="btn-tiempo"
                                        title="Agregar 1 minuto"
                                        onClick={agregarMinuto}
                                    >
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>


                                <div className="error-detalle-receta">
                                    {errorTiempo && (
                                        <div className="error-container visible" role="alert">
                                            <i className="fas fa-exclamation-circle"></i>
                                            <p>{errorTiempo}</p>
                                        </div>
                                    )}
                                </div>

                                
                            </div>

                        </div>

                        {/* Ingredientes */}
                        <div className="seccion-ingredientes-final">

                            <div className="cabecera-ingredientes-final">
                                <h3>Ingredientes</h3>
                            </div>

                            <div className="contenido-ingredientes-final">

                                <div className="input-ingredientes-wrap">
                                    <input
                                        ref={ingredientesRef}
                                        type="text"
                                        id="ingredientesInput"
                                        className={`input-ingredientes-final ${
                                            errorIngredientes ? 'input-error' : ''
                                        }`}
                                        placeholder="Harina, banana, leche..."
                                        name="ingredientes"
                                        value={ingredientes}
                                        onChange={(e) => {
                                            setIngredientes(e.target.value);
                                            if (errorIngredientes) setErrorIngredientes("");
                                        }}
                                    />

                                    <span className="ayuda-ingredientes-final">
                                        Separá por comas los ingredientes principales o palabras por las que quieras que encuentren tu receta.
                                    </span>
                                </div>

                            </div>



                            <div className="error-ingredientes-final">
                                {errorIngredientes && (
                                    <div className="error-container visible" role="alert">
                                        <i className="fas fa-exclamation-circle"></i>
                                        <p>{errorIngredientes}</p>
                                    </div>
                                )}
                            </div>


                        </div>

                        {/* Botón para guardar receta */}
                        <button
                            type="submit"
                            id="boton-enviar"
                            className="btn-guardar-receta"
                        >
                            <i className="fas fa-check"></i>
                            <span>Guardar receta</span>
                        </button>
                    </div>
                </form>

                {/* Cargando mientras se guardar una nueva receta */}
                {cargandoNuevaReceta && (
                    <div className="loading-new-recipe">
                        <div className="spinner"></div>
                        <p className="loading-message">Creando receta...</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CrearReceta;
