import {createEmotionCache, MantineProvider} from '@mantine/core'
import {ModalsProvider} from '@mantine/modals'
import {NotificationsProvider} from '@mantine/notifications'
import {StylesPlaceholder} from '@mantine/remix'
import type {
	LinksFunction,
	LoaderArgs,
	MetaFunction,
	SerializeFrom,
} from '@remix-run/node'
import {json} from '@remix-run/node'
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useCatch,
} from '@remix-run/react'
import FourOhFour from './components/404'
import {SupplierCartProvider} from './context/SupplierCartContext'
import {getUser} from './session.server'
import styles from './styles/app.css'
import appConfig from 'appConfig'
import {InventoryCartProvider} from '~/context/InventoryCartContext'

const appendCache = createEmotionCache({key: 'mantine', prepend: false})

export const links: LinksFunction = () => {
	return [{rel: 'stylesheet', href: styles}]
}

export type RootLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const user = await getUser(request)
	return json({user})
}

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: appConfig.name,
	viewport: 'width=device-width,initial-scale=1',
})

export function Document({
	title,
	children,
}: {
	title?: string
	children: React.ReactNode
}) {
	return (
		<MantineProvider withNormalizeCSS emotionCache={appendCache}>
			<html lang="en" className="h-full">
				<head>
					{title ? <title>{title}</title> : null}
					<Meta />
					<Links />
					<StylesPlaceholder />
				</head>
				<body className="h-full">
					{children}
					<ScrollRestoration />
					<Scripts />
					<LiveReload />
				</body>
			</html>
		</MantineProvider>
	)
}

export default function App() {
	return (
		<Document>
			<ModalsProvider>
				<NotificationsProvider autoClose={4000} limit={6}>
					<InventoryCartProvider>
						<SupplierCartProvider>
							<Outlet />
						</SupplierCartProvider>
					</InventoryCartProvider>
				</NotificationsProvider>
			</ModalsProvider>
		</Document>
	)
}

export function CatchBoundary() {
	const caught = useCatch()

	switch (caught.status) {
		case 404:
			return (
				<Document title="Oh no...">
					<FourOhFour />
				</Document>
			)

		default:
			throw new Error(`Unhandled error: ${caught.status}`)
	}
}

// export function ErrorBoundary() {
//   return (
//     <Document>
//       <FourOhFour />
//     </Document>
//   )
// }
