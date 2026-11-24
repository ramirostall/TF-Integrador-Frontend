import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    activarProfesional,
    desactivarProfesional,
    listarProfesionales,
} from '../../services/profesionalService'
import type { Profesional } from '../../types/profesional'
import { obtenerMensajeError } from '../../utils/errores'

const ELEMENTOS_POR_PAGINA = 10

export function ProfesionalesPage() {
    const [profesionales, setProfesionales] = useState<Profesional[]>([])
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(true)
    const [procesandoId, setProcesandoId] = useState<number | null>(null)
    const [busqueda, setBusqueda] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)

    useEffect(() => {
        async function cargarProfesionales() {
            try {
                const datos = await listarProfesionales()
                setProfesionales(datos)
            } catch (error) {
                setError(
                    obtenerMensajeError(
                        error,
                        'No se pudieron cargar los profesionales.',
                    ),
                )
            } finally {
                setCargando(false)
            }
        }

        cargarProfesionales()
    }, [])

    const profesionalesFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase()

        if (!termino) {
            return profesionales
        }

        return profesionales.filter((profesional) => {
            const nombre = profesional.nombre?.toLowerCase() ?? ''
            const apellido = profesional.apellido?.toLowerCase() ?? ''
            const dni = profesional.dni?.toLowerCase() ?? ''
            const email = profesional.email?.toLowerCase() ?? ''
            const telefono = profesional.telefono?.toLowerCase() ?? ''
            const especialidad = profesional.especialidad?.toLowerCase() ?? ''

            return (
                nombre.includes(termino) ||
                apellido.includes(termino) ||
                dni.includes(termino) ||
                email.includes(termino) ||
                telefono.includes(termino) ||
                especialidad.includes(termino) ||
                String(profesional.id).includes(termino)
            )
        })
    }, [profesionales, busqueda])

    const totalPaginas = Math.max(
        1,
        Math.ceil(profesionalesFiltrados.length / ELEMENTOS_POR_PAGINA),
    )

    const paginaSegura = Math.min(paginaActual, totalPaginas)

    const profesionalesPaginados = useMemo(() => {
        const inicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA
        const fin = inicio + ELEMENTOS_POR_PAGINA

        return profesionalesFiltrados.slice(inicio, fin)
    }, [profesionalesFiltrados, paginaSegura])

    async function handleCambiarEstado(profesional: Profesional) {
        setError('')
        setMensaje('')
        setProcesandoId(profesional.id)

        try {
            const actualizado = profesional.activo
                ? await desactivarProfesional(profesional.id)
                : await activarProfesional(profesional.id)

            setProfesionales((actuales) =>
                actuales.map((item) =>
                    item.id === actualizado.id ? actualizado : item,
                ),
            )

            setMensaje(
                actualizado.activo
                    ? 'Profesional reactivado correctamente.'
                    : 'Profesional desactivado correctamente.',
            )
        } catch (error) {
            setError(
                obtenerMensajeError(
                    error,
                    'No se pudo cambiar el estado del profesional.',
                ),
            )
        } finally {
            setProcesandoId(null)
        }
    }

    return (
        <main>
            <h1>Profesionales</h1>

            <p>
                <Link to="/profesionales/nuevo">Crear profesional</Link>
            </p>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {mensaje && <p className="mensaje-exito">{mensaje}</p>}

            {!cargando && profesionales.length > 0 && (
                <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                    <input
                        type="search"
                        placeholder="Buscar por nombre, apellido, DNI, email, teléfono o especialidad..."
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value)
                            setPaginaActual(1)
                        }}
                        aria-label="Buscar profesionales"
                        style={{ maxWidth: '400px' }}
                    />
                </div>
            )}

            {cargando ? (
                <p>Cargando profesionales...</p>
            ) : profesionales.length === 0 ? (
                <p>No hay profesionales registrados.</p>
            ) : profesionalesFiltrados.length === 0 ? (
                <p>
                    No se encontraron profesionales con ese criterio de
                    búsqueda.
                </p>
            ) : (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>DNI</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Especialidad</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {profesionalesPaginados.map((profesional) => (
                                <tr key={profesional.id}>
                                    <td>{profesional.nombre}</td>
                                    <td>{profesional.apellido}</td>
                                    <td>{profesional.dni}</td>
                                    <td>{profesional.email}</td>
                                    <td>{profesional.telefono}</td>
                                    <td>{profesional.especialidad}</td>
                                    <td>
                                        {profesional.activo
                                            ? 'Activo'
                                            : 'Inactivo'}
                                    </td>
                                    <td>
                                        <div className="acciones">
                                            <Link
                                                to={`/profesionales/${profesional.id}`}
                                            >
                                                Ver
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCambiarEstado(
                                                        profesional,
                                                    )
                                                }
                                                disabled={
                                                    procesandoId ===
                                                    profesional.id
                                                }
                                            >
                                                {profesional.activo
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
                                profesionalesFiltrados.length,
                            )}{' '}
                            de {profesionalesFiltrados.length} resultados
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
