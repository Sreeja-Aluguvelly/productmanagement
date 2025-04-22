import { z } from 'zod'

const name = z.string().min(1, 'Name is required')
const email = z.string().email('Invalid email')
const password = z.string().min(8, 'Password must be at least 8 characters')

export const LoginSchema = z.object({
  email,
  password,
  remember: z.enum(['on']).optional(),
  redirectTo: z.string().default('/'),
})
