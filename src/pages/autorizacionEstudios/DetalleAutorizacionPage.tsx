import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obtenerUsuarioGuardado } from '../../services/authService'
import {
    obtenerAutorizacionPorId,
    verificarVigencia,
    revocarAutorizacion,
} from '../../services/autorizacionEstudioService'
import type { AutorizacionEstudio } from '../../types/estudio'
import { obtenerMensajeError } from '../../utils/errores'

export function DetalleAutorizacionPage() {
    const { id } = useParams()
    const autorizacionId = id ? Number(id) : NaN

    const errorInicial = Number.isNaN(autorizacionId)
        ? 'ID de autorización inválido.'
        : ''

    const [error, setError] = useState(errorInicial)
    const [cargando, setCargando] = useState(Number.isNaN(autorizacionId))
    const [autorizacion, setAutorizacion] =
        useState<AutorizacionEstudio | null>(null)
    const [vigencia, setVigencia] = useState<{
        estaVigente: boolean
        estaVencida: boolean
    } | null>(null)
    const [revocando, setRevocando] = useState(false)

    const usuario = obtenerUsuarioGuardado()
    const rol = usuario?.rol
    const puedeRevocar =
        rol === 'ADMIN' || rol === 'PROFESIONAL' || rol === 'PACIENTE'

    useEffect(() => {
        if (Number.isNaN(autorizacionId)) return

        async function cargar() {
            try {
                const [a, v] = await Promise.all([
                    obtenerAutorizacionPorId(autorizacionId),
                    verificarVigencia(autorizacionId),
                ])
                setAutorizacion(a)
                setVigencia(v)
            } catch (err) {
                setError(
                    obtenerMensajeError(
                        err,
                        'No se pudo cargar la autorización.',
                    ),
                )
            } finally {
                setCargando(false)
            }
        }

        cargar()
    }, [autorizacionId])

    const manejarRevocar = async () => {
        if (!window.confirm('¿Estás seguro de revocar esta autorización?'))
            return
        setRevocando(true)
        try {
            await revocarAutorizacion(autorizacionId)
            setAutorizacion((prev) =>
                prev ? { ...prev, estado: 'VENCIDO' } : null,
            )
            setVigencia({ estaVigente: false, estaVencida: true })
        } catch (err) {
            setError(
                obtenerMensajeError(err, 'No se pudo revocar la autorización.'),
            )
        } finally {
            setRevocando(false)
        }
    }

    if (cargando) return <p>Cargando autorización...</p>
    if (error || !autorizacion) {
        return (
            <main>
                {error && (
                    <p role="alert" className="mensaje-error">
                        {error}
                    </p>
                )}
                <p>
                    <Link to="/autorizaciones">Volver al listado</Link>
                </p>
            </main>
        )
    }

    return (
        <main>
            <h1>Autorización #{autorizacion.id}</h1>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            <table
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    borderCollapse: 'collapse',
                    marginTop: '12px',
                }}
            >
                <tbody>
                    <tr>
                        <td style={{ fontWeight: 'bold', padding: '6px 0' }}>
                            ID
                        </td>
                        <td style={{ padding: '6px 0' }}>{autorizacion.id}</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', padding: '6px 0' }}>
                            Estudio
                        </td>
                        <td style={{ padding: '6px 0' }}>
                            {autorizacion.estudio?.tipo ??
                                `#${autorizacion.estudioId}`}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', padding: '6px 0' }}>
                            Profesional
                        </td>
                        <td style={{ padding: '6px 0' }}>
                            {autorizacion.profesional
                                ? `${autorizacion.profesional.nombre} ${autorizacion.profesional.apellido}` +
                                  (autorizacion.profesional.especialidad
                                      ? ` - ${autorizacion.profesional.especialidad}`
                                      : '')
                                : `#${autorizacion.profesionalId}`}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', padding: '6px 0' }}>
                            Fecha de autorización
                        </td>
                        <td style={{ padding: '6px 0' }}>
                            {autorizacion.fechaAutorizacion}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', padding: '6px 0' }}>
                            Fecha de vencimiento
                        </td>
                        <td style={{ padding: '6px 0' }}>
                            {autorizacion.fechaVencimiento}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', padding: '6px 0' }}>
                            Estado
                        </td>
                        <td style={{ padding: '6px 0' }}>
                            <span
                                style={{
                                    textTransform: 'uppercase',
                                    fontWeight: 'bold',
                                    color:
                                        autorizacion.estado === 'DISPONIBLE'
                                            ? 'green'
                                            : 'red',
                                }}
                            >
                                {autorizacion.estado}
                            </span>
                        </td>
                    </tr>
                    {vigencia && (
                        <tr>
                            <td
                                style={{ fontWeight: 'bold', padding: '6px 0' }}
                            >
                                Vigencia
                            </td>
                            <td style={{ padding: '6px 0' }}>
                                {vigencia.estaVigente ? 'Vigente' : 'Vencida'}
                                {!vigencia.estaVigente &&
                                    vigencia.estaVencida &&
                                    ' (fecha vencida)'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div
                style={{
                    marginTop: '20px',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                }}
            >
                <Link
                    to="/autorizaciones"
                    style={{
                        textDecoration: 'none',
                        padding: '8px 12px',
                        border: '1px solid #999',
                        borderRadius: '4px',
                    }}
                >
                    Volver al listado
                </Link>
                {puedeRevocar && autorizacion.estado === 'DISPONIBLE' && (
                    <button
                        type="button"
                        onClick={manejarRevocar}
                        disabled={revocando}
                        style={{
                            background: '#c00',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            cursor: revocando ? 'default' : 'pointer',
                        }}
                    >
                        {revocando ? 'Revocando...' : 'Revocar autorización'}
                    </button>
                )}
            </div>
        </main>
    )
}
