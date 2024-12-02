import express from 'express';
import Comentario from '../models/Comentario.js'; // Asegúrate de que esté bien importado
import Receta from '../models/Receta.js';

const router = express.Router();


// Ruta para obtener una receta con sus comentarios
router.get('/:id', async (req, res) => {
    try {
        const receta = await Receta.findById(req.params.id)
            .populate({
                path: 'comentarios',
                populate: {
                    path: 'usuario',
                    model: 'Usuario',
                    select: 'nombre imagenPerfil'
                }
            });

        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        res.json(receta);
    } catch (error) {
        console.error('Error al obtener receta con comentarios:', error);
        res.status(500).json({ message: 'Error al obtener la receta' });
    }
});



// Ruta para agregar un comentario a una receta
// Ruta para agregar respuesta a un comentario
router.post('/:id/comentarios/:comentarioPadreId/respuestas', async (req, res) => {
    const { id, comentarioPadreId } = req.params;
    const { comentario, usuario } = req.body;

    try {
        const receta = await Receta.findById(id);
        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        const comentarioPadre = await Comentario.findById(comentarioPadreId);
        if (!comentarioPadre) {
            return res.status(404).json({ message: 'Comentario no encontrado' });
        }

        // Crear una nueva respuesta
        const nuevaRespuesta = new Comentario({
            comentario,
            usuario,
            receta: receta._id,
            fecha: new Date(),
            comentarioPadre: comentarioPadreId, // Referencia al comentario padre
        });

        const respuestaGuardada = await nuevaRespuesta.save();

        // Agregar la respuesta al array de respuestas del comentario padre
        comentarioPadre.respuestas.push(respuestaGuardada._id);
        await comentarioPadre.save();

        const respuestaConUsuario = await Comentario.findById(respuestaGuardada._id).populate('usuario', 'nombre imagenPerfil');

        res.status(201).json({ comentarioGuardado: respuestaConUsuario });
    } catch (error) {
        console.error('Error en el backend:', error);
        res.status(500).json({ message: 'Error al agregar la respuesta' });
    }
});


export default router;
