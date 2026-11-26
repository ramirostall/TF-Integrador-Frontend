import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obtenerUsuarioGuardado } from '../../services/authService'
import {
    modificarProfesional,
    obtenerProfesionalPorId,
} from '../../services/profesionalService'
import type {
    ActualizarProfesional,
    Profesional,
} from '../../types/profesional'
import { obtenerMensajeError } from '../../utils/errores'

type DatosForm = Required<ActualizarProfesional>

const CAMPOS_FORM: { campo: keyof DatosForm; etiqueta: string }[] = [
    { campo: 'nombre', etiqueta: 'Nombre' },
    { campo: 'apellido', etiqueta: 'Apellido' },
    { campo: 'dni', etiqueta: 'DNI' },
    { campo: 'telefono', etiqueta: 'Teléfono' },
    { campo: 'matricula', etiqueta: 'Matrícula' },
    { campo: 'especialidad', etiqueta: 'Especialidad' },
]

function aDatosForm(profesional: Profesional): DatosForm {
    return {
        nombre: profesional.nombre,
        apellido: profesional.apellido,
        dni: profesional.dni ?? '',
        telefono: profesional.telefono ?? '',
        matricula: profesional.matricula ?? '',
        especialidad: profesional.especialidad,
    }
}

export function DetalleProfesionalPage() {
    const { id } = useParams()
    const profesionalId = id ? Number(id) : NaN
    const usuario = obtenerUsuarioGuardado()

    const [profesional, setProfesional] = useState<Profesional | null>(null)
    const [datos, setDatos] = useState<DatosForm | null>(null)
    const [editando, setEditando] = useState(false)
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        async function cargarProfesional() {
            if (isNaN(profesionalId)) {
                setError('ID de profesional inválido.')
                setCargando(false)
                return
            }

            try {
                const respuesta = await obtenerProfesionalPorId(profesionalId)
                setProfesional(respuesta)
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

    // El back solo manda usuarioId al ADMIN y al dueño del perfil.
    const puedeEditar =
        !!profesional &&
        (usuario?.rol === 'ADMIN' ||
            (usuario?.rol === 'PROFESIONAL' &&
                profesional.usuarioId === usuario.id))

    function handleEditar() {
        if (!profesional) return
        setDatos(aDatosForm(profesional))
        setError('')
        setMensaje('')
        setEditando(true)
    }

    function handleCancelarEdicion() {
        setEditando(false)
        setDatos(null)
        setError('')
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!profesional || !datos) return

        setError('')
        setMensaje('')
        setGuardando(true)

        try {
            const actualizado = await modificarProfesional(
                profesional.id,
                datos,
            )
            setProfesional(actualizado)
            setEditando(false)
            setDatos(null)
            setMensaje('Profesional actualizado correctamente.')
        } catch (error) {
            setError(
                obtenerMensajeError(
                    error,
                    'No se pudo actualizar el profesional.',
                ),
            )
        } finally {
            setGuardando(false)
        }
    }

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

            {mensaje && <p className="mensaje-exito">{mensaje}</p>}

            {cargando ? (
                <p>Cargando profesional...</p>
            ) : !profesional ? (
                <p>Profesional no encontrado.</p>
            ) : editando && datos ? (
                <form onSubmit={handleSubmit}>
                    {CAMPOS_FORM.map(({ campo, etiqueta }) => (
                        <div key={campo}>
                            <label htmlFor={campo}>{etiqueta}</label>
                            <input
                                id={campo}
                                type="text"
                                value={datos[campo]}
                                onChange={(e) =>
                                    setDatos({
                                        ...datos,
                                        [campo]: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                    ))}

                    <div className="acciones">
                        <button type="submit" disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancelarEdicion}
                            disabled={guardando}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    <dl className="datos-estudio">
                        <dt>Nombre</dt>
                        <dd>{profesional.nombre}</dd>
                        <dt>Apellido</dt>
                        <dd>{profesional.apellido}</dd>
                        <dt>Especialidad</dt>
                        <dd>{profesional.especialidad}</dd>
                        {profesional.matricula && (
                            <>
                                <dt>Matrícula</dt>
                                <dd>{profesional.matricula}</dd>
                            </>
                        )}
                        {profesional.dni && (
                            <>
                                <dt>DNI</dt>
                                <dd>{profesional.dni}</dd>
                            </>
                        )}
                        {profesional.telefono && (
                            <>
                                <dt>Teléfono</dt>
                                <dd>{profesional.telefono}</dd>
                            </>
                        )}
                        {profesional.usuario?.email && (
                            <>
                                <dt>Email</dt>
                                <dd>{profesional.usuario.email}</dd>
                            </>
                        )}
                    </dl>

                    {puedeEditar && (
                        <button type="button" onClick={handleEditar}>
                            Editar
                        </button>
                    )}
                </>
            )}
        </main>
    )
}
