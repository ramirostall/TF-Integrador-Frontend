import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { crearAgenda } from '../../services/agendaService'
import { listarProfesionales } from '../../services/profesionalService'
import type { ProfesionalOpcion } from '../../services/profesionalService'
import type { DiaSemana } from '../../types/agenda'
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

export function CrearAgendaPage() {
    const navigate = useNavigate()

    const [profesionales, setProfesionales] = useState<ProfesionalOpcion[]>([])
    const [profesionalId, setProfesionalId] = useState<number | null>(null)
    const [diaSemana, setDiaSemana] = useState<DiaSemana | ''>('')
    const [horaInicio, setHoraInicio] = useState('')
    const [horaFin, setHoraFin] = useState('')
    const [duracionTurno, setDuracionTurno] = useState('')
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

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')

        if (
            !profesionalId ||
            !diaSemana ||
            !horaInicio ||
            !horaFin ||
            !duracionTurno
        ) {
            setError('Todos los campos son obligatorios.')
            return
        }

        const inicio =
            Number(horaInicio.slice(0, 2)) * 60 + Number(horaInicio.slice(3, 5))
        const fin =
            Number(horaFin.slice(0, 2)) * 60 + Number(horaFin.slice(3, 5))
        const duracion = Number(duracionTurno)

        if (!Number.isInteger(duracion) || duracion <= 0) {
            setError('La duración del turno debe ser un entero positivo.')
            return
        }

        if (inicio >= fin) {
            setError(
                'La hora de inicio debe ser anterior a la de finalización.',
            )
            return
        }

        if (duracion > fin - inicio) {
            setError(
                'La duración del turno no puede superar el intervalo horario.',
            )
            return
        }

        setGuardando(true)

        try {
            const creada = await crearAgenda({
                profesionalId,
                diaSemana,
                horaInicio,
                horaFin,
                duracionTurno: duracion,
            })

            navigate(`/agendas/${creada.id}`)
        } catch (err) {
            setError(obtenerMensajeError(err, 'No se pudo crear la agenda.'))
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

                <div>
                    <label htmlFor="diaSemana">Día de la semana</label>
                    <select
                        id="diaSemana"
                        required
                        value={diaSemana}
                        onChange={(event) =>
                            setDiaSemana(event.target.value as DiaSemana | '')
                        }
                    >
                        <option value="">Seleccionar día</option>
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
                        required
                        value={horaInicio}
                        onChange={(event) => setHoraInicio(event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="horaFin">Hora de finalización</label>
                    <input
                        id="horaFin"
                        type="time"
                        required
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
                        required
                        value={duracionTurno}
                        onChange={(event) =>
                            setDuracionTurno(event.target.value)
                        }
                    />
                </div>

                <button type="submit" disabled={guardando}>
                    {guardando ? 'Creando...' : 'Crear agenda'}
                </button>
            </form>

            <p>
                <Link to="/agendas">Volver al listado</Link>
            </p>
        </main>
    )
}
