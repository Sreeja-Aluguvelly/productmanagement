import {ArrowLeftOnRectangleIcon} from '@heroicons/react/24/solid'

import {ShoppingBagIcon} from '@heroicons/react/24/outline'

import {
	Anchor,
	Avatar,
	Button,
	Divider,
	Drawer,
	Footer,
	Menu,
	PasswordInput,
	ScrollArea,
} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json} from '@remix-run/node'
import {Form, Link, Outlet, useFetcher, useLoaderData} from '@remix-run/react'
import * as React from 'react'
import {TailwindContainer} from '~/components/TailwindContainer'
import {getAllInventories} from '~/lib/supplier.server'
import {requireUser} from '~/session.server'
import {useUser} from '~/utils/hooks'

export type AppLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const user = await requireUser(request)

	const inventories = await getAllInventories()
	const items = inventories.reduce((acc, supplier) => {
		supplier.items.forEach(item => {
			if (item.quantity > 0) {
				acc.push(item)
			}
		})
		return acc
	}, [] as typeof inventories[number]['items'])
	return json({
		inventories,
		items,
		hasResetPassword: user.hasResetPassword,
	})
}

export default function AppLayout() {
	const {user} = useUser()

	const fetcher = useFetcher()
	const {hasResetPassword} = useLoaderData<typeof loader>()
	const [isModalOpen, handleModal] = useDisclosure(!hasResetPassword)

	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (fetcher.type !== 'done') {
			return
		}

		if (!fetcher.data.success) {
			return
		}

		handleModal.close()
	}, [fetcher.data, fetcher.type, handleModal])
	return (
		<>
			<div className="flex h-full flex-col">
				<HeaderComponent />
				<ScrollArea classNames={{root: 'flex-1 bg-gray-50'}}>
					<main>
						<Outlet />
					</main>
				</ScrollArea>

				<FooterComponent />
			</div>

			<Drawer
				opened={isModalOpen}
				onClose={handleModal.close}
				title="Reset Password"
				overlayBlur={3}
				overlayOpacity={0.8}
				padding="xl"
				position="right"
				withCloseButton={false}
				closeOnEscape={false}
				closeOnClickOutside={false}
			>
				<fetcher.Form
					method="post"
					replace
					className="flex flex-col gap-4"
					action="/api/reset-password"
				>
					<div className="mt-6 flex flex-col gap-4">
						<input hidden name="userId" defaultValue={user.id} />
						<PasswordInput
							required
							name="password"
							label="Enter new password"
							placeholder="Password"
						/>

						<Button
							variant="filled"
							type="submit"
							fullWidth
							loading={isSubmitting}
							loaderPosition="right"
						>
							Update
						</Button>
					</div>
				</fetcher.Form>
			</Drawer>
		</>
	)
}

function HeaderComponent() {
	const {user} = useUser()

	return (
		<>
			<Form replace action="/api/auth/logout" method="post" id="logout-form" />
			<header className="flex h-16 items-center border-b border-b-gray-300 py-2">
				<TailwindContainer className="w-full px-10">
					<div className="flex h-full w-full items-center justify-between">
						<div className="flex flex-shrink-0 items-center gap-4">
							<Anchor component={Link} to="/">
								<div className="flex h-10 items-center">
									<p className="flex items-center text-2xl font-bold text-black">
										<span>IMS.</span>
										<span className="ml-1.5 text-sm font-medium">(STORE)</span>
									</p>
								</div>
							</Anchor>
						</div>

						<div className="flex items-center gap-4">
							<Button
								component={Link}
								to="cart"
								title="Cart"
								variant="subtle"
								compact
							>
								View Cart
							</Button>

							<Menu
								position="bottom-start"
								withArrow
								transition="pop-top-right"
							>
								<Menu.Target>
									<button>
										<Avatar color="blue" size="md">
											{user.firstName.charAt(0)}
											{user.lastName.charAt(0)}
										</Avatar>
									</button>
								</Menu.Target>

								<Menu.Dropdown>
									<Menu.Item disabled>
										<p className="mt-0.5 text-sm">{user.inventory?.name}</p>
									</Menu.Item>

									<Divider />

									<Menu.Item disabled>
										<div className="flex flex-col">
											<p>
												{user.firstName} {user.lastName}{' '}
											</p>
											<p className="mt-0.5 text-sm">{user.email}</p>
										</div>
									</Menu.Item>

									<Divider />

									<Menu.Item
										icon={<ShoppingBagIcon className="w- h-4 text-gray-700" />}
										component={Link}
										to="order-history"
									>
										Your orders
									</Menu.Item>
									<Menu.Item
										icon={
											<ArrowLeftOnRectangleIcon className="h-4 w-4 text-gray-700" />
										}
										type="submit"
										form="logout-form"
									>
										Logout
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
						</div>
					</div>
				</TailwindContainer>
			</header>
		</>
	)
}

function FooterComponent() {
	return (
		<Footer height={1} className="flex items-center justify-center text-center">
			<span></span>
		</Footer>
	)
}
