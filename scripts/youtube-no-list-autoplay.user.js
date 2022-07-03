// ==UserScript==
// @name        YouTube: No list autoplay
// @namespace   https://benblank.github.io/user-scripts/
// @version     1.0.0
// @author      Ben "535" Blank
// @description Prevents videos opened from a list autoplaying the next video.
// @homepageURL https://benblank.github.io/user-scripts/scripts/youtube-no-list-autoplay.html
// @supportURL  https://github.com/benblank/user-scripts/issues
// @icon        https://benblank.github.io/user-scripts/scripts/youtube-no-list-autoplay.icon.png
// @license     BSD-3-Clause
// @copyright   2022 Ben Blank
// @match       https://*.youtube.com/*
// @inject-into content
// ==/UserScript==

/** Set the provided observer to look for all new or changed href= attributes.
 *
 * Specifically, document.body and its subtree are observed for changes to child
 * lists and href= attributes.
 *
 * @param {MutationObserver} observer The observer to start.
 */
function observeHref(observer) {
  observer.observe(document.body, { attributes: true, attributeFilter: ['href'], childList: true, subtree: true });
}

/** Remove YouTube's playlist parameters from a node's href= attribute.
 *
 * Removes the list= and index= parameters from href= attributes which point to
 * YouTube's /watch page.
 *
 * If the node isn't an Element, doesn't have an href= attribute, or the href=
 * attribute doesn't point at the /watch page, it is not affected.
 *
 * @param {Node} node The node from which to remove the parameters, if they
 * exist.
 */
function removeListParameters(node) {
  if (!(node instanceof Element) || !node.hasAttribute('href')) {
    // If there's no href= attribute, there's nothing to do.
    return;
  }

  try {
    const url = new URL(node.getAttribute('href'), document.baseURI);

    if (url.pathname === '/watch') {
      // The list= parameter controls "list mode". The index= parameter is
      // simply unnecessary witout list=.
      url.searchParams.delete('index');
      url.searchParams.delete('list');

      node.setAttribute('href', url.href);
    }
  } catch (error) {
    // The href attribute wasn't a valid URL, which doesn't need handled.
  }
}

observeHref(
  new MutationObserver((mutations, observer) => {
    // Disconnect the observer so that it won't observe the changes this script
    // makes to href= attributes.
    observer.disconnect();

    for (const mutation of mutations) {
      switch (mutation.type) {
        case 'attributes':
          removeListParameters(mutation.target);

          break;

        case 'childList':
          mutation.addedNodes.forEach(removeListParameters);

          break;
      }
    }

    observeHref(observer);
  }),
);
