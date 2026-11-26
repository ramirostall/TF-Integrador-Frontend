import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    crearProfesional,
    listarProfesionales,
} from '../../services/profesionalService'
import { listarUsuarios } from '../../services/usuarioService'
import type { CrearProfesional } from '../../types/profesional'
import type { Usuario } from '../../types/usuario'
import { obtenerMensajeError } from '../../utils/errores'

type CampoTexto = Exclude<keyof CrearProfesional, 'usuarioId'>

const CAMPOS_TEXTO: { campo: CampoTexto; etiqueta: string }[] = [
    { campo: 'nombre', etiqueta: 'Nombre' },
    { campo: 'apellido', etiqueta: 'Apellido' },
    { campo: 'dni', etiqueta: 'DNI' },
    { campo: 'telefono', etiqueta: 'Teléfono' },
    { campo: 'matricula', etiqueta: 'Matrícula' },
    { campo: 'especialidad', etiqueta: 'Especialidad' },
]

export function CrearProfesionalPage() {
    const navigate = useNavigate()

    const [usuariosDisponibles, setUsuariosDisponibles] = useState<Usuario[]>(
        [],
    )
    const [usuarioId, setUsuarioId] = useState('')
    const [datos, setDatos] = useState<Record<CampoTexto, string>>({
        nombre: '',
        apellido: '',
        dni: '',
        telefono: '',
        matricula: '',
        especialidad: '',
    })
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargandoInicial, setCargandoInicial] = useState(true)
    const [cargando, setCargando] = useState(false)

    useEffect(() => {
        async function cargarUsuarios() {
            try {
                const [usuarios, profesionales] = await Promise.all([
                    listarUsuarios(),
                    listarProfesionales(),
                ])
                const conPerfil = new Set(
                    profesionales.map((profesional) => profesional.usuarioId),
                )
                setUsuariosDisponibles(
                    usuarios.filter(
                        (u) => u.rol === 'PROFESIONAL' && !conPerfil.has(u.id),
                    ),
                )
            } catch (error) {
                setError(
                    obtenerMensajeError(
                        error,
                        'No se pudieron cargar los usuarios.',
                    ),
                )
            } finally {
                setCargandoInicial(false)
            }
        }

        cargarUsuarios()
    }, [])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')
        setMensaje('')
        setCargando(true)

        try {
            await crearProfesional({ usuarioId: Number(usuarioId), ...datos })
            setMensaje('Profesional creado correctamente.')
            setTimeout(() => navigate('/profesionales'), 1500)
        } catch (error) {
            setError(
                obtenerMensajeError(error, 'No se pudo crear el profesional.'),
            )
        } finally {
            setCargando(false)
        }
    }

    return (
        <main>
            <h1>Crear Profesional</h1>

            <p>
                <Link to="/profesionales">Volver al listado</Link>
            </p>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {mensaje && <p className="mensaje-exito">{mensaje}</p>}

            {cargandoInicial ? (
                <p>Cargando usuarios...</p>
            ) : mensaje ? null : usuariosDisponibles.length === 0 ? (
                <p>
                    No hay usuarios con rol PROFESIONAL sin perfil.{' '}
                    <Link to="/usuarios/nuevo">Crear usuario</Link>
                </p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="usuarioId">Usuario</label>
                        <select
                            id="usuarioId"
                            value={usuarioId}
                            onChange={(e) => setUsuarioId(e.target.value)}
                            required
                        >
                            <option value="">Seleccioná un usuario</option>
                            {usuariosDisponibles.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {CAMPOS_TEXTO.map(({ campo, etiqueta }) => (
                        <div key={campo}>
                            <label htmlFor={campo}>{etiqueta}</label>
                            <input
                                id={campo}
                                type="text"
                                value={datos[campo]}
                                onChange={(e) =>
                                    setDatos((actual) => ({
                                        ...actual,
                                        [campo]: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>
                    ))}

                    <button type="submit" disabled={cargando}>
                        {cargando ? 'Creando...' : 'Crear profesional'}
                    </button>
                </form>
            )}
        </main>
    )
}
