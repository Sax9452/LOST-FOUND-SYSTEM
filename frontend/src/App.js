import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Layout
import Layout from './components/Layout/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PostItem from './pages/PostItem';
import EditItem from './pages/EditItem';
import ItemDetails from './pages/ItemDetails';
import Search from './pages/Search';
import Items from './pages/Items';
import Dashboard from './pages/Dashboard';
import MyItems from './pages/MyItems';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <ScrollToTop />
        <AuthProvider>
          <AppProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="search" element={<Search />} />
                <Route path="items" element={<Items />} />
                <Route path="items/:id" element={<ItemDetails />} />
                
                {/* Protected Routes */}
                <Route path="post" element={
                  <ProtectedRoute>
                    <PostItem />
                  </ProtectedRoute>
                } />
                <Route path="items/:id/edit" element={
                  <ProtectedRoute>
                    <EditItem />
                  </ProtectedRoute>
                } />
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="my-items" element={
                  <ProtectedRoute>
                    <MyItems />
                  </ProtectedRoute>
                } />
                <Route path="chat" element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } />
                <Route path="notifications" element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } />
                <Route path="profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="admin/*" element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminPanel />
                  </ProtectedRoute>
                } />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Route>
              </Routes>
            </div>
          </AppProvider>
        </AuthProvider>
      </Router>
    </Suspense>
  );
}

export default App;


