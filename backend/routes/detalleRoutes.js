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
        const comentariosMap = new Map(comentarios.map((c) => [c._id.toString(), c])); //Este tiene todos los comentarios/respuestas con sus id como clave
        const comentariosRaiz = []; //Este contiene solo los comentarios padre

        comentarios.forEach((comentario) => {
            if (!comentario.parentCommentId) {
                // Como no tiene parentCommentId, entonces es padre y se agrega al array comentariosRaiz
                comentariosRaiz.push(comentario);
            } else {
                // Si es una respuesta o re-respuesta, busca quien es el padre en el array q tiene todos los datos, por la clave parentCommentId.
                const parent = comentariosMap.get(comentario.parentCommentId.toString());
                // Si tiene padre, lo agrega al array de las respuestas de ese padre, en el primer caso, como respuestas no tiene nada y no existe, va a crearlo [].
                if (parent) {
                    parent.respuestas = parent.respuestas || [];
                     // Luego como ya existe, solo hace  parent.respuestas = parent.respuestas y lo asigna al proximo con push.
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
