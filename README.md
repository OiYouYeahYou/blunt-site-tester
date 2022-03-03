An incredibly blunt website visual regregression testing.

Provide a list of pages to check, then make changes with some safety that you're not making unexected changes.

This is not the whole solution, but a tool to cover basic needs until better testing is implemented.

```js
scan([
	{
		href: "https://example.com/",
		title: "Example dot com",
	},
])
```
