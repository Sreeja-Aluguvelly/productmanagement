import {db} from '~/db.server'

export function getAllSuppliers() {
	return db.supplier.findMany({
		orderBy: {
			name: 'asc',
		},
		include: {
			items: true,
		},
	})
}

export function getAllInventories() {
	return db.inventory.findMany({
		orderBy: {
			name: 'asc',
		},
		include: {
			items: true,
		},
	})
}
