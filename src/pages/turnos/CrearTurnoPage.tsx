import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { crearTurno } from '../../services/turnoService'
import type { CrearTurno } from '../../types/turno'
import { obtenerMensajeError } from '../../utils/errores'

export function CrearTurnoPage() {
    const [datos, setDatos] = useState<CrearTurno>({
        profesionalId: 0,
        pacienteId: 0,
        agendaId: 0,
        fecha: '',
        hora: '',
        duracion: 30,
        notas: '',
    })
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(false)

    const navigate = useNavigate()

    function handleChange(campo: keyof CrearTurno, valor: string) {
        setDatos((actual: CrearTurno) => {
            if (
                campo === 'profesionalId' ||
                campo === 'pacienteId' ||
                campo === 'agendaId' ||
                campo === 'duracion'
            ) {
                return { ...actual, [campo]: Number(valor) }
            }
            return { ...actual, [campo]: valor }
        })
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')
        setMensaje('')
        setCargando(true)

        try {
            await crearTurno(datos)
            setMensaje('Turno creado correctamente.')
            setTimeout(() => navigate('/turnos'), 1500)
        } catch (error) {
            setError(obtenerMensajeError(error, 'No se pudo crear el turno.'))
        } finally {
            setCargando(false)
        }
    }

    return (
        <main>
            <h1>Crear Turno</h1>

            <p>
                <Link to="/turnos">Volver al listado</Link>
            </p>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {mensaje && <p className="mensaje-exito">{mensaje}</p>}

            {!mensaje && (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="profesionalId">ID Profesional</label>
                        <input
                            id="profesionalId"
                            type="number"
                            value={datos.profesionalId}
                            onChange={(e) =>
                                handleChange('profesionalId', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="pacienteId">ID Paciente</label>
                        <input
                            id="pacienteId"
                            type="number"
                            value={datos.pacienteId}
                            onChange={(e) =>
                                handleChange('pacienteId', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="agendaId">ID Agenda</label>
                        <input
                            id="agendaId"
                            type="number"
                            value={datos.agendaId}
                            onChange={(e) =>
                                handleChange('agendaId', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="fecha">Fecha</label>
                        <input
                            id="fecha"
                            type="date"
                            value={datos.fecha}
                            onChange={(e) =>
                                handleChange('fecha', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="hora">Hora</label>
                        <input
                            id="hora"
                            type="time"
                            value={datos.hora}
                            onChange={(e) =>
                                handleChange('hora', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="duracion">Duración (minutos)</label>
                        <input
                            id="duracion"
                            type="number"
                            value={datos.duracion}
                            onChange={(e) =>
                                handleChange('duracion', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="notas">Notas</label>
                        <textarea
                            id="notas"
                            value={datos.notas}
                            onChange={(e) =>
                                handleChange('notas', e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    <button type="submit" disabled={cargando}>
                        {cargando ? 'Creando...' : 'Crear turno'}
                    </button>
                </form>
            )}
        </main>
    )
}
