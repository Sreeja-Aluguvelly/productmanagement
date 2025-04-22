import {ShoppingCartIcon} from '@heroicons/react/24/solid'
import {Button, NumberInput} from '@mantine/core'
import type {Item} from '@prisma/client'
import type {LoaderArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useLoaderData} from '@remix-run/react'
import * as React from 'react'
import {TailwindContainer} from '~/components/TailwindContainer'
import {useSupplierCart} from '~/context/SupplierCartContext'
import {useSupplier} from '~/utils/hooks'

export const loader = async ({params}: LoaderArgs) => {
	const {slug} = params

	if (!slug) {
		throw new Response('No slug provided', {status: 404})
	}

	return json({slug})
}
export default function Supplier() {
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
	const supplier = useSupplier(slug)
	// This scenario is unlikely
	// as the slug is checked in the loader
	if (!supplier) {
		return null
	}

	return (
		<div className="bg-white">
			<TailwindContainer>
				<div className="py-16 sm:py-20">
					<h2 className="mb-6 py-6 text-center text-2xl font-extrabold tracking-tight text-gray-900">
						{supplier.name}
					</h2>

					<div className="px-8">
						<div className="sm:flex sm:items-center">
							<div className="sm:flex-auto">
								<h1 className="text-xl font-semibold text-gray-900">Items</h1>
								<p className="mt-2 text-sm text-gray-700">
									List of all the items
								</p>
							</div>
						</div>
						<div className="mt-8 flex flex-col">
							<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
								<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
									<div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
										{supplier.items.length > 0 ? (
											<table className="min-w-full divide-y divide-gray-300">
												<thead className="bg-gray-50">
													<tr>
														<th
															scope="col"
															className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
														>
															Name
														</th>
														<th
															scope="col"
															className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
														>
															Price/unit
														</th>
														<th
															scope="col"
															className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
														>
															Quantity Available
														</th>
														<th
															scope="col"
															className="relative py-3.5 pl-3 pr-4 sm:pr-6"
														></th>
													</tr>
												</thead>
												<tbody className="divide-y divide-gray-200 bg-white">
													{supplier.items.map(item => {
														return <ItemRow key={item.id} item={item} />
													})}
												</tbody>
											</table>
										) : (
											<div className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
												<ShoppingCartIcon className="mx-auto h-9 w-9 text-gray-500" />
												<span className="mt-4 block text-sm font-medium text-gray-500">
													No items in store yet. <br />
													Come back later.
												</span>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</TailwindContainer>
		</div>
	)
}

function ItemRow({item}: {item: Item}) {
	const {addItemToCart} = useSupplierCart()

	const [quantity, setQuantity] = React.useState(1)

	return (
		<tr key={item.id}>
			<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
				<div className="flex items-center gap-3">
					<img
						src={item.image}
						alt=""
						className="h-6 w-6 rounded-full object-cover"
					/>

					<div className="font-medium text-gray-900">{item.name}</div>
				</div>
			</td>

			<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
				<div className="text-gray-900">${item.price}</div>
			</td>
			<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
				{item.quantity}
			</td>
			<td className="relative flex items-center justify-center whitespace-nowrap py-4 pl-3 pr-4 text-sm font-medium sm:pr-6">
				<div className="flex items-center gap-2">
					<NumberInput
						min={1}
						size="sm"
						max={item.quantity}
						value={quantity}
						onChange={value => setQuantity(value!)}
						onBlur={() => {
							if (quantity > item.quantity) {
								setQuantity(item.quantity)
							}

							if (!quantity) {
								setQuantity(1)
							}
						}}
					/>

					<Button
						compact
						variant="subtle"
						onClick={() =>
							addItemToCart({
								...item,
								quantity,
							})
						}
					>
						Add to Quotation
					</Button>
				</div>
			</td>
		</tr>
	)
}
