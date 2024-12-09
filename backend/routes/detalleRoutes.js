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
                populate: { path: 'usuario', select: 'nombre imagenPerfil' }
            });

        if (!receta) {
            return res.status(404).json({ mensaje: 'Receta no encontrada' });
        }

        const comentarios = receta.comentarios.map((comentario) => comentario.toObject());
        const comentariosRaiz = comentarios.filter((c) => !c.parentCommentId);
        const comentariosMap = new Map(comentarios.map((c) => [c._id.toString(), c]));

        comentariosRaiz.forEach((comentarioRaiz) => {
            comentarioRaiz.respuestas = comentarios.filter(
                (c) => c.parentCommentId?.toString() === comentarioRaiz._id.toString()
            );
        });

        comentarios.forEach((respuesta) => {
            if (respuesta.parentCommentId) {
                const parentComment = comentariosMap.get(respuesta.parentCommentId.toString());
                if (parentComment) {
                    respuesta.mencion = `@${parentComment.usuario.nombre}`;
                }
            }
        });

        res.json({ ...receta.toObject(), comentarios: comentariosRaiz });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cargar la receta', error });
    }
});

export default router;
