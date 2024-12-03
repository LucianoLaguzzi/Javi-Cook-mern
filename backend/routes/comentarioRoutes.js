import express from 'express';
import Comentario from '../models/Comentario.js'; // Asegúrate de que esté bien importado
import Receta from '../models/Receta.js';

const router = express.Router();


// Ruta para obtener una receta con sus comentarios
router.get('/:id', async (req, res) => {
    try {
        const receta = await Receta.findById(req.params.id)
            .populate('usuario')
            .populate({
                path: 'comentarios',
                match: { parentComment: null }, // Solo comentarios principales
                populate: [
                    { path: 'usuario', select: 'nombre imagenPerfil' },
                    { 
                        path: 'respuestas', // Respuestas anidadas
                        populate: { path: 'usuario', select: 'nombre imagenPerfil' }
                    }
                ],
            });

        if (!receta) {
            return res.status(404).json({ mensaje: 'Receta no encontrada' });
        }

        res.json(receta);
    } catch (error) {
        console.error('Error al cargar la receta:', error);
        res.status(500).json({ mensaje: 'Error al cargar la receta', error });
    }
});



// Ruta para agregar un comentario a una receta
router.post('/:id/comentarios', async (req, res) => {
    const { id } = req.params; // ID de la receta
    const { comentario, usuario, parentComment } = req.body; // Datos del comentario

    try {
        const receta = await Receta.findById(id);
        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        const nuevoComentario = new Comentario({
            comentario,
            usuario,
            receta: receta._id,
            parentComment: parentComment || null, // Si no hay parentComment, es comentario principal
        });

        const comentarioGuardado = await nuevoComentario.save();

        // Agregar solo comentarios principales al array de la receta
        if (!parentComment) {
            receta.comentarios.push(comentarioGuardado._id);
            await receta.save();
        }

        if (parentComment) {
            const comentarioPadre = await Comentario.findById(parentComment);
            comentarioPadre.respuestas.push(comentarioGuardado._id);
            await comentarioPadre.save();
        }

        const comentarioConUsuario = await Comentario.findById(comentarioGuardado._id)
        .populate('usuario', 'nombre imagenPerfil')
        .populate({
            path: 'parentComment',
            populate: { path: 'usuario', select: 'nombre imagenPerfil' },
        });

        res.status(201).json({ comentarioGuardado: comentarioConUsuario });
    } catch (error) {
        console.error('Error al agregar comentario:', error);
        res.status(500).json({ message: 'Error al agregar comentario' });
    }
});


export default router;
