import mongoose from 'mongoose';

const IngredienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  }
});

const Ingrediente = mongoose.model('Ingrediente', IngredienteSchema);
export default Ingrediente;
