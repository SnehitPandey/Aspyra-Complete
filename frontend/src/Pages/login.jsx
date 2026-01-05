import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import OTPInput from "../Components/auth/OTPInput";

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: OTP verification
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate email
      if (!email || !email.includes('@')) {
        throw new Error("Please enter a valid email address");
      }

      // Send OTP
      await authService.sendOTP(email, 'LOGIN');
      
      // Move to OTP verification step
      setStep(2);
      setResendCountdown(60); // Start 60 second countdown
      
    } catch (err) {
      setError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (code) => {
    setIsLoading(true);
    setError("");

    try {
      // Verify OTP
      const response = await authService.verifyOTP(email, code, 'LOGIN');
      
      if (response.success) {
        // Set login flag
        localStorage.setItem('isLoggedIn', 'true');
        // Force reload to current origin + /home
        window.location = window.location.origin + '/home';
      } else {
        throw new Error("Invalid verification code. Please try again.");
      }
      
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return; // Prevent resend if countdown active
    
    setIsLoading(true);
    setError("");

    try {
      await authService.resendOTP(email, 'LOGIN');
      setResendCountdown(60); // Restart countdown
      setError(""); // Clear any previous errors
    } catch (err) {
      setError(err.message || "Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep(1);
    setOtp("");
    setError("");
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    const backendUrl = import.meta.env.VITE_API_BASE_URL;
    console.log('🔍 VITE_API_BASE_URL:', backendUrl);
    console.log('🔍 All env vars:', import.meta.env);
    console.log('🔍 Redirect URL:', `${backendUrl}/api/auth/google`);
    if (!backendUrl) {
      setError('Backend URL not configured. Please contact support.');
      return;
    }
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const GoogleButton = ({ text }) => {
    return (
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-text/20 rounded-xl 
                   bg-background text-text font-medium shadow-sm 
                   hover:bg-alt/50 transition-colors duration-300"
      >
        <img src="/assets/icons/google.png" alt="Google" className="w-5 h-5" />
        {text}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4  transition-colors duration-300">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-background/60 backdrop-blur-lg border border-text/20 space-y-6">
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-2">
            Welcome Back
          </h2>
          <p className="text-text/70">
            {step === 1 
              ? "Sign in to continue your learning journey" 
              : "Enter the verification code sent to your email"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <>
            <GoogleButton text="Continue with Google" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-text/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-text/60">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-text">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className="w-full px-4 py-3 rounded-xl border border-text/20 bg-text/5 text-text 
                             placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary 
                             transition-colors duration-200"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-semibold bg-primary text-alt 
                           hover:bg-primary/90 shadow-lg shadow-primary/25 
                           disabled:opacity-50 disabled:cursor-not-allowed 
                           transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-alt/30 border-t-alt rounded-full animate-spin"></div>
                    Sending code...
                  </div>
                ) : (
                  "Continue with Email"
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-5">
            <div className="text-center">
              <p className="text-sm text-text/70 mb-4">
                Verification code sent to <span className="font-medium text-text">{email}</span>
              </p>
            </div>

            <OTPInput 
              length={6}
              onComplete={handleVerifyOTP}
              loading={isLoading}
              error={error}
            />

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading || resendCountdown > 0}
                className="w-full py-2 text-sm font-medium text-primary hover:text-primary/80 
                           disabled:text-text/40 disabled:cursor-not-allowed transition-colors"
              >
                {resendCountdown > 0 
                  ? `Resend code in ${resendCountdown}s` 
                  : "Resend verification code"}
              </button>

              <button
                type="button"
                onClick={handleBackToEmail}
                className="w-full py-2 text-sm font-medium text-text/70 hover:text-text 
                           transition-colors"
              >
                ← Back to email
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-text/60">
            Don't have an account?{" "}
            <NavLink 
              to="/signup" 
              className="text-primary font-medium hover:text-primary/80 transition-colors"
            >
              Sign Up
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
