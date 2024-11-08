// recetaRoutes.js
import express from 'express';
import multer from 'multer';
import fs from 'fs'; // Importamos el módulo fs para manejar el sistema de archivos 
import Receta from '../models/Receta.js'; // Ajusta la ruta al modelo
import Valoracion from  '../models/Valoracion.js';
import Comentario from  '../models/Comentario.js';
import path from 'path';

const router = express.Router();

// Obtener todas las recetas
router.get('/', async (req, res) => {
    try {
        const recetas = await Receta.find().populate('usuario');
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
  


// Verificamos si la carpeta 'uploads' existe, si no, la creamos
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir); // Crea la carpeta si no existe
}

// Configuración de multer para almacenar imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Carpeta donde se guardarán las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Nombre único del archivo
    }
});

const upload = multer({ storage });

// Ruta para crear una nueva receta con imagen
router.post('/', upload.single('imagen'), async (req, res) => {
    try {
        const { titulo, ingredientesCantidades, pasos, dificultad, categoria, tiempoPreparacion, ingredientes, usuario } = req.body;

        // Asegúrate de que ingredientesCantidades tenga un valor
        console.log("Ingredientes y Cantidades:", ingredientesCantidades);

        // El path de la imagen se puede acceder a través de req.file.path
        const nuevaReceta = new Receta({
            titulo,
            ingredientesCantidades,
            pasos,
            imagen: req.file.path, // Aquí guardamos el path de la imagen
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
      
        // Eliminar la imagen asociada a la receta si existe
        // Eliminar la imagen asociada
        if (receta.imagen) {
            console.log('Intentando eliminar la imagen:', receta.imagen); // Imprime el valor
            await eliminarImagen(receta.imagen);
        }
      
        // Finalmente, eliminar la receta
        await Receta.findByIdAndDelete(recetaId);
      
        res.status(200).json({ mensaje: 'Receta eliminada con éxito.' });
      } catch (error) {
        console.error('Error al eliminar la receta:', error);
        res.status(500).json({ mensaje: 'Hubo un problema al eliminar la receta.' });
      }
      
  });



// Función para eliminar una imagen del servidor
export const eliminarImagen = (rutaImagen) => {
    return new Promise((resolve, reject) => {
        const __dirname = path.resolve(); // Asegura la correcta referencia del directorio raíz
        const rutaCompleta = path.join(__dirname, rutaImagen); // Ruta completa a la imagen
    
        fs.unlink(rutaCompleta, (err) => {
            if (err) {
                console.error('Error al eliminar la imagen:', err);
                return reject(err);
            } else {
                console.log('Imagen eliminada con éxito.');
                return resolve();
            }
        });
    });
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
