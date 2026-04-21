import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

// Lazy load components for code splitting
const Topbar = lazy(() => import('./components/Topbar/Topbar'));
const Navbar = lazy(() => import('./components/Navbar/Navbar'));
const Footer = lazy(() => import('./components/Footer/Footer'));
const Loader = lazy(() => import('./components/Loader/Loader'));
const Home = lazy(() => import('./pages/Home/Home'));
const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Register/Register'));
const Tips = lazy(() => import('./pages/Tips/Tips'));
const Payments = lazy(() => import('./pages/Payments/Payments'));
const UserProfile = lazy(() => import('./pages/UserProfile/UserProfile'));
const ListUsers = lazy(() => import('./pages/Admin/ListUsers'));
const EditUser = lazy(() => import('./pages/Admin/EditUser'));
const AdminTips = lazy(() => import('./pages/Admin/AdminTips'));
const EditTip = lazy(() => import('./pages/Admin/EditTip'));
const About = lazy(() => import('./pages/About/About'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  if (loading) return <Loader />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
};

function App() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((reg) => {
            console.log('SW registered:', reg.scope);
          })
          .catch((err) => {
            console.log('SW registration failed:', err);
          });
      });
    }
  }, []);

  return (
    <HelmetProvider>
      <div className="App">
        <Suspense fallback={<Loader />}>
          <Topbar />
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/tips" element={<Tips />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element={<About />} />

              {/* Protected Routes (Authenticated Users) */}
              <Route
                path="/pay"
                element={
                  <ProtectedRoute>
                    <Payments />
                  </ProtectedRoute>
                }
              />

              {/* User Profile - View own profile or view by email */}
              <Route
                path="/profile/:email?"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />

              {/* Edit Profile - For regular users to edit their own profile */}
              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute>
                    <EditUser />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute adminOnly>
                    <ListUsers />
                  </ProtectedRoute>
                }
              />

              {/* Admin Edit User - Edit any user by email */}
              <Route
                path="/users/edit/:email"
                element={
                  <ProtectedRoute adminOnly>
                    <EditUser />
                  </ProtectedRoute>
                }
              />

              {/* Admin Tips Management */}
              <Route
                path="/admin/tips"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminTips />
                  </ProtectedRoute>
                }
              />

              {/* Edit Tip - Pass tip data via state */}
              <Route
                path="/admin/tips/edit"
                element={
                  <ProtectedRoute adminOnly>
                    <EditTip />
                  </ProtectedRoute>
                }
              />

              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </Suspense>
      </div>
    </HelmetProvider>
  );
}

export default App;