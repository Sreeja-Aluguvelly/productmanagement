import {
	ArrowLeftOnRectangleIcon,
	ArrowRightOnRectangleIcon,
	UserPlusIcon,
} from '@heroicons/react/24/solid'

import {Anchor, Avatar, Divider, Menu, ScrollArea} from '@mantine/core'
import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import type {ShouldReloadFunction} from '@remix-run/react'
import {Form, Link, Outlet, useLocation} from '@remix-run/react'
import appConfig from 'appConfig'
import {TailwindContainer} from '~/components/TailwindContainer'
import type {MenuItem} from '~/components/sidebar'
import {Sidebar} from '~/components/sidebar'
import {
	isCustomer,
	isStaff,
	isStoreManager,
	requireUserId,
} from '~/session.server'
import {useOptionalUser} from '~/utils/hooks'
export type AppLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	await requireUserId(request)

	if (await isCustomer(request)) {
		return redirect('/')
	} else if (await isStoreManager(request)) {
		return redirect('/store-manager')
	} else if (await isStaff(request)) {
		return redirect('/supplier')
	}

	return json({})
}

const menuItems: MenuItem[] = [
	{name: 'Supplier', href: '/admin'},
	{name: 'Stores', href: '/admin/stores'},
]

export default function AppLayout() {
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
		</>
	)
}

function HeaderComponent() {
	const location = useLocation()
	const {user} = useOptionalUser()

	return (
		<>
			<Form replace action="/api/auth/logout" method="post" id="logout-form" />
			<header className="max-h-24 bg-indigo-950 py-2">
				<TailwindContainer>
					<div className="flex h-full w-full items-center justify-between">
						<div className="flex flex-shrink-0 items-center gap-4">
							{/* Company logo */}
							<Anchor component={Link} to="/">
								<img
									className="h-12 object-cover object-center"
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
	return <div></div>
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
