// detalleRoutes.js
import express from 'express';
import Receta from '../models/Receta.js';

const router = express.Router();

// Ruta para obtener receta por ID
router.get('/:id', async (req, res) => {
    try {
        const receta = await Receta.findById(req.params.id)
            .populate('usuario')
            .populate({
                path: 'comentarios',
                populate: { path: 'usuario', select: 'nombre imagenPerfil' }
            });

        if (!receta) return res.status(404).json({ mensaje: 'Receta no encontrada' });

        // Estructurar comentarios en forma de árbol
        const comentarios = receta.comentarios.reduce((tree, comentario) => {
            if (!comentario.parentCommentId) {
                tree.push({ ...comentario.toObject(), respuestas: [] });
            } else {
                const padre = tree.find(c => c._id.toString() === comentario.parentCommentId.toString());
                if (padre) padre.respuestas.push(comentario.toObject());
            }
            return tree;
        }, []);

        res.json({ ...receta.toObject(), comentarios });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cargar la receta', error });
    }
});
export default router;
