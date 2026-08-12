"use client"

import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function CustomSignUpForm({ className, ...props }: React.ComponentProps<"form">) {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  if (!isLoaded) {
    return null
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!signUp || !setActive) return;

      if (!pendingVerification) {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setIsLoading(false)
          return
        }

        await signUp.create({
          firstName,
          lastName,
          emailAddress,
          password,
        })

        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setPendingVerification(true)
        setIsLoading(false)
      } else {
        const completeSignUp = await signUp.attemptEmailAddressVerification({ code })

        if (completeSignUp.status === 'complete') {
          await setActive({ session: completeSignUp.createdSessionId })
          router.push('/dashboard')
        } else {
          setError('Invalid verification code')
          setIsLoading(false)
        }
      }
    } catch (err: any) {
      console.error(err)
      setError(err.errors?.[0]?.message || 'An error occurred during sign up')
      setIsLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-4", className)} onSubmit={submit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm text-gray-500 mb-2">
            {pendingVerification
              ? 'Enter the verification code sent to your email'
              : 'Fill in the details below to create your account'}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50/50 border border-red-100 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {!pendingVerification ? (
          <>
            {/* First Name & Last Name side by side */}
            <div className="flex gap-3">
              <Field className="flex-1">
                <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                <Input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-blue-50/50 border-gray-200"
                />
              </Field>
              <Field className="flex-1">
                <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                <Input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-blue-50/50 border-gray-200"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                required
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="bg-blue-50/50 border-gray-200"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-blue-50/50 border-gray-200"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-blue-50/50 border-gray-200"
              />
            </Field>

            <Field>
              <Button
                type="submit"
                className="w-full bg-[#8cc63f] hover:bg-[#7ab130] text-white font-bold uppercase tracking-tight"
                disabled={isLoading}
              >
                {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </Button>
            </Field>

            <div className="relative mt-1 mb-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
              onClick={() =>
                signUp.authenticateWithRedirect({
                  strategy: 'oauth_google',
                  redirectUrl: '/sign-up/sso-callback',
                  redirectUrlComplete: '/dashboard',
                })
              }
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>

            <div className="text-center text-sm text-gray-500 mt-2">
              Already have an account?{' '}
              <a href="/sign-in" className="text-[#8cc63f] hover:text-[#7ab130] hover:underline font-medium">
                Sign in
              </a>
            </div>
          </>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="code">Verification Code</FieldLabel>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-blue-50/50 border-gray-200 text-center tracking-widest text-lg"
              />
            </Field>
            <Field>
              <Button
                type="submit"
                className="w-full bg-[#8cc63f] hover:bg-[#7ab130] text-white font-bold uppercase tracking-tight"
                disabled={isLoading}
              >
                {isLoading ? "VERIFYING..." : "VERIFY EMAIL"}
              </Button>
            </Field>
            <Button
              type="button"
              variant="link"
              className="text-gray-500 hover:text-gray-700 text-sm mx-auto"
              onClick={() => {
                setPendingVerification(false)
                setCode('')
                setError('')
              }}
            >
              Back to Sign Up
            </Button>
          </>
        )}
      </FieldGroup>
    </form>
  )
}
