// detalleRoutes.js
import express from 'express';
import Receta from '../models/Receta.js';

const router = express.Router();

// Ruta para obtener receta por ID junto con los comentarios y respuestas
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

       // Función recursiva para construir el árbol de comentarios
const construirArbolComentarios = (comentarios, parentId = null) => {
    return comentarios
        .filter((comentario) => comentario.parentCommentId?.toString() === parentId?.toString())
        .map((comentario) => ({
            ...comentario,
            respuestas: construirArbolComentarios(comentarios, comentario._id),
        }));
};

// Construir el árbol de comentarios comenzando desde los padres
const comentariosArbol = construirArbolComentarios(comentarios);

res.json({ ...receta.toObject(), comentarios: comentariosArbol });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cargar la receta', error });
    }
});

export default router;
