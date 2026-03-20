/**Email OTP login form — enter email, then verify 6-digit code.*/
import { useState } from 'react'
import supabase from '../supabaseClient'

export default function Login() {
  /**Two-step OTP login: email entry, then code verification.*/
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'otp'
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const sendOtp = async (e) => {
    /**Send OTP code to the entered email address.*/
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setSubmitting(false)
    if (error) return setError(error.message)
    setStep('otp')
  }

  const verifyOtp = async (e) => {
    /**Verify the 6-digit OTP code.*/
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    setSubmitting(false)
    if (error) setError(error.message)
  }

  return (
    <div className="login-container">
      <h1>Sign In</h1>
      {step === 'email' ? (
        <form className="login-form" onSubmit={sendOtp}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send Code'}
          </button>
        </form>
      ) : (
        <form className="login-form" onSubmit={verifyOtp}>
          <p className="otp-hint">Enter the 6-digit code sent to {email}</p>
          <input
            className="otp-input"
            type="text"
            inputMode="numeric"
            placeholder="Enter code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Verifying…' : 'Verify'}
          </button>
          <button type="button" className="back-btn" onClick={() => setStep('email')}>
            Back
          </button>
        </form>
      )}
      {error && <p className="login-error">{error}</p>}
    </div>
  )
}
