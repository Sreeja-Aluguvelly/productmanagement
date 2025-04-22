import {Role} from '@prisma/client'
import * as bcrypt from 'bcryptjs'

export function round(number: number, precision: number) {
	const d = Math.pow(10, precision)
	return Math.round((number + Number.EPSILON) * d) / d
}

export function titleCase(string: string) {
	string = string.toLowerCase()
	const wordsArray = string.split(' ')

	for (var i = 0; i < wordsArray.length; i++) {
		wordsArray[i] =
			wordsArray[i].charAt(0).toUpperCase() + wordsArray[i].slice(1)
	}

	return wordsArray.join(' ')
}

export function createPasswordHash(password: string) {
	return bcrypt.hash(password, 10)
}

export function roleLookup(role: Role) {
	return {
		[Role.ADMIN]: 'Admin',
		[Role.CUSTOMER]: 'Inventory',
		[Role.STAFF]: 'Supplier',
		[Role.STORE_MANAGER]: 'Store',
	}[role]
}
