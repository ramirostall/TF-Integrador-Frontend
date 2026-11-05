import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    desactivarUsuario,
    listarUsuarios,
    reactivarUsuario,
} from '../../services/usuarioService'
import type { Usuario } from '../../types/usuario'
import { obtenerMensajeError } from '../../utils/errores'

const ELEMENTOS_POR_PAGINA = 10

export function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(true)
    const [procesandoId, setProcesandoId] = useState<number | null>(null)
    const [busqueda, setBusqueda] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)

    useEffect(() => {
        async function cargarUsuarios() {
            try {
                const datos = await listarUsuarios()
                setUsuarios(datos)
            } catch (error) {
                setError(
                    obtenerMensajeError(
                        error,
                        'No se pudieron cargar los usuarios.',
                    ),
                )
            } finally {
                setCargando(false)
            }
        }

        cargarUsuarios()
    }, [])

    const usuariosFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase()

        if (!termino) {
            return usuarios
        }

        return usuarios.filter((usuario) => {
            const email = usuario.email?.toLowerCase() ?? ''
            const rol = usuario.rol?.toLowerCase() ?? ''
            const estado = usuario.activo ? 'activo' : 'inactivo'

            return (
                email.includes(termino) ||
                rol.includes(termino) ||
                estado.includes(termino) ||
                String(usuario.id).includes(termino)
            )
        })
    }, [usuarios, busqueda])

    const totalPaginas = Math.max(
        1,
        Math.ceil(usuariosFiltrados.length / ELEMENTOS_POR_PAGINA),
    )

    const paginaSegura = Math.min(paginaActual, totalPaginas)

    const usuariosPaginados = useMemo(() => {
        const inicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA
        const fin = inicio + ELEMENTOS_POR_PAGINA

        return usuariosFiltrados.slice(inicio, fin)
    }, [usuariosFiltrados, paginaSegura])

    async function handleCambiarEstado(usuario: Usuario) {
        setError('')
        setMensaje('')
        setProcesandoId(usuario.id)

        try {
            const actualizado = usuario.activo
                ? await desactivarUsuario(usuario.id)
                : await reactivarUsuario(usuario.id)

            setUsuarios((actuales) =>
                actuales.map((item) =>
                    item.id === actualizado.id ? actualizado : item,
                ),
            )

            setMensaje(
                actualizado.activo
                    ? 'Usuario reactivado correctamente.'
                    : 'Usuario desactivado correctamente.',
            )
        } catch (error) {
            setError(
                obtenerMensajeError(
                    error,
                    'No se pudo cambiar el estado del usuario.',
                ),
            )
        } finally {
            setProcesandoId(null)
        }
    }

    return (
        <main>
            <h1>Usuarios</h1>

            <p>
                <Link to="/usuarios/nuevo">Crear usuario</Link>
            </p>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {mensaje && <p className="mensaje-exito">{mensaje}</p>}

            {!cargando && usuarios.length > 0 && (
                <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                    <input
                        type="search"
                        placeholder="Buscar por ID, email, rol o estado..."
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value)
                            setPaginaActual(1)
                        }}
                        aria-label="Buscar usuarios"
                        style={{ maxWidth: '320px' }}
                    />
                </div>
            )}

            {cargando ? (
                <p>Cargando usuarios...</p>
            ) : usuarios.length === 0 ? (
                <p>No hay usuarios registrados.</p>
            ) : usuariosFiltrados.length === 0 ? (
                <p>No se encontraron usuarios con ese criterio de búsqueda.</p>
            ) : (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {usuariosPaginados.map((usuario) => (
                                <tr key={usuario.id}>
                                    <td>{usuario.id}</td>
                                    <td>{usuario.email}</td>
                                    <td>{usuario.rol}</td>
                                    <td>
                                        {usuario.activo ? 'Activo' : 'Inactivo'}
                                    </td>
                                    <td>
                                        <div className="acciones">
                                            <Link
                                                to={`/usuarios/${usuario.id}`}
                                            >
                                                Ver
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCambiarEstado(usuario)
                                                }
                                                disabled={
                                                    procesandoId === usuario.id
                                                }
                                            >
                                                {usuario.activo
                                                    ? 'Desactivar'
                                                    : 'Reactivar'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            marginTop: '16px',
                            flexWrap: 'wrap',
                        }}
                    >
                        <p>
                            Mostrando{' '}
                            {(paginaSegura - 1) * ELEMENTOS_POR_PAGINA + 1} -{' '}
                            {Math.min(
                                paginaSegura * ELEMENTOS_POR_PAGINA,
                                usuariosFiltrados.length,
                            )}{' '}
                            de {usuariosFiltrados.length} resultados
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setPaginaActual((pagina) =>
                                        Math.max(1, pagina - 1),
                                    )
                                }
                                disabled={paginaSegura <= 1}
                            >
                                Anterior
                            </button>
                            <span>
                                Página {paginaSegura} de {totalPaginas}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setPaginaActual((pagina) =>
                                        Math.min(totalPaginas, pagina + 1),
                                    )
                                }
                                disabled={paginaSegura >= totalPaginas}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </>
            )}
        </main>
    )
}
