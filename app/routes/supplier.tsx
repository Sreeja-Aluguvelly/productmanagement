import {
	ArrowLeftOnRectangleIcon,
	ArrowRightOnRectangleIcon,
	UserPlusIcon,
} from '@heroicons/react/24/solid'

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
import {json, redirect} from '@remix-run/node'
import type {ShouldReloadFunction} from '@remix-run/react'
import {
	Form,
	Link,
	Outlet,
	useFetcher,
	useLoaderData,
	useLocation,
} from '@remix-run/react'
import appConfig from 'appConfig'
import {TailwindContainer} from '~/components/TailwindContainer'
import {isCustomer, requireUser} from '~/session.server'
import {useOptionalUser, useUser} from '~/utils/hooks'
import * as React from 'react'
import type {MenuItem} from '~/components/sidebar'
import {Sidebar} from '~/components/sidebar'

export type AppLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const user = await requireUser(request)

	if (await isCustomer(request)) {
		return redirect('/')
	}

	return json({
		hasResetPassword: user.hasResetPassword,
	})
}

const menuItems: MenuItem[] = [
	{name: 'Quotations', href: '/supplier'},
	{name: 'Product', href: '/supplier/products'},
]

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

				<div className="flex flex-grow">
					{/* Sidebar */}
					<div className="w-2/12 overflow-auto">
						<ScrollArea classNames={{root: 'flex-1 bg-indigo-900 h-full'}}>
							<Sidebar menuItems={menuItems} />
						</ScrollArea>
					</div>

					{/* Main Content */}
					<div className="flex flex-grow flex-col">
						<ScrollArea classNames={{root: 'flex-1'}}>
							<main>
								<Outlet />
							</main>
						</ScrollArea>
						<FooterComponent />
					</div>
				</div>
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
	const location = useLocation()
	const {user} = useOptionalUser()

	return (
		<>
			<Form replace action="/api/auth/logout" method="post" id="logout-form" />
			<header className="max-h-28 bg-gray-900 py-8">
				<TailwindContainer>
					<div className="flex h-full w-full items-center justify-between">
						<div className="flex flex-shrink-0 items-center gap-4">
							<Anchor component={Link} to="/">
								<img
									className="h-16 object-cover object-center"
									src={appConfig.logo}
									alt="Logo"
								/>
							</Anchor>
						</div>

						<div className="flex items-center gap-4">
							<Menu
								position="bottom-start"
								withArrow
								transition="pop-top-right"
							>
								<Menu.Target>
									<button>
										{user ? (
											<Avatar color="blue" size="md">
												{user.firstName.charAt(0)}
												{user.lastName.charAt(0)}
											</Avatar>
										) : (
											<Avatar />
										)}
									</button>
								</Menu.Target>

								<Menu.Dropdown>
									{user ? (
										<>
											<Menu.Item disabled>
												<div className="flex flex-col">
													<p>
														{user.firstName}
														{user.lastName}
													</p>
													<p className="mt-0.5 text-sm">{user.email}</p>
												</div>
											</Menu.Item>
											<Divider />

											<Menu.Item
												icon={<ArrowLeftOnRectangleIcon className="h-4 w-4" />}
												type="submit"
												form="logout-form"
											>
												Logout
											</Menu.Item>
										</>
									) : (
										<>
											<Menu.Item
												icon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
												component={Link}
												to={`/login?redirectTo=${encodeURIComponent(
													location.pathname
												)}`}
											>
												Login
											</Menu.Item>
											<Menu.Item
												icon={<UserPlusIcon className="h-4 w-4" />}
												component={Link}
												to={`/register?redirectTo=${encodeURIComponent(
													location.pathname
												)}`}
											>
												Create account
											</Menu.Item>
										</>
									)}
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
		<Footer
			height={44}
			p="md"
			className="flex items-center justify-center py-1 text-center text-sm"
		>
			<span className="text-gray-400">
				©{new Date().getFullYear()} {appConfig.name}, Inc. All rights reserved.
			</span>
		</Footer>
	)
}

export const unstable_shouldReload: ShouldReloadFunction = ({
	submission,
	prevUrl,
	url,
}) => {
	if (!submission && prevUrl.pathname === url.pathname) {
		return false
	}

	return true
}
