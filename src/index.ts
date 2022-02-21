import * as Differencify from 'differencify'
const differencify = new Differencify()

interface IPage {
	href: string
	title: string
	expectedCode?: number
}

interface IOptions {
	baseURL: string
	cookies?: Record<string, any>
}

interface IViewport {
	width: number
	height: number
}

const viewports: Record<string, Readonly<IViewport>> = {
	phone: { width: 320, height: 1000 },
	tablet: { width: 768, height: 4000 },
	massive: { width: 1440, height: 4000 },

	/*
Desktop
1366 x  768 (22.98%)        
1920 x 1080  (20.7%)        
1536 x  864  (7.92%)       
1440 x  900  (7.23%)       
1280 x  720  (4.46%)       

Phone
 360 x  640   (18.7%)      
 375 x  667   (7.34%)      
 414 x  896   (6.76%)      
 360 x  780   (5.31%)      
 375 x  812   (5.01%)      

Tablet
 768 x 1024  (51.43%)       


Screen Resolution | Market Share (Jan 2021 - Jan 2022)
      1920 x 1080 | 12.15
       414 x  896 |  7.7
      1366 x  768 |  6.48
       375 x  667 |  5.94
       768 x 1024 |  5.29
      1536 x  864 |  4.55
      1440 x  900 |  4.08
       375 x  812 |  3.75
      1280 x  720 |  3.06
       360 x  640 |  2.54
       390 x  844 |  2.47
       360 x  780 |  2.35
       412 x  915 |  2.27
       360 x  800 |  1.95
      1280 x  800 |  1.85
       412 x  869 |  1.71
       360 x  740 |  1.49
       320 x  568 |  1.43
       414 x  736 |  1.39
      2560 x 1440 |  1.38
            Other | 26.15
	*/
}
const ents = Object.entries(viewports)

export async function scan(pages: IPage[], options: IOptions) {
	const { length } = pages
	const results = Array.from({ length })

	await differencify.launchBrowser({ timeout: 0 })
	for (let i = 0; i < length; i++) {
		results[i] = await _scan(pages[i], options)
	}
	await differencify.cleanup()

	return results
}

const waitToScreenShotTime = 100

async function _scan(page: IPage, options: IOptions) {
	console.log(`Scanning "${page.title}"`)
	const visualChanges = Object.fromEntries(
		await Promise.all(
			ents.map(async ([viewportName, viewport]) =>
				ugh(viewportName, page, viewport, options)
			)
		)
	)

	const results = {
		title: page.title,
		visualChanges,
	}

	return results
}

async function ugh(
	viewportName: string,
	page: IPage,
	viewport: Readonly<IViewport>,
	options: IOptions
) {
	let result: boolean
	const chain = differencify.init({
		testName: `page-${viewportName}-${safeFileName(page.title)}`,
		timeout: 0,
	})
	// Because this is "concurrent" and each test can differ in time
	// this can break prior ordering and inavlidate the test
	differencify.testId = 0
	await chain
		.newPage()
		.setViewport(viewport)
		.setCookies(options.cookies || {})
		.goto(new URL(page.href, options.baseURL))
		.wait(waitToScreenShotTime)
		.screenshot()
		.toMatchSnapshot((x) => console.log(x))
		.result((_result) => {
			result = _result
		})
		.close()
		.end()

	return [viewportName, result]
}

/**
 * Creates a file safe string
 * @param str Possibly unsafe url
 */
function safeFileName(str: string): string {
	return str
		.replace(/[^a-z0-9]/gi, '_')
		.toLowerCase()
		.replace(/^_+|_+$/, '')
		.replace(/__+/g, '_')
}
