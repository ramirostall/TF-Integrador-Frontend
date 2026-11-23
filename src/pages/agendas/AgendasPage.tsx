import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { desactivarAgenda, listarAgendas } from '../../services/agendaService'
import { obtenerUsuarioGuardado } from '../../services/authService'
import type { Agenda, DiaSemana, ProfesionalAgenda } from '../../types/agenda'
import { obtenerMensajeError } from '../../utils/errores'

const ELEMENTOS_POR_PAGINA = 10
const ORDEN_DIAS: DiaSemana[] = [
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
    'DOMINGO',
]

interface GrupoProfesional {
    profesional: ProfesionalAgenda
    agendas: Agenda[]
}

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

    const grupos = useMemo(() => {
        const mapa = new Map<number, GrupoProfesional>()

        for (const agenda of agendasFiltradas) {
            const grupo = mapa.get(agenda.profesionalId)

            if (grupo) {
                grupo.agendas.push(agenda)
            } else {
                mapa.set(agenda.profesionalId, {
                    profesional: agenda.profesional,
                    agendas: [agenda],
                })
            }
        }

        return Array.from(mapa.values())
            .map((grupo) => ({
                ...grupo,
                agendas: [...grupo.agendas].sort((a, b) => {
                    const porDia =
                        ORDEN_DIAS.indexOf(a.diaSemana) -
                        ORDEN_DIAS.indexOf(b.diaSemana)

                    return porDia !== 0
                        ? porDia
                        : a.horaInicio.localeCompare(b.horaInicio)
                }),
            }))
            .sort((a, b) =>
                `${a.profesional.apellido} ${a.profesional.nombre}`.localeCompare(
                    `${b.profesional.apellido} ${b.profesional.nombre}`,
                ),
            )
    }, [agendasFiltradas])

    const totalPaginas = Math.max(
        1,
        Math.ceil(grupos.length / ELEMENTOS_POR_PAGINA),
    )
    const paginaSegura = Math.min(paginaActual, totalPaginas)

    const gruposPaginados = useMemo(() => {
        const inicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA
        return grupos.slice(inicio, inicio + ELEMENTOS_POR_PAGINA)
    }, [grupos, paginaSegura])

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
                    {gruposPaginados.map((grupo) => (
                        <section key={grupo.profesional.id}>
                            <h2>
                                {grupo.profesional.apellido},{' '}
                                {grupo.profesional.nombre} -{' '}
                                {grupo.profesional.especialidad}
                            </h2>

                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Día</th>
                                        <th>Horario</th>
                                        <th>Duración</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grupo.agendas.map((agenda) => (
                                        <tr key={agenda.id}>
                                            <td>{agenda.id}</td>
                                            <td>{agenda.diaSemana}</td>
                                            <td>
                                                {agenda.horaInicio.slice(0, 5)}{' '}
                                                - {agenda.horaFin.slice(0, 5)}
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
                                                    <Link
                                                        to={`/agendas/${agenda.id}`}
                                                    >
                                                        Ver
                                                    </Link>
                                                    {esAdmin &&
                                                        agenda.activo && (
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
                                                                {desactivando ===
                                                                agenda.id
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
                        </section>
                    ))}

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
