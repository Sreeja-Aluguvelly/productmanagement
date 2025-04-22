import {ShoppingBagIcon} from '@heroicons/react/24/outline'
import {MinusCircleIcon} from '@heroicons/react/24/solid'
import {Badge, Button, Input, Modal, Select} from '@mantine/core'
import {cleanNotifications, showNotification} from '@mantine/notifications'
import {OrderStatus, PaymentMethod} from '@prisma/client'
import type {ActionArgs, LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useFetcher, useLoaderData, useSearchParams} from '@remix-run/react'
import * as React from 'react'
import ReactInputMask from 'react-input-mask'
import {TailwindContainer} from '~/components/TailwindContainer'
import {useSupplierCart} from '~/context/SupplierCartContext'
import {db} from '~/db.server'
import {cancelOrder} from '~/lib/order.server'
import {requireUserId} from '~/session.server'
import {titleCase} from '~/utils/misc'
import {badRequest, unauthorized} from '~/utils/misc.server'

const dateFormatter = new Intl.DateTimeFormat('en-US')

export const loader = async ({request}: LoaderArgs) => {
	const userId = await requireUserId(request)
	const orders = await db.order.findMany({
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

	return json({orders})
}

export const action = async ({request}: ActionArgs) => {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	const intent = formData.get('intent')?.toString()
	if (!userId || !intent) {
		return unauthorized({success: false, message: 'Unauthorized'})
	}

	switch (intent) {
		case 'make-payment':
			{
				const orderId = formData.get('orderId')?.toString()
				if (!orderId) {
					return badRequest({success: false, message: 'Invalid order id'})
				}

				await db.order.update({
					where: {
						id: orderId,
					},
					data: {
						paymentPending: true,
					},
				})
			}

			return json({success: true})

		case 'cancel-order': {
			const orderId = formData.get('orderId')?.toString()
			if (!orderId) {
				return badRequest({success: false, message: 'Invalid order id'})
			}

			return cancelOrder(orderId)
				.then(() => json({success: true}))
				.catch(e => json({success: false, message: e.message}, {status: 500}))
		}

		default:
			return badRequest({success: false, message: 'Invalid intent'})
	}
}
export default function OrderHistory() {
	const {orders} = useLoaderData<typeof loader>()

	const [searchParams, setSearchParams] = useSearchParams()
	const {clearCart} = useSupplierCart()

	React.useEffect(() => {
		const success = searchParams.get('success')
		if (success) {
			clearCart()
			setSearchParams({}, {replace: true})
			return
		}
	}, [clearCart, searchParams, setSearchParams])

	return (
		<>
			<div className="flex flex-col gap-4">
				<div className="bg-white">
					<TailwindContainer>
						<div className="bg-white">
							<div className="py-16 sm:py-24">
								<div className="mx-auto max-w-7xl sm:px-2 lg:px-8">
									<div className="mx-auto max-w-2xl px-4 lg:max-w-4xl lg:px-0">
										<h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
											Order history
										</h1>
										<p className="mt-2 text-sm text-gray-500">
											Check the status of recent orders, manage returns, and
											discover similar products.
										</p>
									</div>
								</div>

								<div className="mt-16">
									<h2 className="sr-only">Recent orders</h2>
									<div className="mx-auto max-w-7xl sm:px-2 lg:px-8">
										<div className="mx-auto max-w-2xl space-y-8 sm:px-4 lg:max-w-4xl lg:px-0">
											{orders.length > 0 ? (
												<>
													{orders.map(order => (
														<Order order={order} key={order.id} />
													))}
												</>
											) : (
												<EmptyState />
											)}
										</div>
									</div>
								</div>
							</div>
						</div>
					</TailwindContainer>
				</div>
			</div>
		</>
	)
}

function EmptyState() {
	return (
		<div className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<ShoppingBagIcon className="mx-auto h-9 w-9 text-gray-500" />
			<span className="mt-4 block text-sm font-medium text-gray-500">
				No previous orders
			</span>
		</div>
	)
}

type ActionData = Partial<{
	success: boolean
	message: string
	discount: number
}>

function Order({
	order,
}: {
	order: SerializeFrom<typeof loader>['orders'][number]
}) {
	const cancelOrder = useFetcher()

	const fetcher = useFetcher<ActionData>()

	const isCancellingOrder = cancelOrder.state !== 'idle'

	const isOrderPending = order.status === OrderStatus.PENDING
	const isOrderCancelled = order.status === OrderStatus.CANCELLED
	const isOrderRejected = order.status === OrderStatus.REJECTED

	const isPaymentPending = order.paymentPending === false

	const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
		PaymentMethod.CREDIT_CARD
	)
	const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false)

	const closePaymentModal = () => setIsPaymentModalOpen(false)
	const showPaymentModal = () => setIsPaymentModalOpen(true)
	const placeOrder = () => {
		fetcher.submit(
			{
				intent: 'make-payment',
				orderId: order.id,
			},
			{
				method: 'post',
				replace: true,
			}
		)
	}

	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (fetcher.type !== 'done') {
			return
		}

		cleanNotifications()
		if (!fetcher.data.success) {
			showNotification({
				title: 'Error',
				message: fetcher.data.message,
				icon: <MinusCircleIcon className="h-7 w-7" />,
				color: 'red',
			})
			return
		} else {
			closePaymentModal()
		}
	}, [fetcher.data, fetcher.type])

	return (
		<>
			<div className="border-b border-t border-gray-200 bg-white shadow-sm sm:rounded-lg sm:border">
				<h3 className="sr-only">
					Order placed on{' '}
					<time dateTime={order.createdAt}>
						{dateFormatter.format(new Date(order.createdAt))}
					</time>
				</h3>

				<div className="flex items-center justify-between px-4 py-6 sm:gap-6 sm:px-6 lg:gap-8">
					<dl className="flex items-center gap-8">
						<div>
							<dt className="font-medium text-gray-900">Order number</dt>
							<dd className="mt-1 text-gray-500">
								{order.id.slice(-6).toUpperCase()}
							</dd>
						</div>

						<div className="hidden sm:block">
							<dt className="font-medium text-gray-900">Date placed</dt>
							<dd className="mt-1 text-gray-500">
								<time dateTime={order.createdAt}>
									{dateFormatter.format(new Date(order.createdAt))}
								</time>
							</dd>
						</div>

						{order.status !== OrderStatus.SUCCESS ? (
							<div>
								<dt className="font-medium text-gray-900">Original amount</dt>
								<dd className="mt-1 font-medium text-gray-900">
									${order.originalAmount.toFixed(2)}
								</dd>
							</div>
						) : null}

						<div>
							<dt className="font-medium text-gray-900">Amount</dt>
							<dd className="mt-1 font-medium text-gray-900">
								${order.quotedAmount.toFixed(2)}
							</dd>
						</div>

						<div className="flex justify-between pt-6 text-gray-900 sm:block sm:pt-0">
							<dt className="font-medium text-gray-900">Status</dt>
							<dd className="mt-1 font-medium text-gray-900">
								<Badge
									color={
										isOrderPending
											? 'blue'
											: isOrderCancelled || isOrderRejected
											? 'red'
											: 'green'
									}
								>
									{isPaymentPending
										? 'Payment Pending'
										: titleCase(order.status)}
								</Badge>
							</dd>
						</div>
					</dl>

					{isOrderPending ? (
						<Button
							color="red"
							variant="outline"
							loaderPosition="right"
							loading={isCancellingOrder}
							onClick={() =>
								cancelOrder.submit(
									{
										intent: 'cancel-order',
										orderId: order.id,
									},
									{method: 'post', replace: true}
								)
							}
						>
							Cancel Quote
						</Button>
					) : null}

					{isPaymentPending ? (
						<Button
							color="red"
							variant="outline"
							loaderPosition="right"
							loading={isSubmitting}
							onClick={() => showPaymentModal()}
						>
							Make Payment
						</Button>
					) : null}
				</div>

				{/* Items */}
				<ul className="divide-y divide-gray-200">
					{order.items.map(({item, quantity}) => (
						<li key={item.id} className="p-4 sm:p-6">
							<div className="flex items-center sm:items-start">
								<img
									src={item.image}
									alt={item.name}
									className="aspect-square h-8 w-8 rounded-full object-cover object-center"
								/>
								<div className="ml-6 flex-1 text-sm">
									<div className="font-medium text-gray-900 sm:flex sm:justify-between">
										<h5>
											{item.name} <i>(x{quantity})</i>
										</h5>
										<p className="mt-2 sm:mt-0">
											${(item.price * quantity).toFixed(2)}
										</p>
									</div>
								</div>
							</div>
						</li>
					))}
				</ul>
			</div>

			<Modal
				opened={isPaymentModalOpen}
				onClose={closePaymentModal}
				title="Payment"
				centered
				overlayBlur={1}
				overlayOpacity={0.5}
			>
				<fetcher.Form method="post" replace className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<h2 className="text-sm text-gray-600">
							<span className="font-semibold">Amount: </span>
							<span>${order.quotedAmount.toFixed(2)}</span>
						</h2>
					</div>

					<Select
						label="Payment method"
						value={paymentMethod}
						clearable={false}
						onChange={e => setPaymentMethod(e as PaymentMethod)}
						data={Object.values(PaymentMethod).map(method => ({
							label: titleCase(method.replace(/_/g, ' ')),
							value: method,
						}))}
					/>

					<Input.Wrapper
						label="Card Number"
						required
						labelProps={{className: '!text-[13px] !font-semibold'}}
					>
						<Input
							name="cardNumber"
							component={ReactInputMask}
							mask="9999 9999 9999 9999"
							placeholder="XXXX XXXX XXXX XXXX"
							alwaysShowMask={false}
							defaultValue="54326787678756467"
						/>
					</Input.Wrapper>

					<div className="flex items-center gap-4">
						<Input.Wrapper
							id={Math.random() + 'cvv'}
							label="CVV"
							labelProps={{className: '!text-[13px] !font-semibold'}}
							required
							className="w-full"
						>
							<Input
								name="cvv"
								id={Math.random() + 'cvv'}
								component={ReactInputMask}
								mask="999"
								placeholder="XXX"
								alwaysShowMask={false}
								defaultValue="123"
							/>
						</Input.Wrapper>

						<Input.Wrapper
							id={Math.random() + 'expiry'}
							label="Expiry"
							labelProps={{className: '!text-[13px] !font-semibold'}}
							required
							className="w-full"
						>
							<Input
								name="Expiry"
								id={Math.random() + 'expiry'}
								component={ReactInputMask}
								mask="99/9999"
								placeholder="XX/XXXX"
								alwaysShowMask={false}
								defaultValue="122026"
							/>
						</Input.Wrapper>
					</div>

					<div className="mt-6 flex items-center gap-4 sm:justify-end">
						<Button
							variant="subtle"
							color="red"
							onClick={() => closePaymentModal()}
						>
							Cancel
						</Button>

						<Button
							variant="filled"
							onClick={() => placeOrder()}
							loading={isSubmitting}
							loaderPosition="right"
						>
							Place order
						</Button>
					</div>
				</fetcher.Form>
			</Modal>
		</>
	)
}
