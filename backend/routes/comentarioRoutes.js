import express from 'express';
import Comentario from '../models/Comentario.js'; // Asegúrate de que esté bien importado
import Receta from '../models/Receta.js';

const router = express.Router();


// Ruta para obtener una receta con sus comentarios
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




// Ruta para agregar un comentario o respuesta a una receta
router.post('/:id/comentarios', async (req, res) => {
    const { id } = req.params; // ID de la receta
    const { comentario, usuario, parentCommentId } = req.body; // Datos del comentario y respuesta

    try {
        // Buscar la receta por su ID
        const receta = await Receta.findById(id);
        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        // Crear un nuevo comentario (respuesta si hay parentCommentId)
        const nuevoComentario = new Comentario({
            comentario,
            usuario,
            receta: receta._id,
            fecha: new Date(),
            parentCommentId: parentCommentId || null // Si es respuesta, asigna el ID del comentario padre
        });

        // Guardar el comentario en la base de datos
        const comentarioGuardado = await nuevoComentario.save();

        // Agregar el ID del comentario al array de comentarios de la receta
        receta.comentarios.push(comentarioGuardado._id);
        await receta.save(); // Guardar la receta actualizada

        // Aquí hacemos un populate para incluir el usuario en el comentario
        const comentarioConUsuario = await Comentario.findById(comentarioGuardado._id)
            .populate('usuario', 'nombre imagenPerfil') // Aseguramos que se devuelvan estos campos
            .populate('parentCommentId'); // Poblar el comentario padre si existe

        // Devolver el comentario con la información del usuario
        res.status(201).json({ comentarioGuardado: comentarioConUsuario });
    } catch (error) {
        console.error('Error en el backend:', error);
        res.status(500).json({ message: 'Error al agregar el comentario' });
    }
});


// Ruta para editar un comentario
router.put('/:id/comentarios/:comentarioId', async (req, res) => {
    const { id, comentarioId } = req.params; // ID de la receta y del comentario
    const { comentario, usuario } = req.body; // Comentario editado y usuario en sesión

    try {
        // Buscar la receta por su ID
        const receta = await Receta.findById(id);
        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        // Buscar el comentario por su ID
        const comentarioExistente = await Comentario.findById(comentarioId);
        if (!comentarioExistente) {
            return res.status(404).json({ message: 'Comentario no encontrado' });
        }

        // Verificar que el usuario sea el autor del comentario
        if (comentarioExistente.usuario.toString() !== usuario) {
            return res.status(403).json({ message: 'No tienes permiso para editar este comentario' });
        }

        // Actualizar el comentario
        comentarioExistente.comentario = comentario;
        await comentarioExistente.save();

        // Poblar el usuario para devolverlo con la información actualizada
        const comentarioActualizado = await Comentario.findById(comentarioId)
            .populate('usuario', 'nombre imagenPerfil');

        res.json({ comentarioActualizado });
    } catch (error) {
        console.error('Error al editar el comentario:', error);
        res.status(500).json({ message: 'Error al editar el comentario' });
    }
});


// Ruta para editar una respuesta específica
router.put('/:id/comentarios/:comentarioId/respuestas/:respuestaId', async (req, res) => {
    const { id, comentarioId, respuestaId } = req.params; // ID de la receta, comentario y respuesta
    const { comentario, usuario } = req.body; // Comentario editado y usuario en sesión

    try {
        // Buscar la receta por su ID
        const receta = await Receta.findById(id);
        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        // Buscar el comentario padre
        const comentarioPadre = await Comentario.findById(comentarioId);
        if (!comentarioPadre) {
            return res.status(404).json({ message: 'Comentario padre no encontrado' });
        }

        // Verificar que la respuesta existe dentro de las respuestas del comentario
        const respuestaExistente = comentarioPadre.respuestas.find(
            (respuesta) => respuesta._id.toString() === respuestaId
        );
        if (!respuestaExistente) {
            return res.status(404).json({ message: 'Respuesta no encontrada' });
        }

        // Verificar que el usuario sea el autor de la respuesta
        if (respuestaExistente.usuario.toString() !== usuario) {
            return res.status(403).json({ message: 'No tienes permiso para editar esta respuesta' });
        }

        // Actualizar la respuesta
        respuestaExistente.comentario = comentario;
        await comentarioPadre.save();

        // Poblar el usuario de la respuesta actualizada para devolverla
        const respuestaActualizada = comentarioPadre.respuestas
            .find((respuesta) => respuesta._id.toString() === respuestaId);

        res.json({ comentarioActualizado: respuestaActualizada });
    } catch (error) {
        console.error('Error al editar la respuesta:', error);
        res.status(500).json({ message: 'Error al editar la respuesta' });
    }
});

// Ruta para editar una re-respuesta específica
router.put('/:id/comentarios/:comentarioId/respuestas/:respuestaId/rerespuestas/:rerespuestaId', async (req, res) => {
    const { id, comentarioId, respuestaId, rerespuestaId } = req.params; // ID de la receta, comentario, respuesta y re-respuesta
    const { comentario, usuario } = req.body; // Comentario editado y usuario en sesión

    try {
        // Buscar la receta por su ID
        const receta = await Receta.findById(id);
        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        // Buscar el comentario padre
        const comentarioPadre = await Comentario.findById(comentarioId);
        if (!comentarioPadre) {
            return res.status(404).json({ message: 'Comentario padre no encontrado' });
        }

        // Verificar que la respuesta existe dentro de las respuestas del comentario
        const respuestaPadre = comentarioPadre.respuestas.find(
            (respuesta) => respuesta._id.toString() === respuestaId
        );
        if (!respuestaPadre) {
            return res.status(404).json({ message: 'Respuesta no encontrada' });
        }

        // Verificar que la re-respuesta existe dentro de las respuestas anidadas
        const rerespuestaExistente = respuestaPadre.respuestas.find(
            (rerespuesta) => rerespuesta._id.toString() === rerespuestaId
        );
        if (!rerespuestaExistente) {
            return res.status(404).json({ message: 'Re-respuesta no encontrada' });
        }

        // Verificar que el usuario sea el autor de la re-respuesta
        if (rerespuestaExistente.usuario.toString() !== usuario) {
            return res.status(403).json({ message: 'No tienes permiso para editar esta re-respuesta' });
        }

        // Actualizar la re-respuesta
        rerespuestaExistente.comentario = comentario;
        await comentarioPadre.save();

        // Poblar el usuario de la re-respuesta actualizada para devolverla
        const rerespuestaActualizada = respuestaPadre.respuestas.find(
            (rerespuesta) => rerespuesta._id.toString() === rerespuestaId
        );

        res.json({ comentarioActualizado: rerespuestaActualizada });
    } catch (error) {
        console.error('Error al editar la re-respuesta:', error);
        res.status(500).json({ message: 'Error al editar la re-respuesta' });
    }
});


export default router;
