import { Link, Outlet, useNavigate } from 'react-router-dom'
import { cerrarSesion, obtenerUsuarioGuardado } from '../services/authService'

export function Layout() {
    const navigate = useNavigate()
    const usuario = obtenerUsuarioGuardado()

    function handleCerrarSesion() {
        cerrarSesion()
        navigate('/login')
    }

    return (
        <>
            <header>
                <nav>
                    <Link to="/">Inicio</Link>

                    {usuario?.rol === 'PACIENTE' && (
                        <Link to="/perfil">Mi perfil</Link>
                    )}

                    <Link to="/mi-cuenta">Mi cuenta</Link>

                    <Link to="/estudios">Estudios</Link>
                    <Link to="/agendas">Agendas</Link>
                    <Link to="/profesionales">Profesionales</Link>
                    <Link to="/turnos">Turnos</Link>

                    {/* Enlace al módulo de autorizaciones */}
                    {(usuario?.rol === 'ADMIN' ||
                        usuario?.rol === 'PROFESIONAL' ||
                        usuario?.rol === 'PACIENTE') && (
                        <Link to="/autorizaciones">Autorizaciones</Link>
                    )}

                    {usuario?.rol === 'ADMIN' && (
                        <>
                            <Link to="/usuarios">Usuarios</Link>
                            <Link to="/pacientes">Pacientes</Link>
                        </>
                    )}

                    <button type="button" onClick={handleCerrarSesion}>
                        Cerrar sesión
                    </button>
                </nav>
            </header>

            <Outlet />
        </>
    )
}
