// detalleRoutes.js
import express from 'express';
import Receta from '../models/Receta.js';

const router = express.Router();

// Ruta para obtener receta por ID
router.get('/:id', async (req, res) => {
    try {
        const receta = await Receta.findById(req.params.id)
            .populate('usuario') // Población para el usuario de la receta
            .populate({
                path: 'comentarios',
                populate: [
                    { path: 'usuario', select: 'nombre imagenPerfil' },
                    { path: 'parentComment', select: 'comentario' },
                    // Agregar esta línea para las respuestas de cada comentario
                    { path: 'respuestas', populate: { path: 'usuario', select: 'nombre imagenPerfil' } }
                ]
            });

        if (!receta) {
            return res.status(404).json({ mensaje: 'Receta no encontrada' });
        }

        res.json(receta);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cargar la receta', error });
    }
});
export default router;
