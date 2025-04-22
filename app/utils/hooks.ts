import type {Item, Supplier} from '@prisma/client'
import {useMatches} from '@remix-run/react'
import * as React from 'react'
import type {RootLoaderData} from '~/root'
import type {AppLoaderData} from '~/routes/__app'
/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} routeId The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
	routeId: string
): Record<string, unknown> | undefined {
	const matchingRoutes = useMatches()

	const route = React.useMemo(
		() => matchingRoutes.find(route => route.id === routeId),
		[matchingRoutes, routeId]
	)
	return route?.data
}

export function useOptionalUser() {
	return useMatchesData('root') as RootLoaderData
}

export function useAppData() {
	return useMatchesData('routes/__app') as AppLoaderData
}

export function useStoreAppData() {
	return useMatchesData('routes/store') as AppLoaderData
}

export function useInventory(slug: Supplier['slug']) {
	const {inventories: suppliers} = useStoreAppData()
	const supplier = suppliers.find(supplier => supplier.slug === slug)

	return supplier
}

export function useInventoryItem(slug: Item['slug']) {
	const {items} = useStoreAppData()
	const item = items.find(item => item.slug === slug)

	return item
}

export function useUser() {
	const {user} = useOptionalUser()
	if (!user) {
		throw new Error('You must be logged in to use this hook')
	}

	return {user}
}

export function useSupplier(slug: Supplier['slug']) {
	const {inventories: suppliers} = useAppData()
	const supplier = suppliers.find(supplier => supplier.slug === slug)

	return supplier
}

export function useItem(slug: Item['slug']) {
	const {items} = useAppData()
	const item = items.find(item => item.slug === slug)

	return item
}

type ReturnType<T> = [T, React.Dispatch<React.SetStateAction<T>>]
export function useLocalStorageState<T>({
	key,
	defaultValue,
}: {
	key: string
	defaultValue: T
}): ReturnType<T> {
	const [value, setValue] = React.useState<T>(defaultValue)

	React.useEffect(() => {
		const localStorageValue = window.localStorage.getItem(key)

		if (!localStorageValue) {
			setValue(defaultValue)
			return
		}

		setValue(JSON.parse(localStorageValue))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	React.useEffect(() => {
		window.localStorage.setItem(key, JSON.stringify(value))
	}, [key, value])

	return [value, setValue]
}
