import {NavLink} from '@remix-run/react'
import clsx from 'clsx'

export interface MenuItem {
	name: string
	href: string
}

export function Sidebar({menuItems}: {menuItems: MenuItem[]}) {
	return (
		<div className="flex grow flex-col gap-y-5 bg-indigo-900 px-6">
			<div className="flex h-16 shrink-0 items-center"></div>
			<nav className="flex flex-1 flex-col">
				<ul className="flex flex-1 flex-col gap-y-7">
					<li>
						<ul className="-mx-2 space-y-1">
							{menuItems.map(item => (
								<li key={item.name}>
									<NavLink
										to={item.href}
										end
										className={({isActive}) =>
											clsx(
												isActive
													? 'bg-indigo-700 text-white'
													: 'text-white hover:bg-indigo-950 hover:text-white',
												'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
											)
										}
									>
										{item.name}
									</NavLink>
								</li>
							))}
						</ul>
					</li>
				</ul>
			</nav>
		</div>
	)
}
