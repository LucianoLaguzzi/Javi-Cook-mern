import express from 'express';
import Comentario from '../models/Comentario.js'; // Asegúrate de que esté bien importado
import Receta from '../models/Receta.js';

const router = express.Router();


// Ruta para obtener una receta con sus comentarios
router.get('/:id', async (req, res) => {
    try {
        const receta = await Receta.findById(req.params.id)
            .populate({
                path: 'comentarios',
                populate: {
                    path: 'usuario',
                    model: 'Usuario',
                    select: 'nombre imagenPerfil'
                }
            });

        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        res.json(receta);
    } catch (error) {
        console.error('Error al obtener receta con comentarios:', error);
        res.status(500).json({ message: 'Error al obtener la receta' });
    }
});



// Ruta para agregar un comentario a una receta
router.post('/:id/comentarios', async (req, res) => {
    const { id } = req.params; // ID de la receta
    const { comentario, usuario } = req.body; // Datos del comentario

    try {
        // Buscar la receta por su ID
        const receta = await Receta.findById(id);
        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        // Crear un nuevo comentario
        const nuevoComentario = new Comentario({
            comentario,
            usuario: usuario, // Asegúrate de guardar el ObjectId del usuario
            receta: receta._id,
            fecha: new Date(),
        });

        // Guardar el comentario en la base de datos
        const comentarioGuardado = await nuevoComentario.save();

        // Agregar el ID del comentario al array de comentarios de la receta
        receta.comentarios.push(comentarioGuardado._id);
        await receta.save(); // Guardar la receta actualizada

        // Recuperar el comentario guardado con los datos del usuario
        const comentarioConUsuario = await Comentario.findById(comentarioGuardado._id).populate('usuario', 'nombre imagenPerfil');

        res.status(201).json({ comentarioGuardado: comentarioConUsuario }); // Devolver el comentario guardado
    } catch (error) {
        console.error('Error en el backend:', error);
        res.status(500).json({ message: 'Error al agregar el comentario' });
    }
});


// Ruta para agregar una respuesta a un comentario específico
router.post('/:id/comentarios/:comentarioId/respuestas', async (req, res) => {
    const { id, comentarioId } = req.params;
    const { comentario, usuario } = req.body;

    try {
        // Buscar la receta
        const receta = await Receta.findById(id);
        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        // Buscar el comentario al que se le responderá
        const comentarioPadre = await Comentario.findById(comentarioId);
        if (!comentarioPadre) {
            return res.status(404).json({ message: 'Comentario no encontrado' });
        }

        // Crear una nueva respuesta (comentario)
        const nuevaRespuesta = new Comentario({
            comentario,
            usuario,
            receta: receta._id,
            fecha: new Date(),
        });

        // Guardar la nueva respuesta
        const respuestaGuardada = await nuevaRespuesta.save();

        // Agregar la respuesta al campo "respuestas" del comentario original
        comentarioPadre.respuestas.push(respuestaGuardada._id);
        await comentarioPadre.save();

        // Recuperar el comentario con las respuestas del usuario
        const comentarioConRespuestas = await Comentario.findById(respuestaGuardada._id).populate('usuario', 'nombre imagenPerfil');

        res.status(201).json({ comentarioGuardado: comentarioConRespuestas }); // Devolver la respuesta guardada
    } catch (error) {
        console.error('Error al agregar la respuesta:', error);
        res.status(500).json({ message: 'Error al agregar la respuesta' });
    }
});

export default router;
