import type {LoaderFunction} from '@remix-run/node'
import {redirect} from '@remix-run/node'
import {Outlet} from '@remix-run/react'
import {getUser} from '~/session.server'

export const loader: LoaderFunction = async ({request}) => {
	const user = await getUser(request)
	if (user) return redirect('/')

	return null
}

export default function AuthLayout() {
	return (
		<>
			<div className="grid min-h-full place-items-center bg-gray-200">
				<div className="flex flex-col justify-center rounded-lg border bg-white py-12 px-4 sm:px-6 lg:px-12">
					<div className="mx-auto w-full max-w-sm lg:w-96">
						<Outlet />
					</div>
				</div>
			</div>
		</>
	)
}
