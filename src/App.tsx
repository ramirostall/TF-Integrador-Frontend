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
import { EstudiosPage } from './pages/estudios/EstudiosPage'
import { CrearEstudioPage } from './pages/estudios/CrearEstudioPage'
import { DetalleEstudioPage } from './pages/estudios/DetalleEstudioPage'
import { AutorizacionesPage } from './pages/autorizacionEstudios/AutorizacionesPage'
import { CrearAutorizacionPage } from './pages/autorizacionEstudios/CrearAutorizacionPage'
import { DetalleAutorizacionPage } from './pages/autorizacionEstudios/DetalleAutorizacionPage'
import { AgendasPage } from './pages/agendas/AgendasPage'
import { CrearAgendaPage } from './pages/agendas/CrearAgendaPage'
import { DetalleAgendaPage } from './pages/agendas/DetalleAgendaPage'
import { ProfesionalesPage } from './pages/profesionales/ProfesionalesPage'
import { CrearProfesionalPage } from './pages/profesionales/CrearProfesionalPage'
import { DetalleProfesionalPage } from './pages/profesionales/DetalleProfesionalPage'

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

                    <Route
                        path="estudios"
                        element={
                            <RutaPorRol
                                roles={['ADMIN', 'PROFESIONAL', 'PACIENTE']}
                            >
                                <EstudiosPage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="estudios/nuevo"
                        element={
                            <RutaPorRol roles={['ADMIN', 'PACIENTE']}>
                                <CrearEstudioPage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="estudios/:id"
                        element={
                            <RutaPorRol
                                roles={['ADMIN', 'PROFESIONAL', 'PACIENTE']}
                            >
                                <DetalleEstudioPage />
                            </RutaPorRol>
                        }
                    />

                    {/* === Autorizaciones dentro del Layout (barra de arriba) === */}
                    <Route
                        path="autorizaciones"
                        element={
                            <RutaPorRol
                                roles={['ADMIN', 'PROFESIONAL', 'PACIENTE']}
                            >
                                <AutorizacionesPage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="autorizaciones/nuevo"
                        element={
                            <RutaPorRol
                                roles={['ADMIN', 'PROFESIONAL', 'PACIENTE']}
                            >
                                <CrearAutorizacionPage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="autorizaciones/:id"
                        element={
                            <RutaPorRol
                                roles={['ADMIN', 'PROFESIONAL', 'PACIENTE']}
                            >
                                <DetalleAutorizacionPage />
                            </RutaPorRol>
                        }
                    />
                    <Route
                        path="agendas"
                        element={
                            <RutaPorRol
                                roles={['ADMIN', 'PROFESIONAL', 'PACIENTE']}
                            >
                                <AgendasPage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="agendas/nuevo"
                        element={
                            <RutaPorRol roles={['ADMIN']}>
                                <CrearAgendaPage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="agendas/:id"
                        element={
                            <RutaPorRol
                                roles={['ADMIN', 'PROFESIONAL', 'PACIENTE']}
                            >
                                <DetalleAgendaPage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="profesionales"
                        element={
                            <RutaPorRol
                                roles={['ADMIN', 'PROFESIONAL']}
                            >
                                <ProfesionalesPage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="profesionales/nuevo"
                        element={
                            <RutaPorRol roles={['ADMIN']}>
                                <CrearProfesionalPage />
                            </RutaPorRol>
                        }
                    />

                    <Route
                        path="profesionales/:id"
                        element={
                            <RutaPorRol
                                roles={['ADMIN', 'PROFESIONAL']}
                            >
                                <DetalleProfesionalPage />
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
