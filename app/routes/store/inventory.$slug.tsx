import {ShoppingCartIcon} from '@heroicons/react/24/solid'
import {Anchor, Button} from '@mantine/core'
import type {LoaderArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {Link, useLoaderData} from '@remix-run/react'
import {TailwindContainer} from '~/components/TailwindContainer'
import {useInventoryCart} from '~/context/InventoryCartContext'
import {useInventory} from '~/utils/hooks'

export const loader = async ({params}: LoaderArgs) => {
	const {slug} = params

	if (!slug) {
		throw new Response('No slug provided', {status: 404})
	}

	return json({slug})
}

export default function Inventory() {
	return (
		<>
			<div className="flex flex-col gap-4">
				<ItemsGrid />
			</div>
		</>
	)
}

function ItemsGrid() {
	const {slug} = useLoaderData<typeof loader>()
	const inventory = useInventory(slug)
	const {addItemToCart} = useInventoryCart()
	// This scenario is unlikely
	// as the slug is checked in the loader
	if (!inventory) {
		return null
	}

	return (
		<div>
			<TailwindContainer>
				<div className="py-16 sm:py-20">
					<h2 className="mb-6 py-6 text-center text-2xl font-extrabold tracking-tight text-gray-900">
						{inventory.name}
					</h2>

					<div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-3 md:gap-y-0 lg:grid-cols-4 lg:gap-x-8">
						{inventory.items.length > 0 ? (
							<>
								{inventory?.items.map(item => (
									<div
										key={item.id}
										className="group relative mx-auto sm:mx-[unset]"
									>
										<div className="overflow-hidden rounded-md bg-gray-200 shadow">
											<Link
												to={`/items/${item.slug}`}
												prefetch="intent"
												className="overflow-hidden rounded-lg bg-gray-200"
											>
												<img
													src={item.image}
													alt={item.name}
													className="aspect-square w-full object-cover object-center transition-all duration-300 group-hover:scale-105"
												/>
											</Link>
										</div>

										<h3 className="mt-4 text-sm text-gray-700">
											<Anchor
												to={`/items/${item.slug}`}
												prefetch="intent"
												component={Link}
											>
												{item.name}
											</Anchor>
										</h3>

										<p className="mt-1 text-sm font-medium text-gray-900">
											${item.price}
										</p>

										<Button
											variant="light"
											fullWidth
											type="submit"
											mt="md"
											onClick={() =>
												addItemToCart(
													{
														...item,
														quantity: 1,
													},
													item.quantity
												)
											}
										>
											Add to cart
										</Button>
									</div>
								))}
							</>
						) : (
							<div className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
								<ShoppingCartIcon className="mx-auto h-9 w-9 text-gray-500" />
								<span className="mt-4 block text-sm font-medium text-gray-500">
									No items in stock. <br />
									Come back later.
								</span>
							</div>
						)}
					</div>
				</div>
			</TailwindContainer>
		</div>
	)
}
