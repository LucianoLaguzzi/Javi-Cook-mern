// detalleRoutes.js
import express from 'express';
import Receta from '../models/Receta.js';

const router = express.Router();

// Ruta para obtener receta por ID
// Ruta para obtener receta por ID
router.get('/:id', async (req, res) => {
    try {
        // Verificar si la receta existe
        const receta = await Receta.findById(req.params.id)
            .populate('usuario') // Popula el usuario que creó la receta
            .populate({ 
                path: 'comentarios', 
                populate: { 
                    path: 'usuario', // Popula el usuario de cada comentario
                    select: 'nombre imagenPerfil' // Campos específicos
                },
                options: { sort: { 'fecha': 1 } } // Ordenar los comentarios por fecha
            });

        if (!receta) {
            return res.status(404).json({ mensaje: 'Receta no encontrada' });
        }

        // Cargar respuestas a los comentarios, si existen
        const comentariosConRespuestas = await Comentario.find({
            receta: receta._id,
            parentCommentId: { $ne: null } // Solo las respuestas, no comentarios principales
        }).populate('usuario', 'nombre imagenPerfil');

        // Agregar las respuestas a sus comentarios correspondientes
        receta.comentarios.forEach(comentario => {
            comentario.respuestas = comentariosConRespuestas.filter(respuesta => respuesta.parentCommentId.toString() === comentario._id.toString());
        });

        // Devolver receta con comentarios y respuestas
        res.json(receta);
    } catch (error) {
        console.error('Error al cargar la receta', error); // Log de error para depuración
        res.status(500).json({ mensaje: 'Error al cargar la receta', error });
    }
});

export default router;
