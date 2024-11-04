import mongoose from 'mongoose';

const TokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Usuario'
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // El token expirará en una hora
    }
});

const Token = mongoose.model('Token', TokenSchema);
export default Token;