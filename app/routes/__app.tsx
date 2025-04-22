import {ArrowLeftOnRectangleIcon} from '@heroicons/react/24/solid'

import {Anchor, Avatar, Divider, Footer, Menu, ScrollArea} from '@mantine/core'
import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import {Form, Link, Outlet} from '@remix-run/react'
import appConfig from 'appConfig'
import {TailwindContainer} from '~/components/TailwindContainer'
import {Sidebar, type MenuItem} from '~/components/sidebar'
import {db} from '~/db.server'
import {getAllSuppliers} from '~/lib/supplier.server'
import {isAdmin, isStaff, isStoreManager, requireUserId} from '~/session.server'
import {useOptionalUser} from '~/utils/hooks'

export type AppLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	await requireUserId(request)

	if (await isStaff(request)) {
		return redirect('/supplier')
	}

	if (await isStoreManager(request)) {
		return redirect('/store')
	}

	if (await isAdmin(request)) {
		return redirect('/admin')
	}

	const suppliers = await getAllSuppliers()
	const items = suppliers.reduce((acc, supplier) => {
		supplier.items.forEach(item => acc.push(item))
		return acc
	}, [] as typeof suppliers[number]['items'])

	const myItems = await db.inventoryItem.findMany({})

	return json({
		inventories: suppliers,
		items,
		myItems,
	})
}

const menuItems: MenuItem[] = [
	{name: 'Overview', href: '/'},
	{name: 'Suppliers', href: '/suppliers'},
	{name: 'Quotation', href: '/cart'},
	{name: 'Order History', href: '/order-history'},
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
							<main className="px-12">
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
									) : null}
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
