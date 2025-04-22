import {Anchor} from '@mantine/core'
import {Link} from '@remix-run/react'
import appConfig from 'appConfig'
import {TailwindContainer} from '~/components/TailwindContainer'
import {useStoreAppData} from '~/utils/hooks'

export default function Dashboard() {
	const {items} = useStoreAppData()

	return (
		<div className="flex flex-col">
			<SuppliersList />
			{items.length > 0 && <ItemList />}
		</div>
	)
}

function SuppliersList() {
	const {inventories} = useStoreAppData()

	return (
		<div className="bg-white">
			<TailwindContainer>
				<div className="pt-16 pb-10">
					<div className="md:flex md:items-center md:justify-between">
						<h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
							Inventories
						</h2>

						<Anchor
							component={Link}
							to="inventory"
							prefetch="intent"
							className="hidden md:block"
						>
							Browse all inventories<span aria-hidden="true"> &rarr;</span>
						</Anchor>
					</div>

					<div className="mt-12 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-4 sm:gap-x-6 md:grid-cols-4 md:gap-y-0 lg:grid-cols-6 lg:gap-x-8">
						{inventories.map((inventory, index) => {
							if (index >= appConfig.cardsLimit) {
								return null
							}

							return (
								<div
									key={inventory.id}
									className="group relative mx-auto sm:mx-[unset]"
								>
									<div className="overflow-hidden rounded-md bg-gray-200 shadow transition-all">
										<Link
											to={`inventory/${inventory.slug}`}
											prefetch="intent"
											className="overflow-hidden rounded-lg bg-gray-200"
										>
											<img
												src={inventory.image}
												alt={inventory.name}
												className="aspect-square w-full object-cover object-center transition-all group-hover:scale-105"
											/>
										</Link>
									</div>

									<h3 className="mt-4 text-sm text-gray-700">
										<Anchor
											to={`inventory/${inventory.slug}`}
											prefetch="intent"
											component={Link}
										>
											{inventory.name}
										</Anchor>
									</h3>
								</div>
							)
						})}
					</div>

					<div className="mt-8 md:hidden">
						<Anchor component={Link} to="suppliers" prefetch="intent" size="sm">
							Browse all suppliers<span aria-hidden="true"> &rarr;</span>
						</Anchor>
					</div>
				</div>
			</TailwindContainer>
		</div>
	)
}

function ItemList() {
	const {items} = useStoreAppData()

	return (
		<div>
			<TailwindContainer>
				<div className="pt-16 pb-10">
					<div className="md:flex md:items-center md:justify-between">
						<h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
							Items
						</h2>
						<Anchor
							component={Link}
							to="items"
							prefetch="intent"
							className="hidden md:block"
						>
							Browse all Items<span aria-hidden="true"> &rarr;</span>
						</Anchor>
					</div>

					<div className="mt-12 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-4 sm:gap-x-6 md:grid-cols-4 md:gap-y-0 lg:grid-cols-6 lg:gap-x-8">
						{items.map((item, index) => {
							if (index >= appConfig.cardsLimit) {
								return null
							}

							return (
								<div
									key={item.id}
									className="group relative mx-auto sm:mx-[unset]"
								>
									<div className="aspect-square overflow-hidden rounded-md bg-gray-200 shadow group-hover:opacity-75">
										<Link
											to={`items/${item.slug}`}
											prefetch="intent"
											className="overflow-hidden rounded-lg bg-gray-200 group-hover:opacity-75"
										>
											<img
												src={item.image}
												alt={item.name}
												className="w-full object-cover object-center"
											/>
										</Link>
									</div>

									<h3 className="mt-4 text-sm text-gray-700">
										<Anchor
											to={`items/${item.slug}`}
											prefetch="intent"
											component={Link}
										>
											{item.name}
										</Anchor>
									</h3>

									<p className="mt-1 text-sm font-medium text-gray-900">
										${item.price}
									</p>
								</div>
							)
						})}
					</div>

					<div className="mt-8 text-sm md:hidden">
						<Anchor component={Link} to="items" prefetch="intent" size="sm">
							Browse all items<span aria-hidden="true"> &rarr;</span>
						</Anchor>
					</div>
				</div>
			</TailwindContainer>
		</div>
	)
}
