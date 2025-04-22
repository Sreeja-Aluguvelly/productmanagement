import type {User} from '@prisma/client'
import {Role} from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import {db} from '~/db.server'
import {createPasswordHash} from '~/utils/misc'

export async function getUserById(id: User['id']) {
	return db.user.findUnique({
		where: {id},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			inventory: true,
			hasResetPassword: true,
		},
	})
}

export async function getUserByEmail(email: User['email']) {
	return db.user.findUnique({
		where: {email},
		select: {
			firstName: true,
			lastName: true,
			email: true,
			inventory: true,
		},
	})
}

export async function createUser({
	email,
	password,
	firstName,
	lastName,
	role = Role.CUSTOMER,
}: {
	email: User['email']
	password: string
	firstName: User['firstName']
	lastName: User['lastName']
	role?: User['role']
}) {
	return db.user.create({
		data: {
			firstName,
			lastName,
			email,
			inventoryId: '',
			passwordHash: await createPasswordHash(password),
			role,
		},
	})
}

export async function verifyLogin(email: User['email'], password: string) {
	const userWithPassword = await db.user.findUnique({
		where: {email},
	})

	if (!userWithPassword || !userWithPassword.passwordHash) {
		return null
	}

	const isValid = await bcrypt.compare(password, userWithPassword.passwordHash)

	if (!isValid) {
		return null
	}

	const {passwordHash: _password, ...userWithoutPassword} = userWithPassword

	return userWithoutPassword
}
