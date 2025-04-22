import {
	MinusCircleIcon,
	ShoppingCartIcon,
	XMarkIcon,
} from '@heroicons/react/24/solid'
import {ActionIcon, Button, Input, Modal, Select} from '@mantine/core'
import {cleanNotifications, showNotification} from '@mantine/notifications'
import {PaymentMethod} from '@prisma/client'
import type {ActionArgs} from '@remix-run/node'
import {redirect} from '@remix-run/node'
import {Link, useFetcher} from '@remix-run/react'
import * as React from 'react'
import ReactInputMask from 'react-input-mask'
import {TailwindContainer} from '~/components/TailwindContainer'
import type {InventoryCartItem} from '~/context/InventoryCartContext'
import {useInventoryCart} from '~/context/InventoryCartContext'
import {createStoreOrder} from '~/lib/store-order.server'
import {getUser} from '~/session.server'
import {useOptionalUser} from '~/utils/hooks'
import {titleCase} from '~/utils/misc'
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
		case 'place-order': {
			const stringifiedItems = formData.get('items[]')?.toString()
			const amount = formData.get('amount')?.toString()
			const paymentMethod = formData.get('paymentMethod')?.toString()

			if (!stringifiedItems || !amount || !paymentMethod) {
				return badRequest<ActionData>({
					success: false,
					message: 'Invalid request body',
				})
			}

			const items = JSON.parse(stringifiedItems) as Array<InventoryCartItem>

			await createStoreOrder({
				userId: user.id,
				items,
				amount: Number(amount),
				paymentMethod: paymentMethod as PaymentMethod,
			})

			return redirect('/store/order-history/?success=true')
		}

		default:
			return badRequest<ActionData>({success: false, message: 'Invalid intent'})
	}
}

export default function Cart() {
	const id = React.useId()
	const fetcher = useFetcher<ActionData>()

	const {clearCart, itemsInCart, totalPrice} = useInventoryCart()
	const {user} = useOptionalUser()

	const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
		PaymentMethod.CREDIT_CARD
	)
	const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false)

	const closePaymentModal = () => setIsPaymentModalOpen(false)
	const showPaymentModal = () => setIsPaymentModalOpen(true)
	const placeOrder = () => {
		const formData = new FormData()
		formData.append('items[]', JSON.stringify(itemsInCart))
		formData.append('amount', totalPrice.toString())
		formData.append('intent', 'place-order')
		formData.append('paymentMethod', paymentMethod)
		fetcher.submit(formData, {
			method: 'post',
			replace: true,
		})
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
										Shopping Cart
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
				title="Payment"
				centered
				overlayBlur={1}
				overlayOpacity={0.5}
			>
				<fetcher.Form method="post" replace className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<h2 className="text-sm text-gray-600">
							<span className="font-semibold">Amount: </span>
							<span>${totalPrice.toFixed(2)}</span>
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
						id={id}
						label="Card Number"
						required
						labelProps={{className: '!text-[13px] !font-semibold'}}
					>
						<Input
							id={id}
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
							id={id + 'cvv'}
							label="CVV"
							labelProps={{className: '!text-[13px] !font-semibold'}}
							required
							className="w-full"
						>
							<Input
								name="cvv"
								id={id + 'cvv'}
								component={ReactInputMask}
								mask="999"
								placeholder="XXX"
								alwaysShowMask={false}
								defaultValue="123"
							/>
						</Input.Wrapper>

						<Input.Wrapper
							id={id + 'expiry'}
							label="Expiry"
							labelProps={{className: '!text-[13px] !font-semibold'}}
							required
							className="w-full"
						>
							<Input
								name="Expiry"
								id={id + 'expiry'}
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

function CartItems({showPaymentModal}: {showPaymentModal: () => void}) {
	const {itemsInCart, removeItemFromCart, totalPrice} = useInventoryCart()

	return (
		<div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
			<section aria-labelledby="cart-heading" className="lg:col-span-7">
				<h2 id="cart-heading" className="sr-only">
					Items in your shopping cart
				</h2>

				<ul className="divide-y divide-gray-200 border-b border-t border-gray-200">
					{itemsInCart.map(item => (
						<li key={item.id} className="flex py-6 sm:py-10">
							<div className="flex-shrink-0">
								<img
									src={item.image}
									alt={item.name}
									className="h-24 w-24 rounded-md object-cover object-center sm:h-48 sm:w-48"
								/>
							</div>

							<div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
								<div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
									<div>
										<div className="flex justify-between">
											<h3 className="text-sm">
												<Link
													to={`items/${item.slug}`}
													className="font-medium text-gray-700 hover:text-gray-800"
												>
													{item.name}
												</Link>
											</h3>
										</div>
										<p className="mt-1 text-sm font-medium text-gray-900">
											${item.price.toFixed(2)}
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

			{/* Order summary */}
			<section
				aria-labelledby="summary-heading"
				className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
			>
				<h2 id="summary-heading" className="text-lg font-medium text-gray-900">
					Order summary
				</h2>

				<dl className="mt-6 space-y-4">
					<div className="flex items-center justify-between">
						<dt className="text-sm text-gray-600">Subtotal</dt>
						<dd className="text-sm font-medium text-gray-900">
							${totalPrice.toFixed(2)}
						</dd>
					</div>
					<div className="flex items-center justify-between border-t border-gray-200 pt-4">
						<dt className="text-base font-medium text-gray-900">Order total</dt>
						<dd className="text-base font-medium text-gray-900">
							${totalPrice.toFixed(2)}
						</dd>
					</div>
				</dl>

				<div className="mt-6">
					<Button type="submit" fullWidth onClick={() => showPaymentModal()}>
						Checkout
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
