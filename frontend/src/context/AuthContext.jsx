import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
const [usuario, setUsuario] = useState(null);

useEffect(() => {
const token = localStorage.getItem("token");
const nombre = localStorage.getItem("nombre");
const rol = localStorage.getItem("rol");
if (token) {
  setUsuario({ token, nombre, rol });
}
}, []);

const login = (data) => {
localStorage.setItem("token", data.access_token);
localStorage.setItem("nombre", data.nombre);
localStorage.setItem("rol", data.rol);
setUsuario({
token: data.access_token,
nombre: data.nombre,
rol: data.rol,
});
};

const logout = () => {
localStorage.removeItem("token");
localStorage.removeItem("nombre");
localStorage.removeItem("rol");
setUsuario(null);
};

return (
<AuthContext.Provider value={{ usuario, login, logout }}>
{children}
</AuthContext.Provider>
);
}

export function useAuth() {
return useContext(AuthContext);
}
