// ==UserScript==
// @name        Nexus Mods: Skip premium download prompt
// @namespace   https://benblank.github.io/user-scripts/
// @version     1.0.0
// @author      Ben "535" Blank
// @description When clicking on a download link, skip the premium upgrade page.
// @homepageURL https://benblank.github.io/user-scripts/scripts/nexusmods-skip-premium-prompt.html
// @supportURL  https://github.com/benblank/user-scripts/issues
// @-icon        https://benblank.github.io/user-scripts/scripts/nexusmods-skip-premium-prompt.icon.png
// @license     BSD-3-Clause
// @copyright   2022 Ben Blank
// @match       https://*.nexusmods.com/*/mods/*
// @require     https://benblank.github.io/user-scripts/libraries/observe-selector.lib.js?v=1.0.0
// @grant       GM.xmlHttpRequest
// @-inject-into content
// ==/UserScript==

/* global observeSelector */

class HandledError extends Error {}

const DOWNLOAD_ENDPOINT = '/Core/Libs/Common/Managers/Downloads?GenerateDownloadUrl';
const FILES_CONTAINER_SELECTOR = 'div#mod_files';
const REQUIREMENTS_POPUP_INDICATOR = 'ModRequirementsPopUp';
const TAB_CONTENT_SELECTOR = 'div.tabcontent-mod-page';

async function changeButtonTargets(filesContainer) {
  return Promise.all(
    [...filesContainer.querySelectorAll('ul.accordion-downloads a.btn')].map(async (button) => {
      let originalTarget = null;

      try {
        originalTarget = button.getAttribute('href');

        // "Disable" the button while waiting.
        button.removeAttribute('href');
        button.style.cursor = 'not-allowed';
        button.style.opacity = '.35';

        // A time-limited download URL must be generated using from Nexus' API.

        const fileId = button.closest('dd')?.dataset.id;

        if (!fileId) {
          console.error('Could not determine the file ID associated with download button', button);

          throw new HandledError();
        }

        const body = new FormData();

        body.set('fid', fileId);
        body.set('game_id', window['current_game_id']);

        const url = (await (await download(DOWNLOAD_ENDPOINT, { method: 'POST', body }))?.json())?.url;

        if (!url) {
          console.error(`Could not get download URL associated with '${originalTarget}'.`);

          throw new HandledError();
        }

        button.setAttribute('href', url);
        button.style.cursor = '';
        button.style.opacity = '';

        if (originalTarget.includes(REQUIREMENTS_POPUP_INDICATOR)) {
          // Replace the button with a clone of itself to remove the event handler which causes the requirements popup
          // to appear instead of navigating.
          button.replaceWith(button.cloneNode(true));
        }
      } catch (error) {
        if (!(error instanceof HandledError)) {
          console.error('Unexpected error while updating download button', button, error);
        }

        // Restore the button, so it at least continues working the way it originally did.
        button.setAttribute('href', originalTarget);
        button.style.cursor = '';
        button.style.opacity = '';
      }
    }),
  );
}

async function download(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    console.error(`Fetching '${url}' failed: ${response.status} ${response.statusText}`, response);

    return undefined;
  }

  return response;
}

observeSelector(FILES_CONTAINER_SELECTOR, document.querySelector(TAB_CONTENT_SELECTOR)).then(
  changeButtonTargets,
  console.error,
);
