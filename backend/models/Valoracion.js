import mongoose from 'mongoose';


const ValoracionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario', // Relaciona la valoración con el usuario que la hizo
    required: true
  },
  receta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Receta', // Relaciona la valoración con la receta valorada
    required: true
  },
  valor: {
    type: Number,
    required: true,
    min: 1,
    max: 5 // Valoración de 1 a 5 estrellas
  },
}, { timestamps: true });

const Valoracion = mongoose.model('Valoracion', ValoracionSchema);
export default Valoracion;
