import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenerUsuarioGuardado } from '../../services/authService'
import { listarPacientes } from '../../services/pacienteService'
import { listarProfesionales } from '../../services/profesionalService'
import { cancelarTurno, listarTurnos } from '../../services/turnoService'
import type { Paciente } from '../../types/paciente'
import type { Profesional } from '../../types/profesional'
import {
    ESTADOS_CANCELABLES,
    ESTADOS_TURNO,
    type EstadoTurno,
    type FiltrosTurnos,
    type Turno,
} from '../../types/turno'
import { obtenerMensajeError } from '../../utils/errores'
import { formatearHora, nombreCompleto } from '../../utils/formato'

const ELEMENTOS_POR_PAGINA = 10

export function TurnosPage() {
    const rol = obtenerUsuarioGuardado()?.rol
    const esAdmin = rol === 'ADMIN'
    const puedeCancelar = rol === 'ADMIN' || rol === 'PACIENTE'
    const puedePedir = rol === 'ADMIN' || rol === 'PACIENTE'

    const [turnos, setTurnos] = useState<Turno[]>([])
    const [profesionales, setProfesionales] = useState<Profesional[]>([])
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(true)
    const [procesandoId, setProcesandoId] = useState<number | null>(null)
    const [busqueda, setBusqueda] = useState('')
    const [filtros, setFiltros] = useState<FiltrosTurnos>({})
    const [paginaActual, setPaginaActual] = useState(1)

    useEffect(() => {
        if (!esAdmin) return

        async function cargarOpcionesFiltros() {
            try {
                const [listaProfesionales, listaPacientes] = await Promise.all([
                    listarProfesionales(),
                    listarPacientes(),
                ])
                setProfesionales(listaProfesionales)
                setPacientes(listaPacientes)
            } catch (error) {
                setError(
                    obtenerMensajeError(
                        error,
                        'No se pudieron cargar los filtros.',
                    ),
                )
            }
        }

        cargarOpcionesFiltros()
    }, [esAdmin])

    useEffect(() => {
        let vigente = true

        async function cargarTurnos() {
            try {
                const datos = await listarTurnos(filtros)
                if (vigente) setTurnos(datos)
            } catch (error) {
                if (vigente) {
                    setError(
                        obtenerMensajeError(
                            error,
                            'No se pudieron cargar los turnos.',
                        ),
                    )
                }
            } finally {
                if (vigente) setCargando(false)
            }
        }

        cargarTurnos()

        return () => {
            vigente = false
        }
    }, [filtros])

    const turnosFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase()

        if (!termino) {
            return turnos
        }

        return turnos.filter((turno) =>
            [
                nombreCompleto(turno.profesional),
                turno.profesional?.especialidad ?? '',
                nombreCompleto(turno.paciente),
                turno.motivo ?? '',
                turno.estado,
                turno.fecha,
            ]
                .map((valor) => valor.toLowerCase())
                .some((valor) => valor.includes(termino)),
        )
    }, [turnos, busqueda])

    const totalPaginas = Math.max(
        1,
        Math.ceil(turnosFiltrados.length / ELEMENTOS_POR_PAGINA),
    )

    const paginaSegura = Math.min(paginaActual, totalPaginas)

    const turnosPaginados = useMemo(() => {
        const inicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA
        return turnosFiltrados.slice(inicio, inicio + ELEMENTOS_POR_PAGINA)
    }, [turnosFiltrados, paginaSegura])

    async function handleCancelarTurno(turno: Turno) {
        if (!window.confirm('¿Seguro que querés cancelar este turno?')) return

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

    function handleCambiarFiltro(campo: keyof FiltrosTurnos, valor: string) {
        setPaginaActual(1)
        setCargando(true)
        setError('')
        setFiltros((actual) => {
            const siguiente = { ...actual }
            if (valor === '') {
                delete siguiente[campo]
            } else if (campo === 'profesionalId' || campo === 'pacienteId') {
                siguiente[campo] = Number(valor)
            } else if (campo === 'estado') {
                siguiente.estado = valor as EstadoTurno
            } else {
                siguiente.fecha = valor
            }
            return siguiente
        })
    }

    const hayFiltros = Object.keys(filtros).length > 0

    return (
        <main>
            <h1>Turnos</h1>

            {puedePedir && (
                <p>
                    <Link to="/turnos/nuevo">Pedir turno</Link>
                </p>
            )}

            {esAdmin && (
                <div className="filtros">
                    <div>
                        <label htmlFor="filtro-profesional">Profesional</label>
                        <select
                            id="filtro-profesional"
                            value={filtros.profesionalId ?? ''}
                            onChange={(e) =>
                                handleCambiarFiltro(
                                    'profesionalId',
                                    e.target.value,
                                )
                            }
                        >
                            <option value="">Todos</option>
                            {profesionales.map((profesional) => (
                                <option
                                    key={profesional.id}
                                    value={profesional.id}
                                >
                                    {nombreCompleto(profesional)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filtro-paciente">Paciente</label>
                        <select
                            id="filtro-paciente"
                            value={filtros.pacienteId ?? ''}
                            onChange={(e) =>
                                handleCambiarFiltro(
                                    'pacienteId',
                                    e.target.value,
                                )
                            }
                        >
                            <option value="">Todos</option>
                            {pacientes.map((paciente) => (
                                <option key={paciente.id} value={paciente.id}>
                                    {nombreCompleto(paciente)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filtro-estado">Estado</label>
                        <select
                            id="filtro-estado"
                            value={filtros.estado ?? ''}
                            onChange={(e) =>
                                handleCambiarFiltro('estado', e.target.value)
                            }
                        >
                            <option value="">Todos</option>
                            {ESTADOS_TURNO.map((estado) => (
                                <option key={estado} value={estado}>
                                    {estado}
                                </option>
                            ))}
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
                        />
                    </div>
                </div>
            )}

            {!cargando && turnos.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                    <input
                        type="search"
                        placeholder="Buscar por profesional, paciente, motivo o estado..."
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value)
                            setPaginaActual(1)
                        }}
                        aria-label="Buscar turnos"
                        style={{ maxWidth: '400px' }}
                    />
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
                !error && (
                    <p>
                        {hayFiltros
                            ? 'No hay turnos con esos filtros.'
                            : 'No hay turnos registrados.'}
                    </p>
                )
            ) : turnosFiltrados.length === 0 ? (
                <p>No se encontraron turnos con ese criterio de búsqueda.</p>
            ) : (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Profesional</th>
                                {rol !== 'PACIENTE' && <th>Paciente</th>}
                                <th>Motivo</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {turnosPaginados.map((turno) => (
                                <tr key={turno.id}>
                                    <td>{turno.fecha}</td>
                                    <td>{formatearHora(turno.hora)}</td>
                                    <td>
                                        {nombreCompleto(turno.profesional)}
                                        {turno.profesional?.especialidad &&
                                            ` (${turno.profesional.especialidad})`}
                                    </td>
                                    {rol !== 'PACIENTE' && (
                                        <td>
                                            {nombreCompleto(turno.paciente)}
                                        </td>
                                    )}
                                    <td>{turno.motivo}</td>
                                    <td>
                                        <span
                                            className={`estado-${turno.estado.toLowerCase()}`}
                                        >
                                            {turno.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="acciones">
                                            <Link to={`/turnos/${turno.id}`}>
                                                Ver
                                            </Link>

                                            {puedeCancelar &&
                                                ESTADOS_CANCELABLES.includes(
                                                    turno.estado,
                                                ) && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleCancelarTurno(
                                                                turno,
                                                            )
                                                        }
                                                        disabled={
                                                            procesandoId ===
                                                            turno.id
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
