import {Anchor, Button, NumberInput} from '@mantine/core'
import {Link} from '@remix-run/react'
import {TailwindContainer} from '~/components/TailwindContainer'
import {useSupplierCart} from '~/context/SupplierCartContext'
import {useAppData} from '~/utils/hooks'
import * as React from 'react'

export default function Items() {
	const {items} = useAppData()

	return (
		<div className="flex flex-col gap-4">
			<div className="bg-white">
				<TailwindContainer>
					<div className="py-16 sm:py-20">
						<h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
							Products
						</h2>

						<div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:gap-x-8">
							{items.map(item => (
								<ProductRow key={item.id} item={item} />
							))}
						</div>
					</div>
				</TailwindContainer>
			</div>
		</div>
	)
}

function ProductRow({
	item,
}: {
	item: ReturnType<typeof useAppData>['items'][number]
}) {
	const {addItemToCart} = useSupplierCart()

	const [quantity, setQuantity] = React.useState<number | undefined>(1)

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
				<Anchor to={`/items/${item.slug}`} prefetch="intent" component={Link}>
					{item.name}
				</Anchor>
			</h3>

			<p className="mt-1 text-sm font-medium text-gray-900">${item.price}</p>

			<NumberInput
				value={quantity}
				onChange={setQuantity}
				min={1}
				max={item.quantity}
				mt="md"
			/>
			<Button
				variant="light"
				fullWidth
				type="submit"
				mt="md"
				disabled={!quantity}
				onClick={() => {
					addItemToCart({
						...item,
						quantity: quantity ?? 1,
					})

					setQuantity(1)
				}}
			>
				Add
			</Button>
		</div>
	)
}
