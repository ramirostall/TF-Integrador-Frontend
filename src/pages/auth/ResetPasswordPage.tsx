import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { restablecerPassword } from '../../services/authService'
import { obtenerMensajeError } from '../../utils/errores'

const MS_REDIRECCION = 2500

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')?.trim() ?? ''

    const [password, setPassword] = useState('')
    const [repetirPassword, setRepetirPassword] = useState('')
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(false)

    const navigate = useNavigate()
    const timeoutRef = useRef<number | undefined>(undefined)

    useEffect(() => {
        return () => {
            window.clearTimeout(timeoutRef.current)
        }
    }, [])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')
        setMensaje('')

        if (password !== repetirPassword) {
            setError('Las contraseñas no coinciden')
            return
        }

        setCargando(true)

        try {
            const respuesta = await restablecerPassword({ token, password })
            setMensaje(respuesta.mensaje)
            timeoutRef.current = window.setTimeout(() => {
                navigate('/login', { replace: true })
            }, MS_REDIRECCION)
        } catch (error) {
            setError(
                obtenerMensajeError(
                    error,
                    'No se pudo restablecer la contraseña. Intentá nuevamente.',
                ),
            )
        } finally {
            setCargando(false)
        }
    }

    if (!token) {
        return (
            <main>
                <h1>Restablecer contraseña</h1>

                <p className="mensaje-error">El enlace es inválido o expiró.</p>

                <p>
                    <Link to="/olvidar-password">
                        Solicitar un nuevo enlace
                    </Link>
                </p>

                <p>
                    <Link to="/login">Volver a iniciar sesión</Link>
                </p>
            </main>
        )
    }

    return (
        <main>
            <h1>Restablecer contraseña</h1>

            <form onSubmit={handleSubmit}>
                <label>
                    Nueva contraseña
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        minLength={8}
                        maxLength={72}
                        required
                    />
                </label>

                <label>
                    Repetir contraseña
                    <input
                        type="password"
                        value={repetirPassword}
                        onChange={(event) =>
                            setRepetirPassword(event.target.value)
                        }
                        minLength={8}
                        maxLength={72}
                        required
                    />
                </label>

                {error && (
                    <p role="alert" className="mensaje-error">
                        {error}
                    </p>
                )}

                {mensaje && <p className="mensaje-exito">{mensaje}</p>}

                <button type="submit" disabled={cargando || Boolean(mensaje)}>
                    {cargando ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
            </form>

            <p>
                <Link to="/login">Volver a iniciar sesión</Link>
            </p>
        </main>
    )
}
