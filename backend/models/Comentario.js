//Comentario.js
import mongoose from 'mongoose';

const ComentarioSchema = new mongoose.Schema({
    comentario: {
         type: String, 
         required: true },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    receta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Receta',
        required: true
    },
    fecha: { 
        type: Date, 
        default: Date.now }
});

const Comentario = mongoose.model('Comentario', ComentarioSchema);
export default Comentario;

