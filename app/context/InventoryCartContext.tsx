import {
	CheckCircleIcon,
	InformationCircleIcon,
	MinusCircleIcon,
} from '@heroicons/react/24/solid'
import {Button} from '@mantine/core'
import {
	cleanNotifications,
	hideNotification,
	showNotification,
} from '@mantine/notifications'
import type {Item} from '@prisma/client'
import {Link} from '@remix-run/react'
import * as React from 'react'
import {useLocalStorageState} from '~/utils/hooks'
import type {DateToString} from '~/utils/types'

const LocalStorageKey = 'warehouse-management-inventory-cart'

export type InventoryCartItem = DateToString<Item>

interface ICartContext {
	itemsInCart: Array<InventoryCartItem>
	addItemToCart: (item: InventoryCartItem, maxQuantity?: number) => void
	removeItemFromCart: (itemId: InventoryCartItem['id']) => void
	clearCart: () => void
	totalPrice: number
}

const SupplierCartContext = React.createContext<ICartContext | undefined>(
	undefined
)

export function InventoryCartProvider({children}: {children: React.ReactNode}) {
	const [items, setItems] = useLocalStorageState<InventoryCartItem[]>({
		key: LocalStorageKey,
		defaultValue: [],
	})

	const totalPrice = items.reduce(
		(acc, item) => acc + item.price * item.quantity,
		0
	)

	const clearCart = React.useCallback(() => {
		cleanNotifications()
		setItems([])
		showNotification({
			title: 'Successfully cleared',
			message: 'All items in the cart are cleared',
			icon: <CheckCircleIcon className="h-7 w-7" />,
			color: 'green',
		})
	}, [setItems])

	const addItemToCart = React.useCallback(
		(item: InventoryCartItem, maxQuantity?: number) => {
			const isOrderFromDifferentRestaurant = items.some(
				cartItem => cartItem.supplierId !== item.supplierId
			)
			const isAlreadyInCart = items.some(i => i.id === item.id)

			const currentItemQuantity =
				items.find(i => i.id === item.id)?.quantity ?? 0

			if (maxQuantity && currentItemQuantity + item.quantity > maxQuantity) {
				setItems(prevItems => {
					const newItems = [...prevItems]

					const index = newItems.findIndex(i => i.id === item.id)
					if (index > -1) {
						newItems[index].quantity = maxQuantity
					}

					return newItems
				})

				showNotification({
					title: 'Quantity exceeded',
					message: `Quantity cannot be more than ${maxQuantity}`,
					color: 'red',
					icon: <InformationCircleIcon className="h-9 w-9" />,
					autoClose: false,
				})
				return
			}

			cleanNotifications()

			if (isOrderFromDifferentRestaurant) {
				showNotification({
					id: 'different-inventory',
					title: 'Order from different inventory',
					message: (
						<div className="space-y-2">
							<span>You can only order from one inventory at a time</span>
							<div className="flex items-center gap-4">
								<Button
									variant="subtle"
									color="red"
									onClick={async () => {
										clearCart()
										hideNotification('different-inventory')
									}}
								>
									Clear previous order
								</Button>

								<Button
									component={Link}
									color="blue"
									to="/cart"
									size="sm"
									onClick={() => hideNotification('different-inventory')}
								>
									View cart
								</Button>
							</div>
						</div>
					),
					color: 'blue',
					icon: <InformationCircleIcon className="h-9 w-9" />,
					autoClose: false,
				})
				return
			}

			if (!isAlreadyInCart) {
				setItems(prev => [...prev, item])
				showNotification({
					title: 'Successfully added',
					message: `Added ${item.name} to cart`,
					color: 'green',
					icon: <CheckCircleIcon className="h-9 w-9" />,
				})
				return
			}

			setItems(prevItems => {
				const newItems = [...prevItems]

				const index = newItems.findIndex(i => i.id === item.id)
				if (index > -1) {
					newItems[index].quantity = newItems[index].quantity + item.quantity
				}

				return newItems
			})

			showNotification({
				title: 'Item already present in cart',
				message: `Quantity increased by ${item.quantity}`,
				icon: <CheckCircleIcon className="h-7 w-7" />,
				color: 'green',
			})
		},
		[clearCart, items, setItems]
	)

	const removeItemFromCart = (itemId: InventoryCartItem['id']) => {
		setItems(prev => prev.filter(item => item.id !== itemId))
		showNotification({
			title: 'Successfully removed',
			message: 'Item removed from cart',
			icon: <MinusCircleIcon className="h-7 w-7" />,
			color: 'red',
		})
	}

	return (
		<SupplierCartContext.Provider
			value={{
				itemsInCart: items,
				totalPrice,
				addItemToCart,
				removeItemFromCart,
				clearCart,
			}}
		>
			{children}
		</SupplierCartContext.Provider>
	)
}

export function useInventoryCart() {
	const context = React.useContext(SupplierCartContext)
	if (!context) {
		throw new Error('`useCart()` must be used within a <CartProvider />')
	}

	return context
}
