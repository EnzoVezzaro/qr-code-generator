import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Layout from './components/layout/layout';

// Pages
import Dashboard from './pages/dashboard';
import Login from './pages/login';
import NotFound from './pages/not-found';

// Features
import EventList from './features/events/EventList';
import EventForm from './features/events/EventForm';
import ParticipantList from './features/participants/ParticipantList';
import QRCodeGenerator from './features/participants/QRCodeGenerator';
import QRCodeDownloader from './features/participants/QRCodeDownloader';
import CheckInScanner from './features/check-in/CheckInScanner';
import EmailTemplateForm from './features/email/EmailTemplateForm';
import Signup from './pages/signup';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; staffAllowed?: boolean }> = ({ 
  children, 
  staffAllowed = false 
}) => {
  const { user, loading } = useAuth();
  console.log('user: ', user, loading);  
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If route requires admin and user is not admin
  if (!staffAllowed && user.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen text-red-500">You're not authorized, you need admin privileges</div>;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute staffAllowed={true}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Events */}
            <Route path="events" element={<EventList />} />
            <Route path="events/new" element={
              <ProtectedRoute>
                <EventForm /> 
              </ProtectedRoute>
            } /> 
            <Route path="events/:eventId" element={<ParticipantList />} />
            <Route path="events/:eventId/edit" element={
              <ProtectedRoute>
                <EventForm isEditing={true} />
              </ProtectedRoute>
            } />
            
            {/* Participants */}
            <Route path="participants" element={
              <ProtectedRoute staffAllowed={true}>
                <ParticipantList />
              </ProtectedRoute>
            } />
            <Route path="events/:eventId/participants" element={<ParticipantList />} />
            
            {/* QR Codes */}
            <Route path="events/:eventId/qr-codes" element={<QRCodeGenerator />} />
            <Route path="events/:eventId/qr-codes/download" element={<QRCodeDownloader />} />
            
            {/* Check-in */}
            <Route path="events/:eventId/check-in" element={
              <ProtectedRoute staffAllowed={true}>
                <div className="p-4">
                  <CheckInScanner eventId=":eventId" />
                </div>
              </ProtectedRoute>
            } />
            
            {/* Email Templates */}
            <Route path="events/:eventId/emails/templates/new" element={
              <ProtectedRoute>
                <EmailTemplateForm />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
