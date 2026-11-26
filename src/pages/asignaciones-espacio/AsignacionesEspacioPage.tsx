import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenerUsuarioGuardado } from '../../services/authService'
import {
    eliminarAsignacionEspacio,
    listarAsignacionesEspacio,
} from '../../services/asignacionEspacioService'
import type { AsignacionEspacio } from '../../types/asignacionEspacio'
import type { DiaSemana } from '../../types/agenda'
import { obtenerMensajeError } from '../../utils/errores'

const ELEMENTOS_POR_PAGINA = 10

const ETIQUETAS_DIA: Record<DiaSemana, string> = {
    LUNES: 'Lunes',
    MARTES: 'Martes',
    MIERCOLES: 'Miércoles',
    JUEVES: 'Jueves',
    VIERNES: 'Viernes',
    SABADO: 'Sábado',
    DOMINGO: 'Domingo',
}

function nombreProfesional(asignacion: AsignacionEspacio) {
    return `${asignacion.profesional.apellido}, ${asignacion.profesional.nombre}`
}

function descripcionHorario(asignacion: AsignacionEspacio) {
    const horario = `${asignacion.horaInicio.slice(0, 5)} - ${asignacion.horaFin.slice(0, 5)}`
    if (asignacion.tipo === 'FIJA' && asignacion.diaSemana) {
        return `${ETIQUETAS_DIA[asignacion.diaSemana]} ${horario}`
    }
    if (asignacion.fecha) {
        return `${asignacion.fecha} ${horario}`
    }
    return horario
}

export function AsignacionesEspacioPage() {
    const [asignaciones, setAsignaciones] = useState<AsignacionEspacio[]>([])
    const [busqueda, setBusqueda] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(true)
    const [eliminandoId, setEliminandoId] = useState<number | null>(null)

    const rol = obtenerUsuarioGuardado()?.rol
    const esAdmin = rol === 'ADMIN'

    function puedeModificar(asignacion: AsignacionEspacio) {
        // El back solo permite a PROFESIONAL modificar/eliminar sus ESPECÍFICAS.
        return (
            esAdmin ||
            (rol === 'PROFESIONAL' && asignacion.tipo === 'ESPECIFICA')
        )
    }

    useEffect(() => {
        async function cargar() {
            try {
                setAsignaciones(await listarAsignacionesEspacio())
            } catch (err) {
                setError(
                    obtenerMensajeError(
                        err,
                        'No se pudieron cargar las asignaciones.',
                    ),
                )
            } finally {
                setCargando(false)
            }
        }

        cargar()
    }, [])

    const termino = busqueda.trim().toLowerCase()

    const asignacionesFiltradas = useMemo(() => {
        if (!termino) return asignaciones

        return asignaciones.filter((asignacion) => {
            const profesional = nombreProfesional(asignacion).toLowerCase()
            const espacio = asignacion.espacio.nombre.toLowerCase()
            const horario = descripcionHorario(asignacion).toLowerCase()

            return (
                String(asignacion.id).includes(termino) ||
                profesional.includes(termino) ||
                espacio.includes(termino) ||
                asignacion.tipo.toLowerCase().includes(termino) ||
                horario.includes(termino)
            )
        })
    }, [asignaciones, termino])

    const totalPaginas = Math.max(
        1,
        Math.ceil(asignacionesFiltradas.length / ELEMENTOS_POR_PAGINA),
    )
    const paginaSegura = Math.min(paginaActual, totalPaginas)

    const asignacionesPaginadas = useMemo(() => {
        const inicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA
        return asignacionesFiltradas.slice(
            inicio,
            inicio + ELEMENTOS_POR_PAGINA,
        )
    }, [asignacionesFiltradas, paginaSegura])

    async function handleEliminar(id: number) {
        if (!window.confirm('¿Eliminar la asignación?')) return

        setEliminandoId(id)
        setError('')

        try {
            await eliminarAsignacionEspacio(id)
            setAsignaciones((prev) => prev.filter((a) => a.id !== id))
        } catch (err) {
            setError(
                obtenerMensajeError(err, 'No se pudo eliminar la asignación.'),
            )
        } finally {
            setEliminandoId(null)
        }
    }

    if (cargando) return <p>Cargando asignaciones...</p>

    return (
        <main>
            <h1>Asignaciones de espacio</h1>

            <p>
                <Link to="/asignaciones-espacio/nuevo">Nueva asignación</Link>
            </p>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {asignaciones.length > 0 && (
                <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                    <input
                        type="search"
                        placeholder="Buscar por profesional, espacio, tipo o horario..."
                        value={busqueda}
                        onChange={(event) => {
                            setBusqueda(event.target.value)
                            setPaginaActual(1)
                        }}
                    />
                </div>
            )}

            {asignaciones.length === 0 ? (
                <p>No hay asignaciones registradas.</p>
            ) : asignacionesFiltradas.length === 0 ? (
                <p>No se encontraron asignaciones con ese criterio.</p>
            ) : (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Profesional</th>
                                <th>Espacio</th>
                                <th>Tipo</th>
                                <th>Horario</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {asignacionesPaginadas.map((asignacion) => (
                                <tr key={asignacion.id}>
                                    <td>{asignacion.id}</td>
                                    <td>{nombreProfesional(asignacion)}</td>
                                    <td>{asignacion.espacio.nombre}</td>
                                    <td>
                                        {asignacion.tipo === 'FIJA'
                                            ? 'Fija'
                                            : 'Específica'}
                                    </td>
                                    <td>{descripcionHorario(asignacion)}</td>
                                    <td>
                                        <div className="acciones">
                                            <Link
                                                to={`/asignaciones-espacio/${asignacion.id}`}
                                            >
                                                Ver
                                            </Link>
                                            {puedeModificar(asignacion) && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEliminar(
                                                            asignacion.id,
                                                        )
                                                    }
                                                    disabled={
                                                        eliminandoId ===
                                                        asignacion.id
                                                    }
                                                >
                                                    {eliminandoId ===
                                                    asignacion.id
                                                        ? 'Eliminando...'
                                                        : 'Eliminar'}
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
