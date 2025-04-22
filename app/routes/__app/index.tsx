import {TailwindContainer} from '~/components/TailwindContainer'
import {useAppData} from '~/utils/hooks'

export default function Items() {
	const {myItems} = useAppData()

	return (
		<div className="flex flex-col gap-4">
			<div className="bg-white">
				<TailwindContainer>
					<div className="py-16 sm:py-20">
						<h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
							Products in Inventory
						</h2>

						<div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:gap-x-8">
							{myItems.map(item => (
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
	item: ReturnType<typeof useAppData>['myItems'][number]
}) {
	return (
		<div key={item.id} className="mx-auto sm:mx-[unset]">
			<div className="h-48 overflow-hidden rounded-md bg-gray-200 shadow lg:h-64">
				<img
					src={item.image}
					alt={item.name}
					className="h-full w-full object-cover object-center"
				/>
			</div>

			<h3 className="mt-4 text-base text-gray-700 underline">{item.name}</h3>

			<p className="mt-1 text-sm font-medium text-gray-900">
				<b>Price:</b> ${item.price}
			</p>
			<p className="mt-1 text-sm font-medium text-gray-900">
				<b>Quantity:</b> {item.quantity}
			</p>
		</div>
	)
}
