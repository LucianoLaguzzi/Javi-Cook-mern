// detalleRoutes.js
import express from 'express';
import Receta from '../models/Receta.js';

const router = express.Router();

// Ruta para obtener receta por ID
router.get('/:id', async (req, res) => {
    try {
        const receta = await Receta.findById(req.params.id)
            .populate('usuario')  // Agrega el usuario de la receta
            .populate({
                path: 'comentarios',
                populate: [
                    { path: 'usuario', select: 'nombre imagenPerfil' },  // Usuario del comentario
                    { path: 'parentComment', select: 'comentario' },  // Comentario original (para respuestas)
                    {
                        path: 'respuestas',  // Respuestas del comentario
                        populate: [
                            { path: 'usuario', select: 'nombre imagenPerfil' },  // Usuario de la respuesta
                        ]
                    }
                ]
            });

        if (!receta) {
            return res.status(404).json({ mensaje: 'Receta no encontrada' });
        }

        res.json(receta);  // Devuelve la receta con comentarios y respuestas
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cargar la receta', error });
    }
});

export default router;
