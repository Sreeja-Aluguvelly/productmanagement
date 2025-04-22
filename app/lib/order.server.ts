import type {Inventory, Invoice, Order, User} from '@prisma/client'
import {OrderStatus} from '@prisma/client'
import type {SupplierCartItem} from '~/context/SupplierCartContext'
import {db} from '~/db.server'

export function getOrders(userId: User['id']) {
	return db.order.findMany({
		where: {
			userId,
		},
		orderBy: {
			createdAt: 'desc',
		},
		include: {
			invoice: true,
			items: {
				include: {
					item: true,
				},
			},
		},
	})
}

export async function createQuote({
	userId,
	items,
	amount,
	originalAmount,
	quotedAmount,
	inventoryId,
}: {
	userId: User['id']
	inventoryId: Inventory['id']
	items: Array<SupplierCartItem>
	amount: Invoice['amount']
	originalAmount: Order['originalAmount']
	quotedAmount: Order['quotedAmount']
}) {
	return await db.$transaction(async tx => {
		const alreadyExistingInventoryItems = await tx.inventoryItem.findMany({
			where: {
				id: {
					in: items.map(item => item.id),
				},
				inventoryId,
			},
		})

		const itemsToCreate = items.filter(item => {
			const inventoryItem = alreadyExistingInventoryItems.find(
				inventoryItem => inventoryItem.id === item.id
			)

			if (!inventoryItem) {
				return true
			}

			return false
		})

		if (itemsToCreate.length > 0) {
			await tx.inventoryItem.createMany({
				data: itemsToCreate.map(item => ({
					id: item.id,
					quantity: item.quantity,
					inventoryId,
					image: item.image,
					name: item.name,
					price: item.price,
					slug: item.slug,
				})),
			})
		}

		// Update the items that are already present in the inventoryItems
		const itemsToUpdate = alreadyExistingInventoryItems.map(inventoryItem => {
			const item = items.find(item => item.id === inventoryItem.id)
			return {
				...inventoryItem,
				// @ts-expect-error
				quantity: inventoryItem.quantity + item.quantity,
			}
		})

		await Promise.all(
			itemsToUpdate.map(item =>
				tx.inventoryItem.update({
					where: {id: item.id},
					data: {quantity: item.quantity},
				})
			)
		)

		return tx.order.create({
			data: {
				userId,
				status: OrderStatus.PENDING,
				originalAmount,
				quotedAmount,
				items: {
					createMany: {
						data: items.map(item => ({
							itemId: item.id,
							quantity: item.quantity,
						})),
					},
				},
				invoice: {
					create: {
						amount,
						totalAmount: amount,
					},
				},
			},
		})
	})
}

export async function cancelOrder(orderId: Order['id']) {
	const order = await db.order.findUnique({
		where: {
			id: orderId,
		},
		include: {
			items: {
				include: {
					item: true,
				},
			},
		},
	})

	if (!order) {
		throw new Error('Order not found')
	}

	return db.order.update({
		where: {
			id: orderId,
		},
		data: {
			status: OrderStatus.CANCELLED,
		},
	})
}

export async function approveOrder(orderId: Order['id']) {
	const order = await db.order.findUnique({
		where: {
			id: orderId,
		},
		include: {
			items: {
				include: {
					item: true,
				},
			},
		},
	})

	if (!order) {
		throw new Error('Order not found')
	}

	const itemIdsToUpdate = order.items.map(item => item.itemId)

	for (const itemId of itemIdsToUpdate) {
		const _item = order.items.find(item => item.itemId === itemId)

		if (!_item) {
			throw new Error('Item not found')
		}

		await db.item.update({
			where: {
				id: itemId,
			},
			data: {
				quantity: {
					decrement: _item.quantity,
				},
			},
		})
	}

	return db.order.update({
		where: {id: orderId},
		data: {
			status: OrderStatus.SUCCESS,
		},
	})
}
