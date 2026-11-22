import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { desactivarAgenda, listarAgendas } from '../../services/agendaService'
import { obtenerUsuarioGuardado } from '../../services/authService'
import type { Agenda } from '../../types/agenda'
import { obtenerMensajeError } from '../../utils/errores'

const ELEMENTOS_POR_PAGINA = 10

export function AgendasPage() {
    const [agendas, setAgendas] = useState<Agenda[]>([])
    const [busqueda, setBusqueda] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(true)
    const [desactivando, setDesactivando] = useState<number | null>(null)

    const esAdmin = obtenerUsuarioGuardado()?.rol === 'ADMIN'

    useEffect(() => {
        async function cargar() {
            try {
                setAgendas(await listarAgendas())
            } catch (err) {
                setError(
                    obtenerMensajeError(
                        err,
                        'No se pudieron cargar las agendas.',
                    ),
                )
            } finally {
                setCargando(false)
            }
        }

        cargar()
    }, [])

    const termino = busqueda.trim().toLowerCase()

    const agendasFiltradas = useMemo(() => {
        if (!termino) return agendas

        return agendas.filter((agenda) => {
            const profesional =
                `${agenda.profesional.nombre} ${agenda.profesional.apellido}`.toLowerCase()

            return (
                String(agenda.id).includes(termino) ||
                profesional.includes(termino) ||
                agenda.diaSemana.toLowerCase().includes(termino) ||
                agenda.profesional.matricula.toLowerCase().includes(termino)
            )
        })
    }, [agendas, termino])

    const totalPaginas = Math.max(
        1,
        Math.ceil(agendasFiltradas.length / ELEMENTOS_POR_PAGINA),
    )
    const paginaSegura = Math.min(paginaActual, totalPaginas)

    const agendasPaginadas = useMemo(() => {
        const inicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA
        return agendasFiltradas.slice(inicio, inicio + ELEMENTOS_POR_PAGINA)
    }, [agendasFiltradas, paginaSegura])

    async function manejarDesactivar(id: number) {
        if (
            !window.confirm(
                '¿Desactivar la agenda y cancelar sus turnos futuros?',
            )
        ) {
            return
        }

        setDesactivando(id)
        setError('')

        try {
            await desactivarAgenda(id, true)
            setAgendas((prev) =>
                prev.map((agenda) =>
                    agenda.id === id ? { ...agenda, activo: false } : agenda,
                ),
            )
        } catch (err) {
            setError(
                obtenerMensajeError(err, 'No se pudo desactivar la agenda.'),
            )
        } finally {
            setDesactivando(null)
        }
    }

    if (cargando) return <p>Cargando agendas...</p>

    return (
        <main>
            <h1>Agendas</h1>

            {esAdmin && (
                <p>
                    <Link to="/agendas/nuevo">Nueva agenda</Link>
                </p>
            )}

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {agendas.length > 0 && (
                <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                    <input
                        type="search"
                        placeholder="Buscar por ID, profesional, matrícula o día..."
                        value={busqueda}
                        onChange={(event) => {
                            setBusqueda(event.target.value)
                            setPaginaActual(1)
                        }}
                    />
                </div>
            )}

            {agendas.length === 0 ? (
                <p>No hay agendas registradas.</p>
            ) : agendasFiltradas.length === 0 ? (
                <p>No se encontraron agendas con ese criterio.</p>
            ) : (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Profesional</th>
                                <th>Día</th>
                                <th>Horario</th>
                                <th>Duración</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agendasPaginadas.map((agenda) => (
                                <tr key={agenda.id}>
                                    <td>{agenda.id}</td>
                                    <td>
                                        {agenda.profesional.nombre}{' '}
                                        {agenda.profesional.apellido}
                                        <br />
                                        <small>
                                            {agenda.profesional.especialidad}
                                        </small>
                                    </td>
                                    <td>{agenda.diaSemana}</td>
                                    <td>
                                        {agenda.horaInicio.slice(0, 5)} -{' '}
                                        {agenda.horaFin.slice(0, 5)}
                                    </td>
                                    <td>{agenda.duracionTurno} min</td>
                                    <td>
                                        <span
                                            className={
                                                agenda.activo
                                                    ? 'estado-disponible'
                                                    : 'estado-vencido'
                                            }
                                        >
                                            {agenda.activo
                                                ? 'Activa'
                                                : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="acciones">
                                            <Link to={`/agendas/${agenda.id}`}>
                                                Ver
                                            </Link>
                                            {esAdmin && agenda.activo && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        manejarDesactivar(
                                                            agenda.id,
                                                        )
                                                    }
                                                    disabled={
                                                        desactivando ===
                                                        agenda.id
                                                    }
                                                >
                                                    {desactivando === agenda.id
                                                        ? 'Desactivando...'
                                                        : 'Desactivar'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <p>
                        Página {paginaSegura} de {totalPaginas}
                    </p>
                    <button
                        type="button"
                        onClick={() =>
                            setPaginaActual((pagina) => Math.max(1, pagina - 1))
                        }
                        disabled={paginaSegura <= 1}
                    >
                        Anterior
                    </button>
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
                </>
            )}
        </main>
    )
}
