import {Anchor, Button} from '@mantine/core'
import {Link} from '@remix-run/react'
import {TailwindContainer} from '~/components/TailwindContainer'
import {useInventoryCart} from '~/context/InventoryCartContext'
import {useStoreAppData} from '~/utils/hooks'

export default function Items() {
	const {items} = useStoreAppData()
	const {addItemToCart} = useInventoryCart()

	return (
		<div className="flex flex-col gap-4">
			<div>
				<TailwindContainer>
					<div className="py-16 sm:py-20">
						<h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
							Items
						</h2>

						<div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
							{items.map(item => {
								return (
									<div key={item.id} className="mx-auto sm:mx-[unset]">
										<div className="h-48 overflow-hidden rounded-md bg-gray-200 shadow lg:h-64">
											<img
												src={item.image}
												alt={item.name}
												className="h-full w-full object-cover object-center"
											/>
										</div>

										<h3 className="mt-4 text-sm text-gray-700">
											<Anchor to={item.slug} prefetch="intent" component={Link}>
												{item.name}
											</Anchor>
										</h3>

										<p className="mt-1 text-sm font-medium text-gray-900">
											${item.price}
										</p>

										<p className="mt-1 text-sm font-medium text-gray-900">
											Quantity: {item.quantity}
										</p>

										<Button
											variant="light"
											fullWidth
											type="submit"
											mt="md"
											onClick={() =>
												addItemToCart({
													...item,
													quantity: 1,
												})
											}
										>
											Add to cart
										</Button>
									</div>
								)
							})}
						</div>
					</div>
				</TailwindContainer>
			</div>
		</div>
	)
}
