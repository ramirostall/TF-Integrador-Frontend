import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RutaProtegida } from './components/RutaProtegida'
import { RutaPorRol } from './components/RutaPorRol'
import { LoginPage } from './pages/auth/LoginPage'
import { RegistroPacientePage } from './pages/auth/RegistroPacientePage'
import { OlvidarPasswordPage } from './pages/auth/OlvidarPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { InicioPage } from './pages/InicioPage'
import { MiCuentaPage } from './pages/usuarios/MiCuentaPage'
import PerfilPacientePage from './pages/pacientes/PerfilPacientePage'
import { UsuariosPage } from './pages/usuarios/UsuariosPage'
import { CrearUsuarioPage } from './pages/usuarios/CrearUsuarioPage'
import { DetalleUsuarioPage } from './pages/usuarios/DetalleUsuarioPage'
import { PacientesPage } from './pages/pacientes/PacientesPage'
import { DetallePacientePage } from './pages/pacientes/DetallePacientePage'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegistroPacientePage />} />
                <Route
                    path="/olvidar-password"
                    element={<OlvidarPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route
                    path="/"
                    element={
                        <RutaProtegida>
                            <Layout />
                        </RutaProtegida>
                    }
                >
                    <Route index element={<InicioPage />} />

                    <Route path="mi-cuenta" element={<MiCuentaPage />} />

                    <Route
                        path="perfil"
                        element={
                            <RutaPorRol roles={['PACIENTE']}>
                                <PerfilPacientePage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="usuarios"
                        element={
                            <RutaPorRol roles={['ADMIN']}>
                                <UsuariosPage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="usuarios/nuevo"
                        element={
                            <RutaPorRol roles={['ADMIN']}>
                                <CrearUsuarioPage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="usuarios/:id"
                        element={
                            <RutaPorRol roles={['ADMIN']}>
                                <DetalleUsuarioPage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="pacientes"
                        element={
                            <RutaPorRol roles={['ADMIN']}>
                                <PacientesPage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="pacientes/:id"
                        element={
                            <RutaPorRol roles={['ADMIN']}>
                                <DetallePacientePage />
                            </RutaPorRol>
                        }
                    />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
