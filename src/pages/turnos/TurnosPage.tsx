import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    cancelarTurno,
    listarTurnos,
} from '../../services/turnoService'
import type { Turno, EstadoTurno, FiltrosTurnos } from '../../types/turno'
import { obtenerMensajeError } from '../../utils/errores'

const ELEMENTOS_POR_PAGINA = 10

export function TurnosPage() {
    const [turnos, setTurnos] = useState<Turno[]>([])
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(true)
    const [procesandoId, setProcesandoId] = useState<number | null>(null)
    const [busqueda, setBusqueda] = useState('')
    const [filtros, setFiltros] = useState<FiltrosTurnos>({})
    const [paginaActual, setPaginaActual] = useState(1)

    useEffect(() => {
        async function cargarTurnos() {
            try {
                const datos = await listarTurnos(filtros)
                setTurnos(datos)
            } catch (error) {
                setError(
                    obtenerMensajeError(
                        error,
                        'No se pudieron cargar los turnos.',
                    ),
                )
            } finally {
                setCargando(false)
            }
        }

        cargarTurnos()
    }, [filtros])

    const turnosFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase()

        if (!termino) {
            return turnos
        }

        return turnos.filter((turno) => {
            return (
                String(turno.id).includes(termino) ||
                turno.estado?.toLowerCase().includes(termino) ||
                String(turno.profesionalId).includes(termino) ||
                String(turno.pacienteId).includes(termino) ||
                String(turno.agendaId).includes(termino)
            )
        })
    }, [turnos, busqueda])

    const totalPaginas = Math.max(
        1,
        Math.ceil(turnosFiltrados.length / ELEMENTOS_POR_PAGINA),
    )

    const paginaSegura = Math.min(paginaActual, totalPaginas)

    const turnosPaginados = useMemo(() => {
        const inicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA
        const fin = inicio + ELEMENTOS_POR_PAGINA

        return turnosFiltrados.slice(inicio, fin)
    }, [turnosFiltrados, paginaSegura])

    async function handleCancelarTurno(turno: Turno) {
        setError('')
        setMensaje('')
        setProcesandoId(turno.id)

        try {
            await cancelarTurno(turno.id)

            setTurnos((actuales) =>
                actuales.map((item) =>
                    item.id === turno.id
                        ? { ...item, estado: 'CANCELADO' as EstadoTurno }
                        : item,
                ),
            )

            setMensaje('Turno cancelado correctamente.')
        } catch (error) {
            setError(
                obtenerMensajeError(error, 'No se pudo cancelar el turno.'),
            )
        } finally {
            setProcesandoId(null)
        }
    }

    function handleCambiarFiltro(
        campo: keyof FiltrosTurnos,
        valor: string,
    ) {
        setPaginaActual(1)
        if (valor === '') {
            const { [campo]: _restante, ...resto } = filtros
            setFiltros(resto)
        } else {
            setFiltros((actual) => ({ ...actual, [campo]: valor }))
        }
    }

    return (
        <main>
            <h1>Turnos</h1>

            <p>
                <Link to="/turnos/nuevo">Crear turno</Link>
            </p>

            {!cargando && turnos.length > 0 && (
                <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                    <input
                        type="search"
                        placeholder="Buscar por ID, estado o profesionales..."
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value)
                            setPaginaActual(1)
                        }}
                        aria-label="Buscar turnos"
                        style={{ maxWidth: '360px' }}
                    />
                </div>
            )}

            {!cargando && turnos.length > 0 && (
                <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                        <label htmlFor="filtro-estado">Estado</label>
                        <select
                            id="filtro-estado"
                            value={filtros.estado ?? ''}
                            onChange={(e) =>
                                handleCambiarFiltro('estado', e.target.value)
                            }
                            style={{ marginTop: '4px' }}
                        >
                            <option value="">Todos</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="CONFIRMADO">Confirmado</option>
                            <option value="CANCELADO">Cancelado</option>
                            <option value="COMPLETADO">Completado</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filtro-fecha">Fecha</label>
                        <input
                            id="filtro-fecha"
                            type="date"
                            value={filtros.fecha ?? ''}
                            onChange={(e) =>
                                handleCambiarFiltro('fecha', e.target.value)
                            }
                            style={{ marginTop: '4px' }}
                        />
                    </div>
                </div>
            )}

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {mensaje && <p className="mensaje-exito">{mensaje}</p>}

            {cargando ? (
                <p>Cargando turnos...</p>
            ) : turnos.length === 0 ? (
                <p>No hay turnos registrados.</p>
            ) : turnosFiltrados.length === 0 ? (
                <p>
                    No se encontraron turnos con ese criterio de búsqueda.
                </p>
            ) : (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Profesional</th>
                                <th>Paciente</th>
                                <th>Agenda</th>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Duración</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {turnosPaginados.map((turno) => (
                                <tr key={turno.id}>
                                    <td>{turno.id}</td>
                                    <td>{turno.profesionalId}</td>
                                    <td>{turno.pacienteId}</td>
                                    <td>{turno.agendaId}</td>
                                    <td>{turno.fecha}</td>
                                    <td>{turno.hora}</td>
                                    <td>{turno.duracion} min</td>
                                    <td>
                                        <span className={`estado-${turno.estado.toLowerCase()}`}>
                                            {turno.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="acciones">
                                            <Link
                                                to={`/turnos/${turno.id}`}
                                            >
                                                Ver
                                            </Link>

                                            {turno.estado !== 'CANCELADO' && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCancelarTurno(turno)
                                                    }
                                                    disabled={
                                                        procesandoId === turno.id
                                                    }
                                                >
                                                    Cancelar
                                                </button>
                                            )}
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
                                turnosFiltrados.length,
                            )}{' '}
                            de {turnosFiltrados.length} resultados
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
