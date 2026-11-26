import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { obtenerUsuarioGuardado } from '../../services/authService'
import {
    eliminarAsignacionEspacio,
    modificarAsignacionEspacio,
    obtenerAsignacionEspacioPorId,
} from '../../services/asignacionEspacioService'
import { listarEspacios } from '../../services/espacioService'
import { listarProfesionales } from '../../services/profesionalService'
import type { DiaSemana } from '../../types/agenda'
import type {
    ActualizarAsignacionEspacio,
    AsignacionEspacio,
} from '../../types/asignacionEspacio'
import type { Espacio, TipoAsignacion } from '../../types/espacio'
import type { Profesional } from '../../types/profesional'
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

export function DetalleAsignacionEspacioPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const asignacionId = Number(id)
    const rol = obtenerUsuarioGuardado()?.rol
    const esAdmin = rol === 'ADMIN'

    const [asignacion, setAsignacion] = useState<AsignacionEspacio | null>(null)
    const [profesionales, setProfesionales] = useState<Profesional[]>([])
    const [espacios, setEspacios] = useState<Espacio[]>([])
    const [profesionalId, setProfesionalId] = useState<number | ''>('')
    const [espacioId, setEspacioId] = useState<number | ''>('')
    const [tipo, setTipo] = useState<TipoAsignacion>('FIJA')
    const [diaSemana, setDiaSemana] = useState<DiaSemana | ''>('')
    const [fecha, setFecha] = useState('')
    const [horaInicio, setHoraInicio] = useState('')
    const [horaFin, setHoraFin] = useState('')
    const [error, setError] = useState(
        Number.isNaN(asignacionId) ? 'ID de asignación inválido.' : '',
    )
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(!Number.isNaN(asignacionId))
    const [guardando, setGuardando] = useState(false)
    const [procesando, setProcesando] = useState(false)

    const puedeModificar =
        esAdmin || (rol === 'PROFESIONAL' && asignacion?.tipo === 'ESPECIFICA')

    useEffect(() => {
        if (Number.isNaN(asignacionId)) return

        async function cargar() {
            try {
                const [datos, listaProfesionales, listaEspacios] =
                    await Promise.all([
                        obtenerAsignacionEspacioPorId(asignacionId),
                        listarProfesionales(),
                        listarEspacios(),
                    ])
                setAsignacion(datos)
                setProfesionales(listaProfesionales)
                setEspacios(listaEspacios)
                setProfesionalId(datos.profesionalId)
                setEspacioId(datos.espacioId)
                setTipo(datos.tipo)
                setDiaSemana(datos.diaSemana ?? '')
                setFecha(datos.fecha ?? '')
                setHoraInicio(datos.horaInicio.slice(0, 5))
                setHoraFin(datos.horaFin.slice(0, 5))
            } catch (err) {
                setError(
                    obtenerMensajeError(
                        err,
                        'No se pudo cargar la asignación.',
                    ),
                )
            } finally {
                setCargando(false)
            }
        }

        cargar()
    }, [asignacionId])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!asignacion) return

        setError('')
        setMensaje('')

        if (!profesionalId || !espacioId) {
            setError('Seleccioná un profesional y un espacio.')
            return
        }
        if (tipo === 'FIJA' && !diaSemana) {
            setError('Seleccioná un día de la semana.')
            return
        }
        if (tipo === 'ESPECIFICA' && !fecha) {
            setError('Seleccioná una fecha.')
            return
        }

        const datos: ActualizarAsignacionEspacio = {
            profesionalId: Number(profesionalId),
            espacioId: Number(espacioId),
            tipo,
            horaInicio,
            horaFin,
            ...(tipo === 'FIJA'
                ? { diaSemana: diaSemana as DiaSemana }
                : { fecha }),
        }

        setGuardando(true)
        try {
            const actualizada = await modificarAsignacionEspacio(
                asignacion.id,
                datos,
            )
            setAsignacion(actualizada)
            setMensaje('Asignación actualizada correctamente.')
        } catch (err) {
            setError(
                obtenerMensajeError(
                    err,
                    'No se pudo actualizar la asignación.',
                ),
            )
        } finally {
            setGuardando(false)
        }
    }

    async function handleEliminar() {
        if (!asignacion) return
        if (!window.confirm('¿Eliminar la asignación?')) return

        setError('')
        setMensaje('')
        setProcesando(true)
        try {
            await eliminarAsignacionEspacio(asignacion.id)
            navigate('/asignaciones-espacio')
        } catch (err) {
            setError(
                obtenerMensajeError(err, 'No se pudo eliminar la asignación.'),
            )
        } finally {
            setProcesando(false)
        }
    }

    if (cargando) return <p>Cargando asignación...</p>

    if (!asignacion) {
        return (
            <main>
                {error && (
                    <p role="alert" className="mensaje-error">
                        {error}
                    </p>
                )}
                <p>
                    <Link to="/asignaciones-espacio">Volver al listado</Link>
                </p>
            </main>
        )
    }

    return (
        <main>
            <h1>Asignación #{asignacion.id}</h1>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}
            {mensaje && <p className="mensaje-exito">{mensaje}</p>}

            <dl className="datos-estudio">
                <dt>Profesional</dt>
                <dd>
                    {asignacion.profesional.apellido},{' '}
                    {asignacion.profesional.nombre}
                </dd>
                <dt>Espacio</dt>
                <dd>{asignacion.espacio.nombre}</dd>
                <dt>Tipo</dt>
                <dd>{asignacion.tipo === 'FIJA' ? 'Fija' : 'Específica'}</dd>
                <dt>Día / Fecha</dt>
                <dd>{asignacion.diaSemana ?? asignacion.fecha ?? '-'}</dd>
                <dt>Horario</dt>
                <dd>
                    {asignacion.horaInicio.slice(0, 5)} -{' '}
                    {asignacion.horaFin.slice(0, 5)}
                </dd>
            </dl>

            {puedeModificar && (
                <form onSubmit={handleSubmit}>
                    <h2>Editar asignación</h2>

                    <div>
                        <label htmlFor="profesionalId">Profesional</label>
                        <select
                            id="profesionalId"
                            value={profesionalId}
                            disabled={!esAdmin}
                            onChange={(event) =>
                                setProfesionalId(
                                    event.target.value
                                        ? Number(event.target.value)
                                        : '',
                                )
                            }
                            required
                        >
                            <option value="">Seleccionar profesional</option>
                            {profesionales.map((profesional) => (
                                <option
                                    key={profesional.id}
                                    value={profesional.id}
                                >
                                    {profesional.apellido}, {profesional.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="espacioId">Espacio</label>
                        <select
                            id="espacioId"
                            value={espacioId}
                            onChange={(event) =>
                                setEspacioId(
                                    event.target.value
                                        ? Number(event.target.value)
                                        : '',
                                )
                            }
                            required
                        >
                            <option value="">Seleccionar espacio</option>
                            {espacios.map((espacio) => (
                                <option key={espacio.id} value={espacio.id}>
                                    {espacio.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="tipo">Tipo</label>
                        <select
                            id="tipo"
                            value={tipo}
                            disabled={!esAdmin}
                            onChange={(event) => {
                                const nuevoTipo = event.target
                                    .value as TipoAsignacion
                                setTipo(nuevoTipo)
                                if (nuevoTipo === 'FIJA') setFecha('')
                                if (nuevoTipo === 'ESPECIFICA') setDiaSemana('')
                            }}
                        >
                            <option value="FIJA">Fija</option>
                            <option value="ESPECIFICA">Específica</option>
                        </select>
                    </div>

                    {tipo === 'FIJA' ? (
                        <div>
                            <label htmlFor="diaSemana">Día de la semana</label>
                            <select
                                id="diaSemana"
                                value={diaSemana}
                                onChange={(event) =>
                                    setDiaSemana(
                                        event.target.value as DiaSemana | '',
                                    )
                                }
                                required
                            >
                                <option value="">Seleccionar día</option>
                                {DIAS.map((dia) => (
                                    <option key={dia} value={dia}>
                                        {dia}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="fecha">Fecha</label>
                            <input
                                id="fecha"
                                type="date"
                                value={fecha}
                                onChange={(event) =>
                                    setFecha(event.target.value)
                                }
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="horaInicio">Hora de inicio</label>
                        <input
                            id="horaInicio"
                            type="time"
                            value={horaInicio}
                            onChange={(event) =>
                                setHoraInicio(event.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="horaFin">Hora de fin</label>
                        <input
                            id="horaFin"
                            type="time"
                            value={horaFin}
                            onChange={(event) => setHoraFin(event.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </form>
            )}

            {puedeModificar && (
                <p>
                    <button
                        type="button"
                        onClick={handleEliminar}
                        disabled={procesando}
                    >
                        {procesando ? 'Eliminando...' : 'Eliminar asignación'}
                    </button>
                </p>
            )}

            <p>
                <Link to="/asignaciones-espacio">Volver al listado</Link>
            </p>
        </main>
    )
}
