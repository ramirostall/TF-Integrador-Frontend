import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { obtenerUsuarioGuardado } from '../../services/authService'
import { listarPacientes } from '../../services/pacienteService'
import { listarProfesionales } from '../../services/profesionalService'
import { crearTurno, obtenerHorariosLibres } from '../../services/turnoService'
import type { Paciente } from '../../types/paciente'
import type { Profesional } from '../../types/profesional'
import type { HorarioLibre } from '../../types/turno'
import { obtenerMensajeError } from '../../utils/errores'
import { fechaHoy, nombreCompleto } from '../../utils/formato'

function claveHorario(horario: HorarioLibre): string {
    return `${horario.agendaId}|${horario.hora}`
}

export function CrearTurnoPage() {
    const navigate = useNavigate()
    const esAdmin = obtenerUsuarioGuardado()?.rol === 'ADMIN'

    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [profesionales, setProfesionales] = useState<Profesional[]>([])
    // null = todavía no se cargaron para el profesional y la fecha elegidos.
    const [horarios, setHorarios] = useState<HorarioLibre[] | null>(null)

    const [pacienteId, setPacienteId] = useState('')
    const [profesionalId, setProfesionalId] = useState('')
    const [fecha, setFecha] = useState('')
    const [horarioElegido, setHorarioElegido] = useState('')
    const [motivo, setMotivo] = useState('')
    const [observaciones, setObservaciones] = useState('')

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargandoInicial, setCargandoInicial] = useState(true)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        async function cargarOpciones() {
            try {
                const [listaProfesionales, listaPacientes] = await Promise.all([
                    listarProfesionales(),
                    esAdmin
                        ? listarPacientes()
                        : Promise.resolve<Paciente[]>([]),
                ])
                setProfesionales(listaProfesionales)
                setPacientes(listaPacientes)
            } catch (error) {
                setError(
                    obtenerMensajeError(
                        error,
                        'No se pudieron cargar los datos del formulario.',
                    ),
                )
            } finally {
                setCargandoInicial(false)
            }
        }

        cargarOpciones()
    }, [esAdmin])

    useEffect(() => {
        if (!profesionalId || !fecha) {
            return
        }

        let vigente = true

        async function cargarHorarios() {
            try {
                const libres = await obtenerHorariosLibres(
                    Number(profesionalId),
                    fecha,
                )
                if (vigente) setHorarios(libres)
            } catch (error) {
                if (vigente) {
                    setHorarios([])
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
    }, [profesionalId, fecha])

    function handleCambiarProfesional(valor: string) {
        setProfesionalId(valor)
        setHorarios(null)
        setHorarioElegido('')
    }

    function handleCambiarFecha(valor: string) {
        setFecha(valor)
        setHorarios(null)
        setHorarioElegido('')
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const horario = horarios?.find(
            (h) => claveHorario(h) === horarioElegido,
        )
        if (!horario) {
            setError('Seleccioná un horario.')
            return
        }

        setError('')
        setMensaje('')
        setGuardando(true)

        try {
            await crearTurno({
                ...(esAdmin ? { pacienteId: Number(pacienteId) } : {}),
                profesionalId: Number(profesionalId),
                agendaId: horario.agendaId,
                fecha,
                hora: horario.hora,
                motivo,
                ...(observaciones.trim()
                    ? { observaciones: observaciones.trim() }
                    : {}),
            })
            setMensaje('Turno reservado correctamente.')
            setTimeout(() => navigate('/turnos'), 1500)
        } catch (error) {
            setError(obtenerMensajeError(error, 'No se pudo crear el turno.'))
        } finally {
            setGuardando(false)
        }
    }

    const mostrarHorarios = !!profesionalId && !!fecha

    return (
        <main>
            <h1>Pedir turno</h1>

            <p>
                <Link to="/turnos">Volver al listado</Link>
            </p>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {mensaje && <p className="mensaje-exito">{mensaje}</p>}

            {cargandoInicial ? (
                <p>Cargando...</p>
            ) : (
                !mensaje && (
                    <form onSubmit={handleSubmit}>
                        {esAdmin && (
                            <div>
                                <label htmlFor="pacienteId">Paciente</label>
                                <select
                                    id="pacienteId"
                                    value={pacienteId}
                                    onChange={(e) =>
                                        setPacienteId(e.target.value)
                                    }
                                    required
                                >
                                    <option value="">
                                        Seleccioná un paciente
                                    </option>
                                    {pacientes.map((paciente) => (
                                        <option
                                            key={paciente.id}
                                            value={paciente.id}
                                        >
                                            {nombreCompleto(paciente)} (DNI{' '}
                                            {paciente.dni})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label htmlFor="profesionalId">Profesional</label>
                            <select
                                id="profesionalId"
                                value={profesionalId}
                                onChange={(e) =>
                                    handleCambiarProfesional(e.target.value)
                                }
                                required
                            >
                                <option value="">
                                    Seleccioná un profesional
                                </option>
                                {profesionales.map((profesional) => (
                                    <option
                                        key={profesional.id}
                                        value={profesional.id}
                                    >
                                        {nombreCompleto(profesional)} -{' '}
                                        {profesional.especialidad}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="fecha">Fecha</label>
                            <input
                                id="fecha"
                                type="date"
                                min={fechaHoy()}
                                value={fecha}
                                onChange={(e) =>
                                    handleCambiarFecha(e.target.value)
                                }
                                required
                            />
                        </div>

                        {mostrarHorarios &&
                            (horarios === null ? (
                                <p>Buscando horarios libres...</p>
                            ) : horarios.length === 0 ? (
                                <p>
                                    No hay horarios libres para ese día. Probá
                                    con otra fecha.
                                </p>
                            ) : (
                                <div>
                                    <label htmlFor="horario">Horario</label>
                                    <select
                                        id="horario"
                                        value={horarioElegido}
                                        onChange={(e) =>
                                            setHorarioElegido(e.target.value)
                                        }
                                        required
                                    >
                                        <option value="">
                                            Seleccioná un horario
                                        </option>
                                        {horarios.map((horario) => (
                                            <option
                                                key={claveHorario(horario)}
                                                value={claveHorario(horario)}
                                            >
                                                {horario.hora}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}

                        <div>
                            <label htmlFor="motivo">Motivo</label>
                            <input
                                id="motivo"
                                type="text"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="observaciones">
                                Observaciones (opcional)
                            </label>
                            <textarea
                                id="observaciones"
                                value={observaciones}
                                onChange={(e) =>
                                    setObservaciones(e.target.value)
                                }
                                rows={3}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={guardando || !horarioElegido}
                        >
                            {guardando ? 'Reservando...' : 'Reservar turno'}
                        </button>
                    </form>
                )
            )}
        </main>
    )
}
