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
// Ruta para editar un comentario
router.put('/:id/comentarios/:comentarioId', async (req, res) => {
    const { comentarioId } = req.params;
    const { nuevoTexto, usuarioId } = req.body;

    try {
        // Buscar el comentario
        const comentario = await Comentario.findById(comentarioId);
        if (!comentario) {
            return res.status(404).json({ mensaje: 'Comentario no encontrado' });
        }

        // Verificar si el usuario actual es el autor
        if (comentario.usuario.toString() !== usuarioId) {
            return res.status(403).json({ mensaje: 'No tienes permiso para editar este comentario' });
        }

        // Actualizar el comentario
        comentario.comentario = nuevoTexto;
        comentario.fechaEditado = new Date();
        await comentario.save();

        // Retornar el comentario actualizado completamente poblado
        const comentarioActualizado = await Comentario.findById(comentarioId)
            .populate('usuario', 'nombre imagenPerfil') // Poblamos el usuario con los campos necesarios
            .populate({
                path: 'respuestas', // Poblamos las respuestas
                populate: {
                    path: 'usuario', // Y los usuarios dentro de las respuestas
                    select: 'nombre imagenPerfil',
                },
            });

        res.json({ comentarioActualizado });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al editar el comentario', error });
    }
});

export default router;
