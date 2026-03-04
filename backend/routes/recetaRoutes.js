// recetaRoutes.js
import express from 'express';
import multer from 'multer';
import fs from 'fs'; // Importamos el módulo fs para manejar el sistema de archivos 
import Receta from '../models/Receta.js'; // Ajusta la ruta al modelo
import Valoracion from  '../models/Valoracion.js';
import Comentario from  '../models/Comentario.js';
import Usuario from  '../models/Usuario.js';
import Notificacion from '../models/Notificacion.js';
import path from 'path';
import cloudinary from 'cloudinary';

const router = express.Router();

// Obtener todas las recetas
router.get('/', async (req, res) => {
    try {
        const recetas = await Receta.find().populate('usuario').sort({ createdAt: -1});
        res.status(200).json(recetas);
    } catch (error) {
        console.error("Error al cargar recetas", error);
        res.status(500).json({ mensaje: "Error al cargar recetas", error });
    }
});

// Ruta para obtener las recetas de un usuario por su ID
router.get('/usuario/:id', async (req, res) => {
    const usuarioId = req.params.id;

    try {
        // Busca todas las recetas cuyo campo "usuario" coincida con el ID del usuario logueado
        const recetas = await Receta.find({ usuario: usuarioId }).populate('usuario');
        
        // Devolver las recetas como respuesta
        res.status(200).json(recetas);
    } catch (error) {
        console.error('Error al obtener las recetas del usuario:', error);
        res.status(500).json({ mensaje: 'Error al obtener las recetas del usuario.' });
    }
});
  



const upload = multer();


// ruta para crear una nueva receta con imagen
router.post('/', upload.none(), async (req, res) => {

    console.log('Apenas entro al backend, recibo en el body:', req.body); 

    try {
        const { titulo, ingredientesCantidades, pasos, imagen, dificultad, categoria, tiempoPreparacion, ingredientes, usuario,imagenesPasos } = req.body;

        // ✅ convertir los pasos que vienen como string en array real
        let pasosArray = [];

        if (typeof pasos === 'string') {
            pasosArray = pasos
                .split(/\r?\n/)      // separa por saltos de línea (Windows o Unix)
                .map(p => p.trim()); // limpia espacios
        } else if (Array.isArray(pasos)) {
            pasosArray = pasos;
        }

        // 👇👇👇 AGREGAR ESTO
        let imagenesPasosArray = [];

        if (imagenesPasos) {
            try {
                imagenesPasosArray = JSON.parse(imagenesPasos);
            } catch (error) {
                console.error('Error parseando imagenesPasos:', error);
                imagenesPasosArray = [];
            }
        }



        // Validación de campos
        if (!titulo || !ingredientesCantidades || !pasos  ||  !imagen || !dificultad || !categoria || !tiempoPreparacion || !ingredientes) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }




        // Crear la receta con la URL de la imagen
        const nuevaReceta = new Receta({
            titulo,
            ingredientesCantidades,
            pasos: pasosArray,
            imagen, // Si se ha subido una imagen
            dificultad,
            categoria,
            tiempoPreparacion,
            ingredientes,
            usuario,
            imagenesPasos: imagenesPasosArray,
        });

        const recetaGuardada = await nuevaReceta.save();

        // Poblar el campo 'usuario' para obtener toda la información del usuario
        const recetaConUsuario = await Receta.findById(recetaGuardada._id).populate('usuario');

        res.status(201).json(recetaConUsuario);
    } catch (error) {
        console.error("Error al crear receta", error);
        res.status(400).json({ mensaje: "Error al crear receta", error });
    }
});


// Ruta para actualizar el título de una receta
router.put('/:id/titulo', async (req, res) => {
    const { id } = req.params;
    const { titulo } = req.body;

    try {
        // Buscar la receta por ID y actualizar el título
        const recetaActualizada = await Receta.findByIdAndUpdate(
            id, 
            { titulo }, 
            { new: true } //Devuelve el documento actualizado de la bd, sin esto seguro traeria el anterior, sin actualizar.
        );

        if (!recetaActualizada) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        res.json(recetaActualizada); // Devolver la receta actualizada
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la receta' });
    }
});



// Ruta para actualizar la cantidad de ingredientes de una receta
router.put('/:id/ingredientesCantidades', async (req, res) => {
    const { id } = req.params;
    const { ingredientesCantidades } = req.body;

    try {
        // Buscar la receta por ID y actualizar la cantidad de ingredientes
        const recetaActualizada = await Receta.findByIdAndUpdate(
            id, 
            { ingredientesCantidades }, 
            { new: true }
        );

        if (!recetaActualizada) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        res.json(recetaActualizada); // Devolver la receta actualizada
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la receta' });
    }
});


// Ruta para actualizar los pasos de una receta
router.put('/:id/pasos', async (req, res) => {
  const { id } = req.params;
  const { pasos, imagenesPasos, imagenesAEliminar } = req.body;

  try {
    const receta = await Receta.findById(id);

    if (!receta) {
      return res.status(404).json({ message: 'Receta no encontrada' });
    }

    // 🧹 1. Eliminar imágenes viejas SOLO si existen
    if (imagenesAEliminar && imagenesAEliminar.length > 0) {
      for (const url of imagenesAEliminar) {
        if (url) { // 🔥 importante para no romper Cloudinary
          await eliminarImagenCloudinary(url);
        }
      }
    }

    // 🧼 2. Limpiar array de imágenes (Mongo NO quiere undefined)
    let imagenesLimpias = [];

    if (Array.isArray(imagenesPasos)) {
    imagenesLimpias = imagenesPasos.map(img => img || null);
    }

    // 💾 3. Guardar receta
    // 🧠 Normalizar pasos para que SIEMPRE sea array
    let pasosNormalizados = [];

    if (Array.isArray(pasos)) {
        pasosNormalizados = pasos;
        } else if (typeof pasos === 'string') {
        pasosNormalizados = pasos.split('\n').map(p => p.trim());
    }

    receta.pasos = pasosNormalizados;
    receta.imagenesPasos = imagenesLimpias;

    await receta.save();

    res.json(receta);

  } catch (error) {
    console.error("Error actualizando pasos:", error);
    res.status(500).json({ message: 'Error al actualizar la receta' });
  }
});




// Ruta para eliminar una receta
router.delete('/:recetaId', async (req, res) => {
    const { recetaId } = req.params;
    const { usuarioId } = req.body;
  
    try {
        const receta = await Receta.findById(recetaId);
        if (!receta) {
          return res.status(404).json({ mensaje: 'Receta no encontrada.' });
        }
      
        if (receta.usuario.toString() !== usuarioId) {
          return res.status(403).json({ mensaje: 'No tienes permiso para eliminar esta receta.' });
        }
      
        // Eliminar valoraciones asociadas a la receta
        await Valoracion.deleteMany({ receta: recetaId });
      
        // Eliminar comentarios asociados a la receta
        await Comentario.deleteMany({ receta: recetaId });

        // Eliminar la receta de los favoritos de los usuarios
        await Usuario.updateMany(
            { recetasFavoritas: recetaId }, // Busca usuarios que tengan esta receta en sus favoritos
            { $pull: { recetasFavoritas: recetaId } } // Elimina la receta de la lista de favoritos
        );
      
        // Eliminar la imagen asociada a la receta si existe
       // 🖼️ Eliminar imagen principal
        if (receta.imagen) {
            console.log('Eliminando imagen principal:', receta.imagen);
            await eliminarImagenCloudinary(receta.imagen);
        }

        // 🖼️ Eliminar imágenes de los pasos
        if (receta.imagenesPasos && receta.imagenesPasos.length > 0) {
            console.log('Eliminando imágenes de pasos...');

            for (const url of receta.imagenesPasos) {
                if (!url) continue; // salta null

                try {
                    await eliminarImagenCloudinary(url);
                } catch (err) {
                    console.error('Error eliminando imagen de paso:', url, err);
                }
            }
        }

        // Eliminar las notificaciones asociadas a esta receta
        await Notificacion.deleteMany({ enlace: { $regex: recetaId, $options: 'i' } });

        // Finalmente, eliminar la receta
        await Receta.findByIdAndDelete(recetaId);
      
        res.status(200).json({ mensaje: 'Receta eliminada con éxito.' });
    } catch (error) {
        console.error('Error al eliminar la receta:', error);
        res.status(500).json({ mensaje: 'Hubo un problema al eliminar la receta.' });
    }
      
});



// Función para eliminar la imagen en cloudinary
const eliminarImagenCloudinary = async (urlImagen) => {
    try {
           if (!urlImagen) return;

        // 🔥 obtener todo lo que viene después de /upload/
        const partes = urlImagen.split('/upload/')[1];

        // quitar versión si existe (v123456/)
        const sinVersion = partes.replace(/^v\d+\//, '');



      // Extraer el `public_id` de la URL de Cloudinary
      //Separa la url por cada "/" con el split, luego toma los ultimos 2 elementos del array y los une (join) con un "/", 
      //es decir: recetas/[nombreReceta] y luego con split separa la extension, tomando la primer parte sin el .jpg ya q la publicId no lo necesita.
       const publicId = sinVersion.substring(0, sinVersion.lastIndexOf('.'));
  
       console.log('Eliminando en Cloudinary:', publicId);

       await cloudinary.uploader.destroy(publicId);
      console.log('Imagen eliminada con éxito de Cloudinary.');
    } catch (error) {
      console.error('Error al eliminar la imagen de Cloudinary:', error);
      throw error;
    }
};


//Top 3
// recetaRoutes.js
router.get('/top3', async (req, res) => {
    try {
        const recetas = await Receta.find({ valoracion: { $gt: 0 } }).populate('usuario')  // Solo recetas valoradas
            .sort({ valoracion: -1, fecha: -1 })  // Orden por valoración y luego por fecha
            .limit(3);  // Limitar a 3

        res.json(recetas);
    } catch (error) {
        console.error('Error al obtener el top 3 de recetas:', error);
        res.status(500).send('Error al obtener el top 3 de recetas');
    }
});


//Obtener receta altearoia por categoria
router.get('/random/:categoria', async (req, res) => {
    try {
        const { categoria } = req.params;
        const recetas = await Receta.find({ categoria });

        if (recetas.length === 0) {
            return res.status(200).json({ message: 'No hay recetas disponibles en esta categoría.' });
        }

        // Seleccionar receta aleatoria
        const recetaAleatoria = recetas[Math.floor(Math.random() * recetas.length)];
        res.json(recetaAleatoria);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener receta aleatoria.' });
    }
});


// Reemplazar imagen principal de una receta
router.put('/:id/imagen', async (req, res) => {
  try {
    const { nuevaImagen } = req.body;

    if (!nuevaImagen) {
      return res.status(400).json({ mensaje: 'No se envió nueva imagen' });
    }

    const receta = await Receta.findById(req.params.id);
    if (!receta) {
      return res.status(404).json({ mensaje: 'Receta no encontrada' });
    }

    // 🔴 BORRAR imagen anterior de Cloudinary
    if (receta.imagen) {
      try {
        const url = receta.imagen;

        // obtener public_id desde la URL guardada
        const partes = url.split('/upload/')[1]; 
        const sinVersion = partes.replace(/^v\d+\//, '');
        const publicId = sinVersion.split('.')[0];

        await cloudinary.v2.uploader.destroy(publicId);
      } catch (err) {
        console.log('No se pudo borrar imagen anterior:', err.message);
      }
    }

    // 🟢 Guardar nueva URL
    receta.imagen = nuevaImagen;
    await receta.save();

    res.json({ imagen: receta.imagen });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error actualizando imagen' });
  }
});




export default router;
