## `observeSelector`

This library provides a single function, `observeSelector`, which is intended as
a simple solution to the problem of userscripts potentially running before the
elements they are interested in have appeared on the page (e.g. on web apps).

### Usage

The only prerequisites for using `observeSelector` are to add the library's
`@require` line to your script (see example below) and that the browser support
the [`MutationObserver` API][mutation-observer] (which nearly all do).

The function takes two arguments. The first is a string containing the CSS-style
query which will obtain your desired element. The second is an _optional_
`Element` to use as the root of the search. If omitted, `document.body` will be
assumed, but choosing an element as far down the tree as possible will reduce
the performance impact of your script.

The promise returned will resolve immediately if an element which matches the
provided selector already exists under the root element or eventually when such
an element appears. The only situation in which the promise will be rejected is
when an error occurs within `observeSelector` itself. If a matching element
never appears, the promise simple remains unresolved.

Example:

```javascript
// ==UserScript==
// @name      My Cool Script
// @namespace https://example.com/
// @match     https://*.example.com/*
// @require   https://benblank.github.io/user-scripts/libraries/onserve-selector.lib.js?v=1.0.0
// ==/UserScript==

// Add the "@require" line above to your own script.

observeSelector('.some.cool.thing', document.querySelector('#where-it-will-be')).then((coolThing) =>
  console.log('It finally appeared!', coolThing),
);
```

[mutation-observer]: https://developer.mozilla.org/en-us/docs/web/api/mutationobserver
