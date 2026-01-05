import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * OAuth Callback Handler
 * This page handles the redirect from OAuth providers (Google)
 * It extracts the token from URL and completes the authentication
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token from URL parameters
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
          // Handle error from OAuth provider
          console.error('OAuth error:', error);
          navigate('/login?error=' + error);
          return;
        }

        if (!token) {
          // No token found
          console.error('No token found in callback');
          navigate('/login?error=no_token');
          return;
        }

        // Store the access token
        localStorage.setItem('accessToken', token);

        // Fetch user data using the new token
        const response = await authService.getCurrentUser();
        
        if (response.success && response.user) {
          // User data successfully fetched
          console.log('✅ User data loaded:', response.user.email);
          // Set login flag
          localStorage.setItem('isLoggedIn', 'true');
          // Force reload to current origin + /home
          window.location = window.location.origin + '/home';
        } else {
          throw new Error('Failed to fetch user data');
        }

        // Note: authService.getCurrentUser() already stores user data via apiClient.setUser()
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mb-4"></div>
        <p className="text-[var(--color-text)] text-lg">Completing sign in...</p>
      </div>
    </div>
  );
}
