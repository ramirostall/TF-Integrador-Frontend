import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { crearAgenda, desactivarAgenda } from '../../services/agendaService'
import { listarProfesionales } from '../../services/profesionalService'
import type { ProfesionalOpcion } from '../../services/profesionalService'
import type { Agenda, DiaSemana } from '../../types/agenda'
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

interface DiaAgendaForm {
    diaSemana: DiaSemana | ''
    horaInicio: string
    horaFin: string
    duracionTurno: string
}

function diaVacio(): DiaAgendaForm {
    return { diaSemana: '', horaInicio: '', horaFin: '', duracionTurno: '' }
}

function aMinutos(hora: string): number {
    return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5))
}

export function CrearAgendaPage() {
    const navigate = useNavigate()

    const [profesionales, setProfesionales] = useState<ProfesionalOpcion[]>([])
    const [profesionalId, setProfesionalId] = useState<number | null>(null)
    const [dias, setDias] = useState<DiaAgendaForm[]>([diaVacio()])
    const [error, setError] = useState('')
    const [cargandoInicial, setCargandoInicial] = useState(true)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        async function cargar() {
            try {
                setProfesionales(await listarProfesionales())
            } catch (err) {
                setError(
                    obtenerMensajeError(
                        err,
                        'No se pudieron cargar los profesionales.',
                    ),
                )
            } finally {
                setCargandoInicial(false)
            }
        }

        cargar()
    }, [])

    function actualizarDia(indice: number, datos: Partial<DiaAgendaForm>) {
        setDias((prev) =>
            prev.map((dia, i) => (i === indice ? { ...dia, ...datos } : dia)),
        )
    }

    function agregarDia() {
        setDias((prev) => [...prev, diaVacio()])
    }

    function quitarDia(indice: number) {
        setDias((prev) =>
            prev.length === 1 ? prev : prev.filter((_, i) => i !== indice),
        )
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')

        if (!profesionalId) {
            setError('Seleccioná un profesional.')
            return
        }

        if (
            dias.some(
                (dia) =>
                    !dia.diaSemana ||
                    !dia.horaInicio ||
                    !dia.horaFin ||
                    !dia.duracionTurno,
            )
        ) {
            setError(
                'Completá el día, los horarios y la duración de cada fila.',
            )
            return
        }

        const seleccionados = dias.map((dia) => dia.diaSemana)
        if (new Set(seleccionados).size !== seleccionados.length) {
            setError('No podés repetir el mismo día de la semana.')
            return
        }

        for (const [indice, dia] of dias.entries()) {
            const inicio = aMinutos(dia.horaInicio)
            const fin = aMinutos(dia.horaFin)
            const duracion = Number(dia.duracionTurno)

            if (!Number.isInteger(duracion) || duracion <= 0) {
                setError(
                    `La duración del turno debe ser un entero positivo (día ${indice + 1}).`,
                )
                return
            }

            if (inicio >= fin) {
                setError(
                    `La hora de inicio debe ser anterior a la de finalización (día ${indice + 1}).`,
                )
                return
            }

            if (duracion > fin - inicio) {
                setError(
                    `La duración no puede superar el intervalo horario (día ${indice + 1}).`,
                )
                return
            }
        }

        setGuardando(true)
        const creadas: Agenda[] = []

        try {
            for (const dia of dias) {
                const creada = await crearAgenda({
                    profesionalId,
                    diaSemana: dia.diaSemana as DiaSemana,
                    horaInicio: dia.horaInicio,
                    horaFin: dia.horaFin,
                    duracionTurno: Number(dia.duracionTurno),
                })
                creadas.push(creada)
            }

            navigate(`/agendas/${creadas[0].id}`)
        } catch (err) {
            if (creadas.length > 0) {
                await Promise.allSettled(
                    creadas.map((agenda) => desactivarAgenda(agenda.id, true)),
                )
            }
            setError(
                obtenerMensajeError(err, 'No se pudieron crear las agendas.'),
            )
        } finally {
            setGuardando(false)
        }
    }

    if (cargandoInicial) return <p>Cargando profesionales...</p>

    return (
        <main>
            <h1>Nueva agenda</h1>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="profesionalId">Profesional</label>
                    <select
                        id="profesionalId"
                        required
                        value={profesionalId ?? ''}
                        onChange={(event) =>
                            setProfesionalId(Number(event.target.value) || null)
                        }
                    >
                        <option value="">Seleccionar profesional</option>
                        {profesionales.map((profesional) => (
                            <option key={profesional.id} value={profesional.id}>
                                {profesional.apellido}, {profesional.nombre} -{' '}
                                {profesional.especialidad}
                            </option>
                        ))}
                    </select>
                </div>

                {dias.map((dia, indice) => (
                    <fieldset key={indice}>
                        <legend>Día {indice + 1}</legend>

                        <div>
                            <label htmlFor={`diaSemana-${indice}`}>
                                Día de la semana
                            </label>
                            <select
                                id={`diaSemana-${indice}`}
                                required
                                value={dia.diaSemana}
                                onChange={(event) =>
                                    actualizarDia(indice, {
                                        diaSemana: event.target.value as
                                            DiaSemana | '',
                                    })
                                }
                            >
                                <option value="">Seleccionar día</option>
                                {DIAS.map((opcion) => (
                                    <option key={opcion} value={opcion}>
                                        {opcion}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor={`horaInicio-${indice}`}>
                                Hora de inicio
                            </label>
                            <input
                                id={`horaInicio-${indice}`}
                                type="time"
                                required
                                value={dia.horaInicio}
                                onChange={(event) =>
                                    actualizarDia(indice, {
                                        horaInicio: event.target.value,
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label htmlFor={`horaFin-${indice}`}>
                                Hora de finalización
                            </label>
                            <input
                                id={`horaFin-${indice}`}
                                type="time"
                                required
                                value={dia.horaFin}
                                onChange={(event) =>
                                    actualizarDia(indice, {
                                        horaFin: event.target.value,
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label htmlFor={`duracionTurno-${indice}`}>
                                Duración del turno (minutos)
                            </label>
                            <input
                                id={`duracionTurno-${indice}`}
                                type="number"
                                min="1"
                                required
                                value={dia.duracionTurno}
                                onChange={(event) =>
                                    actualizarDia(indice, {
                                        duracionTurno: event.target.value,
                                    })
                                }
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => quitarDia(indice)}
                            disabled={dias.length === 1}
                        >
                            Quitar día
                        </button>
                    </fieldset>
                ))}

                <button type="button" onClick={agregarDia}>
                    Agregar día
                </button>

                <button type="submit" disabled={guardando}>
                    {guardando
                        ? 'Creando...'
                        : dias.length > 1
                          ? 'Crear agendas'
                          : 'Crear agenda'}
                </button>
            </form>

            <p>
                <Link to="/agendas">Volver al listado</Link>
            </p>
        </main>
    )
}
