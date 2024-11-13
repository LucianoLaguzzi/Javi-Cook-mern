import mongoose from 'mongoose';

const RecetaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: false,
  },
  pasos: {
    type: [String], // Array de pasos de preparación
    required: true,
  },
  imagen: {
    type: String,
    required: true,
  },
  fecha: {
    type: Date,
    default: Date.now, // Fecha por defecto es la fecha actual
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario', // Referencia al modelo Usuario
    required: true,
  },
  categoria: {
    type: String,
    required: true,
  },
  ingredientes: {
    type: [String], // Array de ingredientes
    required: true,
  },
  valoracion: {
    type: Number,
    default: 0, // Valoración inicial
  },
  dificultad: {
    type: String,
    enum: ['Fácil', 'Intermedio', 'Difícil'], // Enum para las opciones de dificultad
    required: true,
  },
  tiempoPreparacion: {
    type: Number, // Tiempo de preparación en minutos
    required: true,
  },
  ingredientesCantidades: {
    type: [String], // Array que relaciona ingredientes con sus cantidades
    required: true,
  },
  usuariosFavoritos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario', // Referencia a los usuarios que marcan como favorito
  }],
  comentarios: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comentario'
}]
}, { timestamps: true }); // Agrega createdAt y updatedAt automáticamente





const Receta = mongoose.model('Receta', RecetaSchema);
export default Receta;
