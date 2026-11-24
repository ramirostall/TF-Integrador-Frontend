import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obtenerTurnoPorId } from '../../services/turnoService'
import type { Turno } from '../../types/turno'
import { obtenerMensajeError } from '../../utils/errores'

export function DetalleTurnoPage() {
    const { id } = useParams()
    const turnoId = id ? Number(id) : NaN
    const [turno, setTurno] = useState<Turno | null>(null)
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        async function cargarTurno() {
            if (isNaN(turnoId)) {
                setError('ID de turno inválido.')
                setCargando(false)
                return
            }

            try {
                const datos = await obtenerTurnoPorId(turnoId)
                setTurno(datos)
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

            {cargando ? (
                <p>Cargando turno...</p>
            ) : !turno ? (
                <p>Turno no encontrado.</p>
            ) : (
                <>
                    <div>
                        <p>
                            <strong>ID:</strong> {turno.id}
                        </p>
                        <p>
                            <strong>Profesional ID:</strong>{' '}
                            {turno.profesionalId}
                        </p>
                        <p>
                            <strong>Paciente ID:</strong> {turno.pacienteId}
                        </p>
                        <p>
                            <strong>Agenda ID:</strong> {turno.agendaId}
                        </p>
                        <p>
                            <strong>Fecha:</strong> {turno.fecha}
                        </p>
                        <p>
                            <strong>Hora:</strong> {turno.hora}
                        </p>
                        <p>
                            <strong>Duración:</strong> {turno.duracion} min
                        </p>
                        <p>
                            <strong>Estado:</strong>
                            <span
                                className={`estado-${turno.estado.toLowerCase()}`}
                            >
                                {turno.estado}
                            </span>
                        </p>
                        {turno.notas && (
                            <p>
                                <strong>Notas:</strong> {turno.notas}
                            </p>
                        )}
                        {turno.createdAt && (
                            <p>
                                <strong>Creado:</strong> {turno.createdAt}
                            </p>
                        )}
                        {turno.updatedAt && (
                            <p>
                                <strong>Actualizado:</strong> {turno.updatedAt}
                            </p>
                        )}
                    </div>
                </>
            )}
        </main>
    )
}
