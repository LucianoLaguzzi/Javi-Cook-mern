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
  const [cantidadIngrediente, setCantidadIngrediente] = useState("");
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
    const cantidadIngredienteRef = useRef();
    const pasosRef = useRef();
    const imagenRef = useRef();
    const dificultadRef = useRef();
    const categoriaRef = useRef();
    const tiempoPreparacionRef = useRef();
    const ingredientesRef = useRef();

    /* ------------------ PASOS ------------------ */

    // Función para manejar el cambio en cada textarea
    const hiddenInput = document.getElementById("inputOculto");

    const handlePasoChange = (index, value) => {
        const nuevosPasos = [...pasos];
        nuevosPasos[index] = value;
        setPasos(nuevosPasos);

        document.getElementById("inputOculto").value = nuevosPasos.join("\r\n");
  };

    const agregarPaso = (e) => {
        e.preventDefault();
        setPasos((prev) => [...prev, ""]);
        setImagenesPasosFiles((prev) => [...prev, null]);
    };

    const quitarPaso = (e) => {
        e.preventDefault();

        if (pasos.length > 1) {
            const nuevosPasos = pasos.slice(0, -1);
            setPasos((prev) => prev.slice(0, -1));
            setImagenesPasosFiles((prev) => prev.slice(0, -1));

            document.getElementById("inputOculto").value = nuevosPasos.join("\r\n");
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

            // Asegúrate de que ingredientesCantidades tenga el valor correcto
            const hiddenInputIngredientes = document.querySelector(".inputOcultoIngredientesCantidades");
            formData.append('ingredientesCantidades', hiddenInputIngredientes.value); // Asegúrate de que este valor se envíe correctamente
            
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

  // Función para manejar el cambio en el textarea de ingredientes y cantidades
    const actualizarIngredientesCantidades = (e) => {
        const value = e.target.value;
        setCantidadIngrediente(value); // Actualiza el estado

        // Actualiza el input oculto
        const hiddenInput = document.querySelector(".inputOcultoIngredientesCantidades");
        hiddenInput.value = value;  // Guardamos el valor del textarea en el input oculto
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
                <span className="close" title="Cerrar"  onClick={() => navigate("/inicio")}>
                    <i className="fas fa-times"></i>
                </span>

                <h2 id="titulo-modal">Agregar nueva receta</h2>

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

                                        <label htmlFor={`filePaso${index}`} className="btn-subir-imagen">
                                            📷 Agregar imagen
                                            </label>

                                            <input
                                            id={`filePaso${index}`}
                                            type="file"
                                            accept="image/*"
                                            className="input-file-oculto"
                                            onChange={(e) => manejarImagenPaso(index, e.target.files[0])}
                                        />

                                        {imagenesPasosFiles[index]?.preview && (
                                        <img
                                            src={imagenesPasosFiles[index].preview}
                                            alt="preview"
                                            className="preview-imagen-paso"
                                        />
                                        )}


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
