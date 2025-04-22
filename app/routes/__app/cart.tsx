import {
	MinusCircleIcon,
	ShoppingCartIcon,
	XMarkIcon,
} from '@heroicons/react/24/solid'
import {ActionIcon, Button, Modal, NumberInput} from '@mantine/core'
import {cleanNotifications, showNotification} from '@mantine/notifications'
import type {ActionArgs} from '@remix-run/node'
import {redirect} from '@remix-run/node'
import {Link, useFetcher} from '@remix-run/react'
import * as React from 'react'
import {TailwindContainer} from '~/components/TailwindContainer'
import type {SupplierCartItem} from '~/context/SupplierCartContext'
import {useSupplierCart} from '~/context/SupplierCartContext'
import {createQuote} from '~/lib/order.server'
import {getUser} from '~/session.server'
import {useOptionalUser} from '~/utils/hooks'
import {badRequest, unauthorized} from '~/utils/misc.server'

type ActionData = Partial<{
	success: boolean
	message: string
	discount: number
}>

export async function action({request}: ActionArgs) {
	const formData = await request.formData()

	const user = await getUser(request)
	const intent = formData.get('intent')?.toString()

	if (!user || !intent) {
		return unauthorized({success: false, message: 'Unauthorized'})
	}

	switch (intent) {
		case 'send-quote': {
			const stringifiedItems = formData.get('items[]')?.toString()
			const originalAmount = formData.get('originalAmount')?.toString()
			const quotedAmount = formData.get('quotedAmount')?.toString()

			if (!stringifiedItems || !originalAmount || !quotedAmount) {
				return badRequest<ActionData>({
					success: false,
					message: 'Invalid request body',
				})
			}

			const items = JSON.parse(stringifiedItems) as Array<SupplierCartItem>

			await createQuote({
				userId: user.id,
				inventoryId: user.inventory?.id!,
				items,
				amount: Number(quotedAmount),
				originalAmount: Number(originalAmount),
				quotedAmount: Number(quotedAmount),
			})

			return redirect('/order-history/?success=true')
		}

		default:
			return badRequest<ActionData>({success: false, message: 'Invalid intent'})
	}
}

export default function Cart() {
	const fetcher = useFetcher<ActionData>()

	const {clearCart, itemsInCart, totalPrice} = useSupplierCart()
	const {user} = useOptionalUser()

	const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false)

	const closePaymentModal = () => setIsPaymentModalOpen(false)
	const showPaymentModal = () => setIsPaymentModalOpen(true)

	const sendQuotation = (e: React.FormEvent<HTMLFormElement>) => {
		const formData = new FormData(e.currentTarget)

		formData.append('items[]', JSON.stringify(itemsInCart))
		formData.append('originalAmount', totalPrice.toString())
		formData.append('intent', 'send-quote')
		fetcher.submit(formData, {
			method: 'post',
			replace: true,
		})
		e.preventDefault()
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
		}
	}, [fetcher.data, fetcher.type])

	return (
		<>
			<div className="flex flex-col gap-4">
				<div className="">
					<TailwindContainer>
						<div className="py-16 px-4 sm:px-4 sm:py-20">
							<div className="flex items-center justify-between">
								<div>
									<h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
										Current items
									</h1>
								</div>

								{itemsInCart.length > 0 ? (
									<div className="space-x-2">
										<Button
											variant="outline"
											color="red"
											onClick={() => clearCart()}
											disabled={isSubmitting}
										>
											Clear
										</Button>
									</div>
								) : null}
							</div>

							<div className="mt-16">
								<h2 className="sr-only">Current items in cart</h2>

								<div className="flex flex-col gap-12">
									{itemsInCart.length > 0 ? (
										<CartItems showPaymentModal={showPaymentModal} />
									) : (
										<EmptyState />
									)}
								</div>
							</div>
						</div>
					</TailwindContainer>
				</div>
			</div>

			<Modal
				opened={!!user && isPaymentModalOpen}
				onClose={closePaymentModal}
				title="Quote"
				centered
				overlayBlur={1}
				overlayOpacity={0.5}
			>
				<fetcher.Form
					method="post"
					replace
					className="flex flex-col gap-4"
					onSubmit={e => sendQuotation(e)}
				>
					<div className="flex flex-col gap-2">
						<h2 className="text-sm text-gray-600">
							<span className="font-semibold">Amount: </span>
							<span>${totalPrice.toFixed(2)}</span>
						</h2>
					</div>

					<NumberInput
						name="quotedAmount"
						label="Quotation Price"
						placeholder="Enter quotation amount"
						required
						icon="$"
						defaultValue={totalPrice}
						min={0}
						precision={2}
						step={0.01}
					/>

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
							type="submit"
							loading={isSubmitting}
							loaderPosition="right"
						>
							Send Quote
						</Button>
					</div>
				</fetcher.Form>
			</Modal>
		</>
	)
}

function CartItems({showPaymentModal}: {showPaymentModal: () => void}) {
	const {itemsInCart, removeItemFromCart, totalPrice} = useSupplierCart()

	return (
		<div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
			<section aria-labelledby="cart-heading" className="lg:col-span-7">
				<ul className="divide-y divide-gray-200 border-b border-t border-gray-200">
					{itemsInCart.map(item => (
						<li key={item.id} className="flex py-4">
							<div className="flex-shrink-0">
								<img
									src={item.image}
									alt={item.name}
									className="aspect-square h-10 w-10 rounded-full object-cover"
								/>
							</div>

							<div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
								<div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
									<div>
										<div className="flex justify-between">
											<h3 className="text-sm">
												<Link
													to={`/items/${item.slug}`}
													className="font-medium text-gray-700 hover:text-gray-800"
												>
													{item.name}
												</Link>
											</h3>
										</div>
										<p className="mt-1 text-sm font-medium text-gray-900">
											${item.price.toFixed(2)}/unit
										</p>
									</div>

									<div className="mt-4 sm:mt-0 sm:pr-9">
										<p>{item.quantity}</p>

										<div className="absolute right-0 top-0">
											<button
												type="button"
												className="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500"
											>
												<span className="sr-only">Remove</span>
												<ActionIcon onClick={() => removeItemFromCart(item.id)}>
													<XMarkIcon className="h-5 w-5" aria-hidden="true" />
												</ActionIcon>
											</button>
										</div>
									</div>
								</div>
							</div>
						</li>
					))}
				</ul>
			</section>

			<section
				aria-labelledby="summary-heading"
				className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
			>
				<h2 id="summary-heading" className="text-lg font-medium text-gray-900">
					Quote summary
				</h2>

				<dl className="mt-6 space-y-4">
					<div className="flex items-center justify-between border-t border-gray-200 pt-4">
						<dt className="text-base font-medium text-gray-900">Total</dt>
						<dd className="text-base font-medium text-gray-900">
							${totalPrice.toFixed(2)}
						</dd>
					</div>
				</dl>

				<div className="mt-6">
					<Button type="submit" fullWidth onClick={() => showPaymentModal()}>
						Send Quote
					</Button>
				</div>
			</section>
		</div>
	)
}

function EmptyState() {
	return (
		<div className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<ShoppingCartIcon className="mx-auto h-9 w-9 text-gray-500" />
			<span className="mt-4 block text-sm font-medium text-gray-500">
				Your cart is empty
			</span>
		</div>
	)
}
