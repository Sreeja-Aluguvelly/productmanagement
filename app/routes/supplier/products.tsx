import {PlusIcon} from '@heroicons/react/24/solid'
import {Button, Modal, NumberInput, TextInput, Textarea} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import type {ActionFunction, LoaderArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useFetcher, useLoaderData} from '@remix-run/react'
import {ObjectId} from 'bson'
import clsx from 'clsx'
import * as React from 'react'
import {z} from 'zod'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/db.server'
import {requireUserId} from '~/session.server'
import {badRequest} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

export const loader = async ({request}: LoaderArgs) => {
	const supplierId = await requireUserId(request)

	const supplier = await db.supplier.findFirst({
		where: {
			id: supplierId,
		},
		include: {
			items: true,
		},
	})

	const products = supplier?.items ?? []
	return json({products})
}

enum MODE {
	edit,
	add,
}

const ManageProductSchema = z.object({
	productId: z.string().optional(),
	name: z.string().min(1, 'First name is required'),
	image: z.string().min(1, 'Location is required'),
	price: z.preprocess(Number, z.number().min(1, 'Price is required')),
	quantity: z.preprocess(Number, z.number().min(1, 'Quantity is required')),
	description: z.string().min(1, 'Description is required'),
})

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof ManageProductSchema>
}

export const action: ActionFunction = async ({request}) => {
	const supplierId = await requireUserId(request)
	const {fields, fieldErrors} = await validateAction(
		request,
		ManageProductSchema
	)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	const supplier = await db.supplier.findFirst()

	if (!supplier) {
		return badRequest<ActionData>({success: false})
	}

	const id = new ObjectId()

	await db.item.upsert({
		where: {
			id: fields.productId || id.toString(),
		},
		update: {
			name: fields.name,
			image: fields.image,
			price: fields.price,
			quantity: fields.quantity,
			description: fields.description,
			slug: Math.random().toString(36).substring(2, 15),
		},
		create: {
			id: id.toString(),
			name: fields.name,
			image: fields.image,
			price: fields.price,
			quantity: fields.quantity,
			description: fields.description,
			slug: Math.random().toString(36).substring(2, 15),
			supplierId,
		},
	})

	return json({success: true})
}

export default function ManageProducts() {
	const fetcher = useFetcher<ActionData>()
	const {products} = useLoaderData<typeof loader>()

	const [isModalOpen, handleModal] = useDisclosure(false)

	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (fetcher.state !== 'idle' && fetcher.submission === undefined) {
			return
		}

		if (fetcher.data?.success) {
			handleModal.close()
		}
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data?.success, fetcher.state, fetcher.submission])

	const [mode, setMode] = React.useState<MODE>(MODE.edit)

	const [selectedProductId, setSelectedProductId] = React.useState<
		string | null
	>()
	const [selectedProduct, setSelectedProduct] = React.useState<
		typeof products[number] | null
	>(null)

	React.useEffect(() => {
		if (!selectedProductId) {
			setSelectedProduct(null)
			return
		}

		const _product = products.find(v => v.id === selectedProductId)
		if (!_product) return

		setSelectedProduct(_product)
		handleModal.open()
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedProductId])

	React.useEffect(() => {
		if (mode === MODE.add) {
			setSelectedProductId(null)
			setSelectedProduct(null)
		}
	}, [mode])

	return (
		<>
			<TailwindContainer className="rounded-md bg-white">
				<div className="mt-8 px-4 py-10 sm:px-6 lg:px-8">
					<div className="sm:flex sm:flex-auto sm:items-center sm:justify-between">
						<div>
							<h1 className="text-xl font-semibold text-gray-900">
								Manage Products
							</h1>
						</div>
						<div>
							<Button
								variant="outline"
								loading={isSubmitting}
								loaderPosition="left"
								onClick={() => {
									setMode(MODE.add)
									handleModal.open()
								}}
							>
								<PlusIcon className="h-4 w-4" />
								<span className="ml-2">Add Product</span>
							</Button>
						</div>
					</div>

					<div className="mt-8 flex flex-col">
						<div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
							<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
								<table className="min-w-full divide-y divide-gray-300">
									<thead>
										<tr>
											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Name
											</th>

											<th
												scope="col"
												className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Image
											</th>
											<th
												scope="col"
												className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Price
											</th>
											<th
												scope="col"
												className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Quantity
											</th>
											<th
												scope="col"
												className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
											></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{products.map(product => (
											<tr key={product.id}>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{product.name}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													<img
														src={product.image}
														alt=""
														className="aspect-square h-8 w-8 rounded-full"
													/>
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													${product.price}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{product.quantity}
												</td>
												<td className="relative space-x-4 whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0">
													<div className="flex items-center gap-6">
														<Button
															loading={isSubmitting}
															variant="subtle"
															loaderPosition="right"
															onClick={() => {
																setSelectedProductId(product.id)
																setMode(MODE.edit)
															}}
														>
															Edit
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</TailwindContainer>

			<Modal
				opened={isModalOpen}
				onClose={() => {
					setSelectedProductId(null)
					handleModal.close()
				}}
				title={clsx({
					'Edit product': mode === MODE.edit,
					'Add product': mode === MODE.add,
				})}
				centered
				overlayBlur={1.2}
				overlayOpacity={0.6}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input type="hidden" name="productId" value={selectedProduct?.id} />

						<TextInput
							name="name"
							label="Name"
							defaultValue={selectedProduct?.name}
							error={fetcher.data?.fieldErrors?.name}
							required
						/>
						<TextInput
							name="image"
							label="Image"
							defaultValue={selectedProduct?.image}
							error={fetcher.data?.fieldErrors?.image}
							required
						/>

						<Textarea
							name="description"
							label="Description"
							defaultValue={selectedProduct?.description!}
							error={fetcher.data?.fieldErrors?.description}
							required
						/>

						<NumberInput
							name="price"
							label="Price"
							defaultValue={selectedProduct?.price}
							error={fetcher.data?.fieldErrors?.price}
							required
						/>

						<NumberInput
							name="quantity"
							label="Quantity"
							defaultValue={selectedProduct?.quantity}
							error={fetcher.data?.fieldErrors?.quantity}
							required
						/>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => handleModal.close()}
								color="red"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={isSubmitting}
								loaderPosition="right"
							>
								Add Product
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</Modal>
		</>
	)
}
