import {Anchor} from '@mantine/core'
import {Link} from '@remix-run/react'
import {TailwindContainer} from '~/components/TailwindContainer'
import {useStoreAppData} from '~/utils/hooks'

export default function Inventories() {
	const {inventories} = useStoreAppData()

	return (
		<div className="flex flex-col gap-4">
			<div>
				<TailwindContainer>
					<div className="py-16 sm:py-20">
						<h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
							Inventories
						</h2>

						<div className="mt-12 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
							{inventories.map(inventory => {
								return (
									<div
										key={inventory.id}
										className="group relative mx-auto sm:mx-[unset]"
									>
										<div className="aspect-square h-48 overflow-hidden rounded-md bg-gray-200 shadow lg:h-64">
											<img
												src={inventory.image}
												alt={inventory.name}
												className="h-full w-full object-cover object-center transition-all group-hover:scale-105"
											/>
										</div>

										<h3 className="mt-4 text-sm text-gray-700">
											{inventory.name}
										</h3>
										<Anchor
											to={inventory.slug}
											prefetch="intent"
											component={Link}
											className="absolute inset-0 cursor-pointer"
										></Anchor>
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
