import {Button, NumberInput} from '@mantine/core'
import type {LoaderArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useLoaderData} from '@remix-run/react'
import * as React from 'react'
import {useInventoryCart} from '~/context/InventoryCartContext'
import {useInventoryItem} from '~/utils/hooks'

export const loader = async ({params}: LoaderArgs) => {
	const {slug} = params

	if (!slug) {
		throw new Response('No slug provided', {status: 404})
	}

	return json({slug})
}

export default function Item() {
	const {slug} = useLoaderData<typeof loader>()
	const item = useInventoryItem(slug)

	// This scenario is unlikely
	// as the slug is checked in the loader
	if (!item) {
		return null
	}

	return (
		<>
			<div className="flex flex-col gap-4">
				<ItemOverview />
			</div>
		</>
	)
}

function ItemOverview() {
	const {slug} = useLoaderData<typeof loader>()
	const item = useInventoryItem(slug)
	const {addItemToCart} = useInventoryCart()

	const [quantity, setQuantity] = React.useState<number>(1)

	// This scenario is unlikely
	// as the slug is checked in the loader
	if (!item) {
		return null
	}

	return (
		<div>
			<div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-12 lg:px-8">
				{/* Cuisine image */}
				<div className="sm:mt-10 lg:row-span-2 lg:mt-0 lg:self-center">
					<div className="overflow-hidden rounded-lg shadow">
						<img
							src={item.image}
							alt={item.name}
							className="aspect-square w-full object-cover"
						/>
					</div>
				</div>

				{/* Cuisine details */}
				<div className="lg:col-start-2 lg:max-w-lg lg:self-end">
					<div className="mt-4">
						<h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
							{item.name}
						</h1>
					</div>

					<section aria-labelledby="information-heading" className="mt-4">
						<h2 id="information-heading" className="sr-only">
							Cuisine information
						</h2>

						<p className="text-lg text-gray-900 sm:text-xl">${item.price}</p>

						<div className="mt-4 space-y-6">
							<p className="text-base text-gray-500">{item.description}</p>
						</div>
					</section>

					<NumberInput
						label="Quantity"
						className="mt-8"
						placeholder="Choose quantity."
						description="Default quantity is 1"
						value={quantity}
						min={1}
						max={item.quantity}
						onChange={qty => {
							if (!qty || qty < 1) {
								setQuantity(1)
							} else {
								setQuantity(qty)
							}
						}}
						error={quantity === undefined || quantity < 1 ? true : undefined}
					/>
				</div>

				{/* Add to cart button */}
				<div className="mt-10 lg:col-start-2 lg:row-start-2 lg:max-w-lg lg:self-start">
					<Button
						fullWidth
						mt="2.5rem"
						onClick={() =>
							addItemToCart(
								{
									...item,
									quantity,
								},
								item.quantity
							)
						}
					>
						Add to cart
					</Button>
				</div>
			</div>
		</div>
	)
}
