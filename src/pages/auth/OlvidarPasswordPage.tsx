import { useState } from 'react'
import { Link } from 'react-router-dom'
import { solicitarRecuperacion } from '../../services/authService'
import { obtenerMensajeError } from '../../utils/errores'

export function OlvidarPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')
        setMensaje('')
        setCargando(true)

        try {
            const respuesta = await solicitarRecuperacion(email)
            setMensaje(respuesta.mensaje)
        } catch (error) {
            setError(
                obtenerMensajeError(
                    error,
                    'No se pudo procesar la solicitud. Intentá nuevamente.',
                ),
            )
        } finally {
            setCargando(false)
        }
    }

    return (
        <main>
            <h1>Recuperar contraseña</h1>

            <p>
                Ingresá tu email y te enviaremos un enlace para elegir una nueva
                contraseña.
            </p>

            <form onSubmit={handleSubmit}>
                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </label>

                {error && (
                    <p role="alert" className="mensaje-error">
                        {error}
                    </p>
                )}

                {mensaje && <p className="mensaje-exito">{mensaje}</p>}

                <button type="submit" disabled={cargando}>
                    {cargando ? 'Enviando...' : 'Enviar enlace'}
                </button>
            </form>

            <p>
                <Link to="/login">Volver a iniciar sesión</Link>
            </p>
        </main>
    )
}
