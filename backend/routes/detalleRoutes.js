// detalleRoutes.js
import express from 'express';
import Receta from '../models/Receta.js';

const router = express.Router();

// Ruta para obtener receta por ID
router.get('/:id', async (req, res) => {
    try {
        const receta = await Receta.findById(req.params.id)
            .populate('usuario') // Popula el usuario que creó la receta
            .populate({ 
                path: 'comentarios', 
                populate: { 
                    path: 'usuario', // Popula el usuario de cada comentario
                    select: 'nombre imagenPerfil' // Puedes seleccionar los campos que quieres del usuario
                }
            })
            .populate({
                path: 'comentarios.respuestas', // Aquí solo se hace un populate para las respuestas de cada comentario
                populate: {
                    path: 'usuario', // Popula el usuario de cada respuesta
                    select: 'nombre imagenPerfil'
                }
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
