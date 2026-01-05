import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "../services/authService";
import OTPInput from "../Components/auth/OTPInput";

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: name+email, 2: OTP verification
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate input
      if (!formData.name || !formData.email) {
        throw new Error("Please fill in all fields");
      }

      if (!formData.email.includes('@')) {
        throw new Error("Please enter a valid email address");
      }

      // Send OTP
      await authService.sendOTP(formData.email, 'SIGNUP');
      
      // Move to OTP verification step
      setStep(2);
      setResendCountdown(60); // Start 60 second countdown
      
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and complete signup
  const handleVerifyOTP = async (code) => {
    setIsLoading(true);
    setError("");

    try {
      // Verify OTP and create account
      const response = await authService.verifyOTP(
        formData.email, 
        code, 
        'SIGNUP',
        formData.name
      );

      if (response.success) {
        // Set login flag
        localStorage.setItem('isLoggedIn', 'true');
        // Force reload to current origin + /home
        window.location = window.location.origin + '/home';
      } else {
        throw new Error("Verification failed. Please try again.");
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
      await authService.resendOTP(formData.email, 'SIGNUP');
      setResendCountdown(60); // Restart countdown
      setError(""); // Clear any previous errors
    } catch (err) {
      setError(err.message || "Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignup = () => {
    setStep(1);
    setError("");
  };

  const handleGoogleSignup = () => {
    // Redirect to backend Google OAuth endpoint
    const backendUrl = import.meta.env.VITE_API_BASE_URL;
    if (!backendUrl) {
      setError('Backend URL not configured. Please contact support.');
      return;
    }
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const GoogleButton = ({ text }) => {
    return (
      <motion.button
        type="button"
        onClick={handleGoogleSignup}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-text/20 rounded-xl 
                   bg-background text-text font-medium shadow-sm 
                   hover:bg-alt/50 transition-colors duration-300"
      >
        <img src="/assets/icons/google.png" alt="Google" className="w-5 h-5" />
        {text}
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 transition-colors duration-300">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <div className="p-8 rounded-2xl shadow-lg bg-background/60 backdrop-blur-lg border border-text/20 space-y-6">
          
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary mb-2">
              {step === 1 ? "Join LearnCurve" : "Verify Your Email"}
            </h2>
            <p className="text-text/70">
              {step === 1 
                ? "Create your account to start learning" 
                : "Enter the verification code sent to your email"}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1: Name and Email */}
          {step === 1 && (
            <>
              <GoogleButton text="Sign up with Google" />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-text/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-text/60">or sign up with email</span>
                </div>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-text">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-text/20 bg-text/5 text-text 
                               placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary 
                               transition-colors duration-200"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-text">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
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
                    "Continue"
                  )}
                </button>

                <p className="text-xs text-text/60 text-center">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-sm text-text/70 mb-4">
                  Verification code sent to <span className="font-medium text-text">{formData.email}</span>
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
                  onClick={handleBackToSignup}
                  className="w-full py-2 text-sm font-medium text-text/70 hover:text-text 
                             transition-colors"
                >
                  ← Back to signup
                </button>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-text/60">
              Already have an account?{" "}
              <NavLink 
                to="/login" 
                className="text-primary font-medium hover:text-primary/80 transition-colors"
              >
                Sign In
              </NavLink>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
