// recetaRoutes.js
import express from 'express';
import multer from 'multer';
import fs from 'fs'; // Importamos el módulo fs para manejar el sistema de archivos 
import Receta from '../models/Receta.js'; // Ajusta la ruta al modelo
import Valoracion from  '../models/Valoracion.js';
import Comentario from  '../models/Comentario.js';
import Usuario from  '../models/Usuario.js';
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
  


// Aqui iba el multer
const upload = multer();


// ruta para crear una nueva receta con imagen
router.post('/', upload.none(), async (req, res) => {

    console.log('Apenas entro al backend, recibo en el body:', req.body); 

    try {
        const { titulo, ingredientesCantidades, pasos, imagen, dificultad, categoria, tiempoPreparacion, ingredientes, usuario } = req.body;
        // Validación de campos
        if (!titulo || !ingredientesCantidades || !pasos  ||  !imagen || !dificultad || !categoria || !tiempoPreparacion || !ingredientes) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }

        // Crear la receta con la URL de la imagen
        const nuevaReceta = new Receta({
            titulo,
            ingredientesCantidades,
            pasos,
            imagen, // Si se ha subido una imagen
            dificultad,
            categoria,
            tiempoPreparacion,
            ingredientes,
            usuario,
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
    const { pasos } = req.body;

    try {
        const recetaActualizada = await Receta.findByIdAndUpdate(
            id,
            { pasos },
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
        if (receta.imagen) {
            console.log('Intentando eliminar la imagen:', receta.imagen); // Imprime el valor
            await eliminarImagenCloudinary (receta.imagen);
        }
      
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
      // Extraer el `public_id` de la URL de Cloudinary
      const publicId = urlImagen.split('/').slice(-2).join('/').split('.')[0]; // Ejemplo: recetas/abc123
  
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




export default router;
