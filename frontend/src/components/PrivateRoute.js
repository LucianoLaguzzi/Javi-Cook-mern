import AccesoRequerido from "./AccesoRequerido";

const PrivateRoute = ({ children }) => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
        return <AccesoRequerido />;
    }

    return children;
};

export default PrivateRoute;