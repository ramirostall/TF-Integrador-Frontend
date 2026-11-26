import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obtenerUsuarioGuardado } from '../../services/authService'
import {
    cancelarTurno,
    modificarTurno,
    obtenerHorariosLibres,
    obtenerTurnoPorId,
} from '../../services/turnoService'
import {
    ESTADOS_CANCELABLES,
    ESTADOS_TURNO,
    type ActualizarTurno,
    type EstadoTurno,
    type Turno,
} from '../../types/turno'
import { obtenerMensajeError } from '../../utils/errores'
import { formatearHora, nombreCompleto } from '../../utils/formato'

interface DatosEdicion {
    estado: EstadoTurno
    motivo: string
    observaciones: string
    fecha: string
    hora: string
}

function aDatosEdicion(turno: Turno): DatosEdicion {
    return {
        estado: turno.estado,
        motivo: turno.motivo ?? '',
        observaciones: turno.observaciones ?? '',
        fecha: turno.fecha,
        hora: formatearHora(turno.hora),
    }
}

export function DetalleTurnoPage() {
    const { id } = useParams()
    const turnoId = id ? Number(id) : NaN
    const rol = obtenerUsuarioGuardado()?.rol
    const esAdmin = rol === 'ADMIN'
    const puedeCancelar = rol === 'ADMIN' || rol === 'PACIENTE'

    const [turno, setTurno] = useState<Turno | null>(null)
    const [datos, setDatos] = useState<DatosEdicion | null>(null)
    // Horas libres (HH:mm) para la fecha elegida al reprogramar; null = cargando.
    const [horasLibres, setHorasLibres] = useState<string[] | null>(null)
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [cancelando, setCancelando] = useState(false)

    useEffect(() => {
        async function cargarTurno() {
            if (isNaN(turnoId)) {
                setError('ID de turno inválido.')
                setCargando(false)
                return
            }

            try {
                setTurno(await obtenerTurnoPorId(turnoId))
            } catch (error) {
                setError(
                    obtenerMensajeError(error, 'No se pudo cargar el turno.'),
                )
            } finally {
                setCargando(false)
            }
        }

        cargarTurno()
    }, [turnoId])

    const editando = datos !== null
    const fechaEdicion = datos?.fecha ?? ''

    useEffect(() => {
        if (!turno || !editando || !fechaEdicion) return

        let vigente = true
        const { profesionalId, agendaId } = turno

        async function cargarHorarios() {
            try {
                const libres = await obtenerHorariosLibres(
                    profesionalId,
                    fechaEdicion,
                )
                // El back reprograma dentro de la misma agenda del turno.
                if (vigente) {
                    setHorasLibres(
                        libres
                            .filter((h) => h.agendaId === agendaId)
                            .map((h) => h.hora),
                    )
                }
            } catch (error) {
                if (vigente) {
                    setHorasLibres([])
                    setError(
                        obtenerMensajeError(
                            error,
                            'No se pudieron cargar los horarios libres.',
                        ),
                    )
                }
            }
        }

        cargarHorarios()

        return () => {
            vigente = false
        }
    }, [turno, editando, fechaEdicion])

    function handleEditar() {
        if (!turno) return
        setError('')
        setMensaje('')
        setHorasLibres(null)
        setDatos(aDatosEdicion(turno))
    }

    function handleCambiarFecha(fecha: string) {
        if (!datos || !turno) return
        setHorasLibres(null)
        setDatos({
            ...datos,
            fecha,
            // En la fecha original se puede conservar la hora actual.
            hora: fecha === turno.fecha ? formatearHora(turno.hora) : '',
        })
    }

    // Opciones del select de hora: las libres más la actual si no se cambió
    // la fecha (el back no la devuelve como libre porque la ocupa este turno).
    const opcionesHora =
        turno && datos && horasLibres
            ? Array.from(
                  new Set([
                      ...(datos.fecha === turno.fecha
                          ? [formatearHora(turno.hora)]
                          : []),
                      ...horasLibres,
                  ]),
              ).sort()
            : []

    async function handleGuardar(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!turno || !datos) return

        const cambios: ActualizarTurno = {
            estado: datos.estado,
            motivo: datos.motivo,
            observaciones: datos.observaciones,
        }
        if (
            datos.fecha !== turno.fecha ||
            datos.hora !== formatearHora(turno.hora)
        ) {
            cambios.fecha = datos.fecha
            cambios.hora = datos.hora
        }

        setError('')
        setMensaje('')
        setGuardando(true)

        try {
            const actualizado = await modificarTurno(turno.id, cambios)
            setTurno(actualizado)
            setDatos(null)
            setMensaje('Turno actualizado correctamente.')
        } catch (error) {
            setError(
                obtenerMensajeError(error, 'No se pudo actualizar el turno.'),
            )
        } finally {
            setGuardando(false)
        }
    }

    async function handleCancelarTurno() {
        if (!turno) return
        if (!window.confirm('¿Seguro que querés cancelar este turno?')) return

        setError('')
        setMensaje('')
        setCancelando(true)

        try {
            await cancelarTurno(turno.id)
            setTurno({ ...turno, estado: 'CANCELADO' })
            setMensaje('Turno cancelado correctamente.')
        } catch (error) {
            setError(
                obtenerMensajeError(error, 'No se pudo cancelar el turno.'),
            )
        } finally {
            setCancelando(false)
        }
    }

    return (
        <main>
            <h1>Detalle del Turno</h1>

            <p>
                <Link to="/turnos">Volver al listado</Link>
            </p>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {mensaje && <p className="mensaje-exito">{mensaje}</p>}

            {cargando ? (
                <p>Cargando turno...</p>
            ) : !turno ? (
                <p>Turno no encontrado.</p>
            ) : datos ? (
                <form onSubmit={handleGuardar}>
                    <div>
                        <label htmlFor="estado">Estado</label>
                        <select
                            id="estado"
                            value={datos.estado}
                            onChange={(e) =>
                                setDatos({
                                    ...datos,
                                    estado: e.target.value as EstadoTurno,
                                })
                            }
                        >
                            {ESTADOS_TURNO.map((estado) => (
                                <option key={estado} value={estado}>
                                    {estado}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="fecha">Fecha</label>
                        <input
                            id="fecha"
                            type="date"
                            value={datos.fecha}
                            onChange={(e) => handleCambiarFecha(e.target.value)}
                            required
                        />
                    </div>

                    {horasLibres === null ? (
                        <p>Buscando horarios libres...</p>
                    ) : opcionesHora.length === 0 ? (
                        <p>
                            No hay horarios libres en esa fecha para la agenda
                            de este turno.
                        </p>
                    ) : (
                        <div>
                            <label htmlFor="hora">Hora</label>
                            <select
                                id="hora"
                                value={datos.hora}
                                onChange={(e) =>
                                    setDatos({ ...datos, hora: e.target.value })
                                }
                                required
                            >
                                <option value="">Seleccioná un horario</option>
                                {opcionesHora.map((hora) => (
                                    <option key={hora} value={hora}>
                                        {hora}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label htmlFor="motivo">Motivo</label>
                        <input
                            id="motivo"
                            type="text"
                            value={datos.motivo}
                            onChange={(e) =>
                                setDatos({ ...datos, motivo: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="observaciones">Observaciones</label>
                        <textarea
                            id="observaciones"
                            value={datos.observaciones}
                            onChange={(e) =>
                                setDatos({
                                    ...datos,
                                    observaciones: e.target.value,
                                })
                            }
                            rows={3}
                        />
                    </div>

                    <div className="acciones">
                        <button
                            type="submit"
                            disabled={guardando || !datos.hora}
                        >
                            {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setDatos(null)}
                            disabled={guardando}
                        >
                            Descartar
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    <dl className="datos-estudio">
                        <dt>Fecha</dt>
                        <dd>{turno.fecha}</dd>
                        <dt>Hora</dt>
                        <dd>{formatearHora(turno.hora)}</dd>
                        <dt>Profesional</dt>
                        <dd>
                            {nombreCompleto(turno.profesional)}
                            {turno.profesional?.especialidad &&
                                ` (${turno.profesional.especialidad})`}
                        </dd>
                        {rol !== 'PACIENTE' && (
                            <>
                                <dt>Paciente</dt>
                                <dd>{nombreCompleto(turno.paciente)}</dd>
                            </>
                        )}
                        <dt>Estado</dt>
                        <dd>
                            <span
                                className={`estado-${turno.estado.toLowerCase()}`}
                            >
                                {turno.estado}
                            </span>
                        </dd>
                        <dt>Motivo</dt>
                        <dd>{turno.motivo}</dd>
                        {turno.observaciones && (
                            <>
                                <dt>Observaciones</dt>
                                <dd>{turno.observaciones}</dd>
                            </>
                        )}
                    </dl>

                    <div className="acciones">
                        {esAdmin && (
                            <button type="button" onClick={handleEditar}>
                                Editar
                            </button>
                        )}
                        {puedeCancelar &&
                            ESTADOS_CANCELABLES.includes(turno.estado) && (
                                <button
                                    type="button"
                                    onClick={handleCancelarTurno}
                                    disabled={cancelando}
                                >
                                    {cancelando
                                        ? 'Cancelando...'
                                        : 'Cancelar turno'}
                                </button>
                            )}
                    </div>
                </>
            )}
        </main>
    )
}
