import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { obtenerUsuarioGuardado } from '../../services/authService'
import { crearAsignacionEspacio } from '../../services/asignacionEspacioService'
import { listarEspacios } from '../../services/espacioService'
import { listarProfesionales } from '../../services/profesionalService'
import type { DiaSemana } from '../../types/agenda'
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

export function CrearAsignacionEspacioPage() {
    const navigate = useNavigate()
    const usuario = obtenerUsuarioGuardado()
    const esAdmin = usuario?.rol === 'ADMIN'

    const [profesionales, setProfesionales] = useState<Profesional[]>([])
    const [espacios, setEspacios] = useState<Espacio[]>([])
    const [profesionalId, setProfesionalId] = useState<number | ''>('')
    const [espacioId, setEspacioId] = useState<number | ''>('')
    const [tipo, setTipo] = useState<TipoAsignacion>(
        esAdmin ? 'FIJA' : 'ESPECIFICA',
    )
    const [diaSemana, setDiaSemana] = useState<DiaSemana | ''>('')
    const [fecha, setFecha] = useState('')
    const [horaInicio, setHoraInicio] = useState('')
    const [horaFin, setHoraFin] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        async function cargar() {
            try {
                const [listaProfesionales, listaEspacios] = await Promise.all([
                    listarProfesionales(),
                    listarEspacios({ activo: true }),
                ])
                setProfesionales(listaProfesionales)
                setEspacios(listaEspacios)

                if (!esAdmin) {
                    // PROFESIONAL solo puede crear ESPECÍFICAs propias; el back fuerza el profesionalId.
                    const propio =
                        listaProfesionales.find(
                            (p) => p.usuarioId === usuario?.id,
                        ) ??
                        (listaProfesionales.length === 1
                            ? listaProfesionales[0]
                            : undefined)
                    if (propio) setProfesionalId(propio.id)
                }
            } catch (err) {
                setError(
                    obtenerMensajeError(
                        err,
                        'No se pudieron cargar los datos del formulario.',
                    ),
                )
            } finally {
                setCargando(false)
            }
        }

        cargar()
    }, [esAdmin, usuario?.id])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')

        if (!profesionalId || !espacioId) {
            setError('Seleccioná un profesional y un espacio.')
            return
        }
        if (!horaInicio || !horaFin) {
            setError('Completá el horario.')
            return
        }
        if (tipo === 'FIJA' && !diaSemana) {
            setError('Seleccioná un día de la semana para la asignación fija.')
            return
        }
        if (tipo === 'ESPECIFICA' && !fecha) {
            setError('Seleccioná una fecha para la asignación específica.')
            return
        }

        setGuardando(true)
        try {
            const creada = await crearAsignacionEspacio({
                profesionalId: Number(profesionalId),
                espacioId: Number(espacioId),
                tipo,
                horaInicio,
                horaFin,
                ...(tipo === 'FIJA'
                    ? { diaSemana: diaSemana as DiaSemana }
                    : { fecha }),
            })
            navigate(`/asignaciones-espacio/${creada.id}`)
        } catch (err) {
            setError(
                obtenerMensajeError(err, 'No se pudo crear la asignación.'),
            )
        } finally {
            setGuardando(false)
        }
    }

    if (cargando) return <p>Cargando formulario...</p>

    return (
        <main>
            <h1>Nueva asignación de espacio</h1>

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
                            <option key={profesional.id} value={profesional.id}>
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
                            onChange={(event) => setFecha(event.target.value)}
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
                        onChange={(event) => setHoraInicio(event.target.value)}
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
                    {guardando ? 'Creando...' : 'Crear asignación'}
                </button>
            </form>

            <p>
                <Link to="/asignaciones-espacio">Volver al listado</Link>
            </p>
        </main>
    )
}
