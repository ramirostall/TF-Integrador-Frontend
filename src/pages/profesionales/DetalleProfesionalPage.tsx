import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obtenerProfesionalPorId } from '../../services/profesionalService'
import type { Profesional } from '../../types/profesional'
import { obtenerMensajeError } from '../../utils/errores'

export function DetalleProfesionalPage() {
    const { id } = useParams()
    const profesionalId = id ? Number(id) : NaN
    const [profesional, setProfesional] = useState<Profesional | null>(null)
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        async function cargarProfesional() {
            if (isNaN(profesionalId)) {
                setError('ID de profesional inválido.')
                setCargando(false)
                return
            }

            try {
                const datos = await obtenerProfesionalPorId(profesionalId)
                setProfesional(datos)
            } catch (error) {
                setError(
                    obtenerMensajeError(
                        error,
                        'No se pudo cargar el profesional.',
                    ),
                )
            } finally {
                setCargando(false)
            }
        }

        cargarProfesional()
    }, [profesionalId])

    return (
        <main>
            <h1>Detalle del Profesional</h1>

            <p>
                <Link to="/profesionales">Volver al listado</Link>
            </p>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {cargando ? (
                <p>Cargando profesional...</p>
            ) : !profesional ? (
                <p>Profesional no encontrado.</p>
            ) : (
                <>
                    <div>
                        <p><strong>ID:</strong> {profesional.id}</p>
                        <p>
                            <strong>Nombre:</strong> {profesional.nombre}
                        </p>
                        <p>
                            <strong>Apellido:</strong> {profesional.apellido}
                        </p>
                        <p><strong>DNI:</strong> {profesional.dni}</p>
                        <p><strong>Email:</strong> {profesional.email}</p>
                        <p>
                            <strong>Teléfono:</strong> {profesional.telefono}
                        </p>
                        <p>
                            <strong>Especialidad:</strong> {profesional.especialidad}
                        </p>
                        <p>
                            <strong>Matrícula:</strong> {profesional.matricula}
                        </p>
                        <p>
                            <strong>Estado:</strong> {profesional.activo ? 'Activo' : 'Inactivo'}
                        </p>
                        {profesional.createdAt && (
                            <p>
                                <strong>Creado:</strong> {profesional.createdAt}
                            </p>
                        )}
                        {profesional.updatedAt && (
                            <p>
                                <strong>Actualizado:</strong> {profesional.updatedAt}
                            </p>
                        )}
                    </div>
                </>
            )}
        </main>
    )
}
