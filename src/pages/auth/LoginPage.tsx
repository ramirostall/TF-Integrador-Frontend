import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { iniciarSesion } from '../../services/authService'
import { obtenerMensajeError } from '../../utils/errores'

export function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    const navigate = useNavigate()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')
        setCargando(true)

        try {
            const resultado = await iniciarSesion({ email, password })

            localStorage.setItem('token', resultado.token)
            localStorage.setItem('usuario', JSON.stringify(resultado.usuario))

            navigate('/')
        } catch (error) {
            setError(
                obtenerMensajeError(
                    error,
                    'No se pudo iniciar sesión. Verificá tus credenciales.',
                ),
            )
        } finally {
            setCargando(false)
        }
    }

    return (
        <main>
            <h1>Iniciar sesión</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">Contraseña</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                <p>
                    <Link to="/olvidar-password">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </p>

                {error && (
                    <p role="alert" className="mensaje-error">
                        {error}
                    </p>
                )}

                <button type="submit" disabled={cargando}>
                    {cargando ? 'Ingresando...' : 'Ingresar'}
                </button>
            </form>

            <p>
                ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
            </p>
        </main>
    )
}
