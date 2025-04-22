import {
	CheckCircleIcon,
	MinusCircleIcon,
	ShoppingCartIcon,
} from '@heroicons/react/24/solid'
import {ActionIcon, Badge, Button, Modal} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import {OrderStatus} from '@prisma/client'
import type {ActionArgs, LoaderArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useLoaderData, useSubmit, useTransition} from '@remix-run/react'
import * as React from 'react'
import invariant from 'tiny-invariant'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/db.server'
import {approveOrder} from '~/lib/order.server'
import {requireUserId} from '~/session.server'
import {titleCase} from '~/utils/misc'

export const loader = async ({request}: LoaderArgs) => {
	const supplierId = await requireUserId(request)

	const orders = await db.order.findMany({
		where: {
			items: {
				some: {
					item: {
						supplierId,
					},
				},
			},
		},
		orderBy: {createdAt: 'desc'},
		include: {
			invoice: true,
			items: {
				include: {
					item: true,
				},
			},
			user: true,
		},
	})

	return json({
		orders,
	})
}

export const action = async ({request}: ActionArgs) => {
	const formData = await request.formData()

	const intent = formData.get('intent')?.toString()
	invariant(intent, 'Invalid intent')

	const orderId = formData.get('orderId')?.toString()
	invariant(orderId, 'Invalid order id')

	switch (intent) {
		case 'cancel-order': {
			await db.order.update({
				where: {id: orderId},
				data: {
					status: OrderStatus.REJECTED,
				},
			})

			return json({success: true})
		}

		case 'approve-order': {
			await approveOrder(orderId)

			return json({success: true})
		}

		default:
			return json({success: false, message: 'Invalid intent'}, {status: 400})
	}
}

export default function Orders() {
	const {orders} = useLoaderData<typeof loader>()

	const transition = useTransition()
	const submit = useSubmit()

	const [items, setProducts] = React.useState<typeof orders[number]['items']>(
		[]
	)
	const [isOpen, modalHandler] = useDisclosure(false, {
		onClose: () => setProducts([]),
	})

	const isSubmitting = transition.state !== 'idle'

	return (
		<>
			<TailwindContainer className="mt-16">
				<div className="px-4 sm:px-6 lg:px-8">
					<div className="sm:flex sm:items-center">
						<div className="sm:flex-auto">
							<h1 className="text-xl font-semibold text-gray-900">Quotes</h1>
						</div>
					</div>
					<div className="mt-8 flex flex-col">
						<div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
							<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
								<div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
									{orders.length > 0 ? (
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
														Original Price
													</th>
													<th
														scope="col"
														className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
													>
														Quoted Price
													</th>
													<th
														scope="col"
														className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
													>
														Status
													</th>
													<th
														scope="col"
														className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
													>
														Products
													</th>
													<th
														scope="col"
														className="relative py-3.5 pl-3 pr-4 sm:pr-6"
													></th>
												</tr>
											</thead>
											<tbody className="divide-y divide-gray-200 bg-white">
												{orders.map(order => {
													const isPending = order.status === OrderStatus.PENDING
													const isCancelled =
														order.status === OrderStatus.CANCELLED
													const isRejected =
														order.status === OrderStatus.REJECTED

													return (
														<tr key={order.id}>
															<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
																<div className="font-medium text-gray-900">
																	{order.user.firstName} {order.user.lastName}
																</div>
																<div className="text-gray-500">
																	{order.user.email}
																</div>
															</td>

															<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
																${order.originalAmount.toFixed(2)}
															</td>
															<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
																${order.quotedAmount.toFixed(2)}
															</td>
															<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
																<Badge
																	color={
																		isPending
																			? 'gray'
																			: isCancelled || isRejected
																			? 'red'
																			: 'green'
																	}
																>
																	{titleCase(order.status)}
																</Badge>
															</td>
															<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
																<Button
																	variant="subtle"
																	compact
																	onClick={() => {
																		setProducts(order.items)
																		modalHandler.open()
																	}}
																>
																	View all
																</Button>
															</td>
															<td className="relative flex items-center justify-center whitespace-nowrap py-4 pl-3 pr-4 text-sm font-medium sm:pr-6">
																<div className="flex items-center gap-2">
																	{isPending ? (
																		<>
																			<ActionIcon
																				color="green"
																				disabled={isSubmitting || !isPending}
																				onClick={() =>
																					submit(
																						{
																							intent: 'approve-order',
																							orderId: order.id,
																						},
																						{
																							method: 'post',
																							replace: true,
																						}
																					)
																				}
																			>
																				<CheckCircleIcon className="h-6" />
																			</ActionIcon>
																			<ActionIcon
																				color="red"
																				type="submit"
																				name="intent"
																				value="cancel-order"
																				disabled={isSubmitting || !isPending}
																				onClick={() => {
																					submit(
																						{
																							intent: 'cancel-order',
																							orderId: order.id,
																						},
																						{
																							method: 'post',
																							replace: true,
																						}
																					)
																				}}
																			>
																				<MinusCircleIcon className="h-7" />
																			</ActionIcon>
																		</>
																	) : null}
																</div>
															</td>
														</tr>
													)
												})}
											</tbody>
										</table>
									) : (
										<div className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
											<ShoppingCartIcon className="mx-auto h-9 w-9 text-gray-500" />
											<span className="mt-4 block text-sm font-medium text-gray-500">
												No quotation placed yet. <br />
												Come back later.
											</span>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</TailwindContainer>

			<Modal
				opened={isOpen && items.length > 0}
				onClose={() => modalHandler.close()}
				size="xl"
				overflow="inside"
				title="Products"
			>
				<>
					<table className="mt-4 w-full text-gray-500 sm:mt-6">
						<caption className="sr-only">Ice-cream</caption>
						<thead className="sr-only text-left text-sm text-gray-500 sm:not-sr-only">
							<tr>
								<th
									scope="col"
									className="py-3 pr-8 font-normal sm:w-2/5 lg:w-1/3"
								>
									Item
								</th>
								<th
									scope="col"
									className="hidden w-1/5 py-3 pr-8 font-normal sm:table-cell"
								>
									Quantity
								</th>
								<th
									scope="col"
									className="hidden py-3 pr-8 font-normal sm:table-cell"
								>
									Price
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 border-b border-gray-200 text-sm sm:border-t">
							{items.map(item => (
								<tr key={item.id}>
									<td className="py-6 pr-8">
										<div className="flex items-center">
											<img
												src={item.item.image}
												alt={item.item.name}
												className="mr-6 h-16 w-16 rounded object-cover object-center"
											/>
											<div className="flex flex-col">
												<div className="font-medium text-gray-900">
													{item.item.name}
												</div>
											</div>
										</div>
									</td>

									<td className="hidden py-6 pr-8 sm:table-cell">
										{item.quantity}
									</td>

									<td className="hidden py-6 pr-8 sm:table-cell">
										${(item.item.price * item.quantity).toFixed(2)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</>
			</Modal>
		</>
	)
}
