import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenerUsuarioGuardado } from '../../services/authService'
import { listarProfesionales } from '../../services/profesionalService'
import type { Profesional } from '../../types/profesional'
import { obtenerMensajeError } from '../../utils/errores'

const ELEMENTOS_POR_PAGINA = 12

export function ProfesionalesPage() {
    const esAdmin = obtenerUsuarioGuardado()?.rol === 'ADMIN'

    const [profesionales, setProfesionales] = useState<Profesional[]>([])
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(true)
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

        return profesionales.filter((profesional) =>
            [profesional.nombre, profesional.apellido, profesional.especialidad]
                .map((valor) => valor?.toLowerCase() ?? '')
                .some((valor) => valor.includes(termino)),
        )
    }, [profesionales, busqueda])

    const totalPaginas = Math.max(
        1,
        Math.ceil(profesionalesFiltrados.length / ELEMENTOS_POR_PAGINA),
    )

    const paginaSegura = Math.min(paginaActual, totalPaginas)

    const profesionalesPaginados = useMemo(() => {
        const inicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA
        return profesionalesFiltrados.slice(
            inicio,
            inicio + ELEMENTOS_POR_PAGINA,
        )
    }, [profesionalesFiltrados, paginaSegura])

    return (
        <main>
            <h1>Profesionales</h1>

            {esAdmin && (
                <p>
                    <Link to="/profesionales/nuevo">Crear profesional</Link>
                </p>
            )}

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {!cargando && profesionales.length > 0 && (
                <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                    <input
                        type="search"
                        placeholder="Buscar por nombre, apellido o especialidad..."
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
                !error && <p>No hay profesionales registrados.</p>
            ) : profesionalesFiltrados.length === 0 ? (
                <p>
                    No se encontraron profesionales con ese criterio de
                    búsqueda.
                </p>
            ) : (
                <>
                    <ul className="tarjetas">
                        {profesionalesPaginados.map((profesional) => (
                            <li key={profesional.id} className="tarjeta">
                                <h2>
                                    {profesional.nombre} {profesional.apellido}
                                </h2>
                                <p>{profesional.especialidad}</p>
                                <Link to={`/profesionales/${profesional.id}`}>
                                    Ver detalle
                                </Link>
                            </li>
                        ))}
                    </ul>

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
