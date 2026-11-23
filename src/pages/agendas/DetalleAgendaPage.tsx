import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
    activarAgenda,
    desactivarAgenda,
    modificarAgenda,
    obtenerAgendaPorId,
} from '../../services/agendaService'
import { obtenerUsuarioGuardado } from '../../services/authService'
import type { ActualizarAgenda, Agenda, DiaSemana } from '../../types/agenda'
import { obtenerMensajeError } from '../../utils/errores'

const DIAS: DiaSemana[] = [
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
    'DOMINGO',
]

export function DetalleAgendaPage() {
    const { id } = useParams()
    const agendaId = Number(id)

    const [agenda, setAgenda] = useState<Agenda | null>(null)
    const [diaSemana, setDiaSemana] = useState<DiaSemana>('LUNES')
    const [horaInicio, setHoraInicio] = useState('')
    const [horaFin, setHoraFin] = useState('')
    const [duracionTurno, setDuracionTurno] = useState('')
    const [cancelarTurnosAfectados, setCancelarTurnosAfectados] =
        useState(false)
    const [error, setError] = useState(
        Number.isNaN(agendaId) ? 'ID de agenda inválido.' : '',
    )
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(!Number.isNaN(agendaId))
    const [guardando, setGuardando] = useState(false)
    const [procesando, setProcesando] = useState(false)
    const [activando, setActivando] = useState(false)

    const esAdmin = obtenerUsuarioGuardado()?.rol === 'ADMIN'

    useEffect(() => {
        if (Number.isNaN(agendaId)) return

        async function cargar() {
            try {
                const datos = await obtenerAgendaPorId(agendaId)
                setAgenda(datos)
                setDiaSemana(datos.diaSemana)
                setHoraInicio(datos.horaInicio.slice(0, 5))
                setHoraFin(datos.horaFin.slice(0, 5))
                setDuracionTurno(String(datos.duracionTurno))
            } catch (err) {
                setError(
                    obtenerMensajeError(err, 'No se pudo cargar la agenda.'),
                )
            } finally {
                setCargando(false)
            }
        }

        cargar()
    }, [agendaId])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!agenda) return

        setError('')
        setMensaje('')
        setGuardando(true)

        const datos: ActualizarAgenda = {
            diaSemana,
            horaInicio,
            horaFin,
            duracionTurno: Number(duracionTurno),
            ...(cancelarTurnosAfectados
                ? { cancelarTurnosAfectados: true }
                : {}),
        }

        try {
            const actualizada = await modificarAgenda(agenda.id, datos)
            setAgenda(actualizada)
            setHoraInicio(actualizada.horaInicio.slice(0, 5))
            setHoraFin(actualizada.horaFin.slice(0, 5))
            setDuracionTurno(String(actualizada.duracionTurno))
            setCancelarTurnosAfectados(false)
            setMensaje('Agenda actualizada correctamente.')
        } catch (err) {
            setError(
                obtenerMensajeError(err, 'No se pudo actualizar la agenda.'),
            )
        } finally {
            setGuardando(false)
        }
    }

    async function handleDesactivar() {
        if (!agenda) return

        if (
            !window.confirm(
                '¿Desactivar la agenda y cancelar sus turnos futuros?',
            )
        ) {
            return
        }

        setError('')
        setMensaje('')
        setProcesando(true)

        try {
            await desactivarAgenda(agenda.id, true)
            setAgenda({ ...agenda, activo: false })
            setMensaje('Agenda desactivada correctamente.')
        } catch (err) {
            setError(
                obtenerMensajeError(err, 'No se pudo desactivar la agenda.'),
            )
        } finally {
            setProcesando(false)
        }
    }

    async function handleActivar() {
        if (!agenda) return

        setError('')
        setMensaje('')
        setActivando(true)

        try {
            const activada = await activarAgenda(agenda.id)
            setAgenda(activada)
            setDiaSemana(activada.diaSemana)
            setHoraInicio(activada.horaInicio.slice(0, 5))
            setHoraFin(activada.horaFin.slice(0, 5))
            setDuracionTurno(String(activada.duracionTurno))
            setMensaje('Agenda activada correctamente.')
        } catch (err) {
            setError(obtenerMensajeError(err, 'No se pudo activar la agenda.'))
        } finally {
            setActivando(false)
        }
    }

    if (cargando) return <p>Cargando agenda...</p>

    if (!agenda) {
        return (
            <main>
                {error && (
                    <p role="alert" className="mensaje-error">
                        {error}
                    </p>
                )}
                <p>
                    <Link to="/agendas">Volver al listado</Link>
                </p>
            </main>
        )
    }

    return (
        <main>
            <h1>Agenda #{agenda.id}</h1>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {mensaje && <p className="mensaje-exito">{mensaje}</p>}

            <dl className="datos-estudio">
                <dt>Profesional</dt>
                <dd>
                    {agenda.profesional.nombre} {agenda.profesional.apellido} -{' '}
                    {agenda.profesional.especialidad}
                </dd>
                <dt>Matrícula</dt>
                <dd>{agenda.profesional.matricula}</dd>
                <dt>Día</dt>
                <dd>{agenda.diaSemana}</dd>
                <dt>Horario</dt>
                <dd>
                    {agenda.horaInicio.slice(0, 5)} -{' '}
                    {agenda.horaFin.slice(0, 5)}
                </dd>
                <dt>Duración del turno</dt>
                <dd>{agenda.duracionTurno} minutos</dd>
                <dt>Estado</dt>
                <dd>{agenda.activo ? 'Activa' : 'Inactiva'}</dd>
            </dl>

            {esAdmin && (
                <form onSubmit={handleSubmit}>
                    <h2>Editar agenda</h2>

                    <div>
                        <label htmlFor="diaSemana">Día de la semana</label>
                        <select
                            id="diaSemana"
                            value={diaSemana}
                            onChange={(event) =>
                                setDiaSemana(event.target.value as DiaSemana)
                            }
                        >
                            {DIAS.map((dia) => (
                                <option key={dia} value={dia}>
                                    {dia}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="horaInicio">Hora de inicio</label>
                        <input
                            id="horaInicio"
                            type="time"
                            value={horaInicio}
                            onChange={(event) =>
                                setHoraInicio(event.target.value)
                            }
                        />
                    </div>

                    <div>
                        <label htmlFor="horaFin">Hora de finalización</label>
                        <input
                            id="horaFin"
                            type="time"
                            value={horaFin}
                            onChange={(event) => setHoraFin(event.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="duracionTurno">
                            Duración del turno (minutos)
                        </label>
                        <input
                            id="duracionTurno"
                            type="number"
                            min="1"
                            value={duracionTurno}
                            onChange={(event) =>
                                setDuracionTurno(event.target.value)
                            }
                        />
                    </div>

                    <div>
                        <label>
                            <input
                                type="checkbox"
                                checked={cancelarTurnosAfectados}
                                onChange={(event) =>
                                    setCancelarTurnosAfectados(
                                        event.target.checked,
                                    )
                                }
                            />{' '}
                            Cancelar turnos futuros afectados
                        </label>
                    </div>

                    <button type="submit" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </form>
            )}

            {esAdmin && (
                <p>
                    {agenda.activo ? (
                        <button
                            type="button"
                            onClick={handleDesactivar}
                            disabled={procesando}
                        >
                            {procesando
                                ? 'Desactivando...'
                                : 'Desactivar agenda'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleActivar}
                            disabled={activando}
                        >
                            {activando ? 'Activando...' : 'Activar agenda'}
                        </button>
                    )}
                </p>
            )}

            <p>
                <Link to="/agendas">Volver al listado</Link>
            </p>
        </main>
    )
}
