import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
    desactivarEspacio,
    eliminarEspacio,
    modificarEspacio,
    obtenerEspacioPorId,
    reactivarEspacio,
} from '../../services/espacioService'
import { obtenerUsuarioGuardado } from '../../services/authService'
import type {
    ActualizarEspacio,
    Espacio,
    TipoEspacio,
    UbicacionEspacio,
} from '../../types/espacio'
import { obtenerMensajeError } from '../../utils/errores'

const TIPOS: TipoEspacio[] = ['CONSULTORIO', 'GIMNASIO']
const UBICACIONES: UbicacionEspacio[] = ['ADELANTE', 'ATRAS']

function etiquetaTipo(tipo: TipoEspacio) {
    return tipo === 'CONSULTORIO' ? 'Consultorio' : 'Gimnasio'
}

function etiquetaUbicacion(ubicacion: UbicacionEspacio) {
    return ubicacion === 'ADELANTE' ? 'Adelante' : 'Atrás'
}

export function DetalleEspacioPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const espacioId = Number(id)

    const [espacio, setEspacio] = useState<Espacio | null>(null)
    const [nombre, setNombre] = useState('')
    const [tipo, setTipo] = useState<TipoEspacio>('CONSULTORIO')
    const [ubicacion, setUbicacion] = useState<UbicacionEspacio>('ADELANTE')
    const [error, setError] = useState(
        Number.isNaN(espacioId) ? 'ID de espacio inválido.' : '',
    )
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(!Number.isNaN(espacioId))
    const [guardando, setGuardando] = useState(false)
    const [procesando, setProcesando] = useState(false)

    const esAdmin = obtenerUsuarioGuardado()?.rol === 'ADMIN'

    useEffect(() => {
        if (Number.isNaN(espacioId)) return

        async function cargar() {
            try {
                const datos = await obtenerEspacioPorId(espacioId)
                setEspacio(datos)
                setNombre(datos.nombre)
                setTipo(datos.tipo)
                setUbicacion(datos.ubicacion)
            } catch (err) {
                setError(
                    obtenerMensajeError(err, 'No se pudo cargar el espacio.'),
                )
            } finally {
                setCargando(false)
            }
        }

        cargar()
    }, [espacioId])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!espacio) return

        setError('')
        setMensaje('')

        if (!nombre.trim()) {
            setError('Ingresá el nombre del espacio.')
            return
        }

        const datos: ActualizarEspacio = {
            nombre: nombre.trim(),
            tipo,
            ubicacion,
        }

        setGuardando(true)
        try {
            const actualizado = await modificarEspacio(espacio.id, datos)
            setEspacio(actualizado)
            setNombre(actualizado.nombre)
            setTipo(actualizado.tipo)
            setUbicacion(actualizado.ubicacion)
            setMensaje('Espacio actualizado correctamente.')
        } catch (err) {
            setError(
                obtenerMensajeError(err, 'No se pudo actualizar el espacio.'),
            )
        } finally {
            setGuardando(false)
        }
    }

    async function handleDesactivar() {
        if (!espacio) return
        if (!window.confirm('¿Desactivar el espacio?')) return

        setError('')
        setMensaje('')
        setProcesando(true)
        try {
            const actualizado = await desactivarEspacio(espacio.id)
            setEspacio(actualizado)
            setMensaje('Espacio desactivado correctamente.')
        } catch (err) {
            setError(
                obtenerMensajeError(err, 'No se pudo desactivar el espacio.'),
            )
        } finally {
            setProcesando(false)
        }
    }

    async function handleReactivar() {
        if (!espacio) return

        setError('')
        setMensaje('')
        setProcesando(true)
        try {
            const actualizado = await reactivarEspacio(espacio.id)
            setEspacio(actualizado)
            setMensaje('Espacio reactivado correctamente.')
        } catch (err) {
            setError(
                obtenerMensajeError(err, 'No se pudo reactivar el espacio.'),
            )
        } finally {
            setProcesando(false)
        }
    }

    async function handleEliminar() {
        if (!espacio) return
        if (
            !window.confirm(
                '¿Eliminar el espacio? Esta acción no se puede deshacer.',
            )
        ) {
            return
        }

        setError('')
        setMensaje('')
        setProcesando(true)
        try {
            await eliminarEspacio(espacio.id)
            navigate('/espacios')
        } catch (err) {
            setError(
                obtenerMensajeError(err, 'No se pudo eliminar el espacio.'),
            )
        } finally {
            setProcesando(false)
        }
    }

    if (cargando) return <p>Cargando espacio...</p>

    if (!espacio) {
        return (
            <main>
                {error && (
                    <p role="alert" className="mensaje-error">
                        {error}
                    </p>
                )}
                <p>
                    <Link to="/espacios">Volver al listado</Link>
                </p>
            </main>
        )
    }

    return (
        <main>
            <h1>Espacio #{espacio.id}</h1>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {mensaje && <p className="mensaje-exito">{mensaje}</p>}

            <dl className="datos-estudio">
                <dt>Nombre</dt>
                <dd>{espacio.nombre}</dd>
                <dt>Tipo</dt>
                <dd>{etiquetaTipo(espacio.tipo)}</dd>
                <dt>Ubicación</dt>
                <dd>{etiquetaUbicacion(espacio.ubicacion)}</dd>
                <dt>Estado</dt>
                <dd>{espacio.activo ? 'Activo' : 'Inactivo'}</dd>
            </dl>

            {esAdmin && (
                <form onSubmit={handleSubmit}>
                    <h2>Editar espacio</h2>

                    <div>
                        <label htmlFor="nombre">Nombre</label>
                        <input
                            id="nombre"
                            value={nombre}
                            maxLength={100}
                            onChange={(event) => setNombre(event.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="tipo">Tipo</label>
                        <select
                            id="tipo"
                            value={tipo}
                            onChange={(event) =>
                                setTipo(event.target.value as TipoEspacio)
                            }
                        >
                            {TIPOS.map((opcion) => (
                                <option key={opcion} value={opcion}>
                                    {etiquetaTipo(opcion)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="ubicacion">Ubicación</label>
                        <select
                            id="ubicacion"
                            value={ubicacion}
                            onChange={(event) =>
                                setUbicacion(
                                    event.target.value as UbicacionEspacio,
                                )
                            }
                        >
                            {UBICACIONES.map((opcion) => (
                                <option key={opcion} value={opcion}>
                                    {etiquetaUbicacion(opcion)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </form>
            )}

            {esAdmin && (
                <p>
                    {espacio.activo ? (
                        <button
                            type="button"
                            onClick={handleDesactivar}
                            disabled={procesando}
                        >
                            {procesando
                                ? 'Desactivando...'
                                : 'Desactivar espacio'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleReactivar}
                            disabled={procesando}
                        >
                            {procesando
                                ? 'Reactivando...'
                                : 'Reactivar espacio'}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleEliminar}
                        disabled={procesando}
                    >
                        Eliminar espacio
                    </button>
                </p>
            )}

            <p>
                <Link to="/espacios">Volver al listado</Link>
            </p>
        </main>
    )
}
