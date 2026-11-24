import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { crearProfesional } from '../../services/profesionalService'
import type { CrearProfesional } from '../../types/profesional'
import { obtenerMensajeError } from '../../utils/errores'

export function CrearProfesionalPage() {
    const [datos, setDatos] = useState<CrearProfesional>({
        nombre: '',
        apellido: '',
        dni: '',
        telefono: '',
        email: '',
        password: '',
        especialidad: '',
        matricula: '',
        activo: true,
    })
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(false)

    const navigate = useNavigate()

    function handleChange(
        campo: keyof CrearProfesional,
        valor: string,
    ) {
        setDatos((actual) => ({ ...actual, [campo]: valor }))
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()
        setError('')
        setMensaje('')
        setCargando(true)

        try {
            await crearProfesional(datos)
            setMensaje('Profesional creado correctamente.')
            setTimeout(() => navigate('/profesionales'), 1500)
        } catch (error) {
            setError(
                obtenerMensajeError(
                    error,
                    'No se pudo crear el profesional.',
                ),
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

            {!mensaje && (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="nombre">Nombre</label>
                        <input
                            id="nombre"
                            type="text"
                            value={datos.nombre}
                            onChange={(e) =>
                                handleChange('nombre', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="apellido">Apellido</label>
                        <input
                            id="apellido"
                            type="text"
                            value={datos.apellido}
                            onChange={(e) =>
                                handleChange('apellido', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="dni">DNI</label>
                        <input
                            id="dni"
                            type="text"
                            value={datos.dni}
                            onChange={(e) => handleChange('dni', e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="telefono">Teléfono</label>
                        <input
                            id="telefono"
                            type="text"
                            value={datos.telefono}
                            onChange={(e) =>
                                handleChange('telefono', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={datos.email}
                            onChange={(e) =>
                                handleChange('email', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={datos.password}
                            onChange={(e) =>
                                handleChange('password', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="especialidad">Especialidad</label>
                        <input
                            id="especialidad"
                            type="text"
                            value={datos.especialidad}
                            onChange={(e) =>
                                handleChange('especialidad', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="matricula">Matrícula</label>
                        <input
                            id="matricula"
                            type="text"
                            value={datos.matricula}
                            onChange={(e) =>
                                handleChange('matricula', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label>
                            <input
                                type="checkbox"
                                checked={datos.activo}
                                onChange={(e) =>
                                    setDatos((actual) => ({
                                        ...actual,
                                        activo: e.target.checked,
                                    }))
                                }
                            />
                            Activo
                        </label>
                    </div>

                    <button type="submit" disabled={cargando}>
                        {cargando ? 'Creando...' : 'Crear profesional'}
                    </button>
                </form>
            )}
        </main>
    )
}
