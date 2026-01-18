import { Prisma } from '@prisma/client'
import { hash } from 'bcryptjs'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { sendSignupWelcomeEmail } from '@/lib/notificationEmails'
import { US_STATES } from '@/lib/us-states'

function getStringValue(value: FormDataEntryValue | null): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }

  return null
}

function buildErrorRedirect(request: Request, message: string) {
  const url = new URL('/register', request.url)
  url.searchParams.set('error', message)
  return NextResponse.redirect(url, { status: 303 })
}

export async function POST(request: Request) {
  const formData = await request.formData()

  const firstName = getStringValue(formData.get('first_name'))
  const lastName = getStringValue(formData.get('last_name'))
  const email = getStringValue(formData.get('email'))?.toLowerCase()
  const password = getStringValue(formData.get('password'))
  const phone = getStringValue(formData.get('phone'))
  const referralSource = getStringValue(formData.get('referral_source'))
  const street = getStringValue(formData.get('street'))
  const city = getStringValue(formData.get('city'))
  const state = getStringValue(formData.get('state'))
  const postalCode = getStringValue(formData.get('postal_code'))
  const acceptedTerms = formData.get('terms')

  if (!firstName || !lastName || !email || !password) {
    return buildErrorRedirect(request, 'Please complete all required fields.')
  }

  if (!street || !city || !state || !postalCode) {
    return buildErrorRedirect(request, 'Please provide a complete service address.')
  }

  if (acceptedTerms !== 'on') {
    return buildErrorRedirect(
      request,
      'Please review and accept the Terms of Service to continue.',
    )
  }

  if (password.length < 8) {
    return buildErrorRedirect(
      request,
      'Passwords need to be at least 8 characters long.'
    )
  }

  const normalizedState = state.toUpperCase()
  const normalizedPostalCode = postalCode.replace(/\s+/g, '')

  const isValidState = US_STATES.some((entry) => entry.value === normalizedState)
  if (!isValidState) {
    return buildErrorRedirect(request, 'Please choose a valid U.S. state.')
  }

  if (!/^\d{5}(?:-?\d{4})?$/.test(normalizedPostalCode)) {
    return buildErrorRedirect(
      request,
      'Please provide a valid 5 or 9 digit ZIP code.'
    )
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return buildErrorRedirect(
        request,
        'An account with that email already exists. Try signing in instead.'
      )
    }

    const hashedPassword = await hash(password, 12)

    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        phone,
        hashedPassword,
        referralSource,
        addresses: {
          create: {
            label: 'Home',
            street,
            city,
            state: normalizedState,
            postalCode: normalizedPostalCode,
          },
        },
      },
    })

    try {
      await sendSignupWelcomeEmail({
        to: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      })
    } catch (error) {
      console.error('Failed to send signup welcome email', error)
    }

    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('registered', '1')
    redirectUrl.searchParams.set('email', email)
    return NextResponse.redirect(redirectUrl, { status: 303 })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return buildErrorRedirect(
        request,
        'That email is already in use. Please sign in or use a different email.'
      )
    }

    console.error('Failed to register user', error)
    return buildErrorRedirect(
      request,
      'We ran into a problem creating your account. Please try again.'
    )
  }
}
