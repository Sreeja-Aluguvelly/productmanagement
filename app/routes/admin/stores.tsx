import {PlusIcon} from '@heroicons/react/24/solid'
import {Button, Modal, PasswordInput, TextInput} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import {Role} from '@prisma/client'
import type {ActionFunction} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useFetcher, useLoaderData} from '@remix-run/react'
import * as React from 'react'
import {z} from 'zod'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/db.server'
import {createPasswordHash} from '~/utils/misc'
import {badRequest} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

const AddStoreSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Location is required'),
	email: z.string().email('Please enter a valid email'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	storeName: z.string().min(1, 'Store name is required'),
	phoneNo: z.string().min(1, 'Phone number is required'),
})

export const loader = async () => {
	const stores = await db.user.findMany({
		where: {role: Role.STORE_MANAGER},
	})

	return json({stores})
}

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof AddStoreSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(request, AddStoreSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	const {email, firstName, lastName, password, storeName, phoneNo} = fields

	await db.user.create({
		data: {
			firstName,
			lastName,
			email,
			storeName,
			phoneNo,
			passwordHash: await createPasswordHash(password),
			role: Role.STORE_MANAGER,
		},
	})

	await db.store.create({
		data: {
			firstName,
			lastName,
			email,
			storeName,
			phoneNo,
			passwordHash: await createPasswordHash(password),
		},
	})
	return json({success: true})
}

export default function ManageStore() {
	const fetcher = useFetcher<ActionData>()
	const {stores} = useLoaderData<typeof loader>()

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

	return (
		<>
			<TailwindContainer className="rounded-md bg-white">
				<div className="mt-8 px-4 py-10 sm:px-6 lg:px-8">
					<div className="sm:flex sm:flex-auto sm:items-center sm:justify-between">
						<div>
							<h1 className="text-3xl font-semibold text-gray-900">
								Manage Stores
							</h1>
						</div>
						<div>
							<Button
								variant="outline"
								loading={isSubmitting}
								loaderPosition="left"
								onClick={() => handleModal.open()}
							>
								<PlusIcon className="h-4 w-4" />
								<span className="ml-2">Add Store</span>
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
												Email
											</th>
											<th
												scope="col"
												className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Store Name
											</th>

											<th
												scope="col"
												className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Phone Number
											</th>
											<th
												scope="col"
												className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
											></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{stores.map(store => (
											<tr key={store.id}>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{store.firstName} ({store.lastName})
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{store.email}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{store.storeName}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{store.phoneNo}
												</td>
												<td className="relative space-x-4 whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0">
													<div className="flex items-center gap-6"></div>
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
				onClose={() => handleModal.close()}
				title="Add Vendor"
				centered
				overlayBlur={1.2}
				overlayOpacity={0.6}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<TextInput
							name="firstName"
							label="Name"
							error={fetcher.data?.fieldErrors?.firstName}
							required
						/>
						<TextInput
							name="lastName"
							label="Last Name"
							error={fetcher.data?.fieldErrors?.lastName}
							required
						/>

						<TextInput
							name="storeName"
							label="Store Name"
							error={fetcher.data?.fieldErrors?.storeName}
							required
						/>

						<TextInput
							name="phoneNo"
							label="Phone Number"
							type="tel"
							error={fetcher.data?.fieldErrors?.phoneNo}
							required
						/>

						<TextInput
							name="email"
							type="email"
							label="Email"
							error={fetcher.data?.fieldErrors?.email}
							required
						/>

						<PasswordInput
							name="password"
							label="Password"
							error={fetcher.data?.fieldErrors?.password}
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
								Add
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</Modal>
		</>
	)
}
