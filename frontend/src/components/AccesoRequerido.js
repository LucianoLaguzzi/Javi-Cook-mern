import { useNavigate } from "react-router-dom";

const AccesoRequerido = () => {
    const navigate = useNavigate();

   return (
        <div className="acceso-requerido-container">
            <div className="acceso-requerido">
                
                <div className="acceso-icono">🔒</div>

                <h2>Acceso restringido</h2>

                <p>
                    Debes iniciar sesión<br />
                    para acceder a esta página
                </p>

                <button 
                    className="btn-login"
                    onClick={() => navigate("/login")}
                >
                    Iniciar sesión
                </button>

            </div>
        </div>
    );
};

export default AccesoRequerido;