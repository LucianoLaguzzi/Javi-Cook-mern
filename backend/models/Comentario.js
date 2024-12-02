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
        default: Date.now},

    comentarioPadre: {  // Agregar este campo
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comentario',
        default: null  // Si es un comentario normal, será null
    }
    
});



const Comentario = mongoose.model('Comentario', ComentarioSchema);
export default Comentario;

