// detalleRoutes.js
import express from 'express';
import Receta from '../models/Receta.js';

const router = express.Router();

// Ruta para obtener receta por ID junto con los comentarios, respuestas y re-respuestas
router.get('/:id', async (req, res) => {
    try {
        const receta = await Receta.findById(req.params.id)
            .populate('usuario')
            .populate({ 
                path: 'comentarios',
                populate: { 
                    path: 'usuario',
                    select: 'nombre imagenPerfil'
                }
            });

        if (!receta) {
            return res.status(404).json({ mensaje: 'Receta no encontrada' });
        }

        // Crear un mapa para organizar comentarios y respuestas
        const comentarios = receta.comentarios.map((comentario) => comentario.toObject()); // Convierte a objetos planos
        const comentariosMap = new Map(comentarios.map((c) => [c._id.toString(), c]));
        const comentariosRaiz = [];

        comentarios.forEach((comentario) => {
            if (!comentario.parentCommentId) {
                // Si es un comentario raíz
                comentariosRaiz.push(comentario);
            } else {
                // Si es una respuesta o re-respuesta
                const parent = comentariosMap.get(comentario.parentCommentId.toString());
                if (parent) {
                    parent.respuestas = parent.respuestas || [];
                    parent.respuestas.push(comentario);
                }
            }
        });

        res.json({ ...receta.toObject(), comentarios: comentariosRaiz });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cargar la receta', error });
    }
});

export default router;
