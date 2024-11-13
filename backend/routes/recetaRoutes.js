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
  


// Verificar si la carpeta temporal existe, si no, crearla
// Configuración de multer para el almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/';
        
        // Verificar si la carpeta existe, si no la crea
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true }); // Crea la carpeta si no existe
        }

        cb(null, uploadPath); // Establece el directorio donde guardarás los archivos
    },
    filename: (req, file, cb) => {
        // Personaliza el nombre del archivo (puedes usar un timestamp o cualquier otra lógica)
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Crear el middleware de multer con la configuración de almacenamiento
const upload = multer({ storage });



// ruta para crear una nueva receta con imagen
router.post('/',  upload.single('file'), async (req, res) => {

    console.log('Apenas entro a el backend, recibo en el body:' + req.body); 

    try {

        
        const { titulo, ingredientesCantidades, pasos, dificultad, categoria, tiempoPreparacion, ingredientes, usuario } = req.body;


        // Validación de campos
        if (!titulo || !ingredientesCantidades || !pasos  || !dificultad || !categoria || !tiempoPreparacion || !ingredientes) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }

        // Aquí obtienes la URL de la imagen subiendo a Cloudinary
        const imagenURL = req.file ? `https://api.cloudinary.com/v1_1/dzaqvpxqk/image/upload/${req.file.filename}` : '';

        // Crear la receta con la URL de la imagen
        const nuevaReceta = new Receta({
            titulo,
            ingredientesCantidades,
            pasos,
            imagen:imagenURL, // Guardamos la URL de la imagen de Cloudinary
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
