// ==UserScript==
// @name        YouTube: Watched badge
// @namespace   https://userscripts.five35.com/
// @version     1.0
// @author      Ben "535" Blank
// @description Adds or improves "watched" badges on watched videos' thumbnails.
// @license     BSD-3-Clause
// @copyright   2022 Ben Blank
// @match       https://*.youtube.com/*
// @require     https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @inject-into content
// ==/UserScript==

/* globals GM_config */

const BADGE_CSS = `
  .ytwb-badge {
    background-color: var(--yt-spec-static-overlay-background-heavy);
    border-radius: 2px;
    bottom: 0;
    color: var(--yt-spec-static-brand-white);
    font-size: var(--ytd-badge_-_font-size);
    font-weight: var(--ytd-badge_-_font-weight);
    left: 0;
    letter-spacing: 0.5px;
    line-height: var(--ytd-badge_-_line-height);
    margin: 4px;
    padding: 3px 4px;
    position: absolute;
  }
`;

// This is YouTube's built-in watched badge, and may be present on some views.
const YOUTUBE_BADGE_SELECTOR = 'ytd-thumbnail-overlay-playback-status-renderer';

GM_registerMenuCommand('Configure watched badge', () => GM_config.open());

const options = {
  debounce: 50,
  opacity: 0.5,
  threshold: 0.8,
};

function debounce(fn) {
  clearTimeout(fn.timeout);

  fn.timeout = setTimeout(fn, options.debounce);
}

function setBadge(thumbnail) {
  const progress = thumbnail.querySelector('#progress');

  // If the progress bar is absent, parseFloat will return NaN, which always
  // compares false.
  const shouldBeBadged = parseFloat(progress?.style.width) >= options.threshold * 100;

  const badge = thumbnail.querySelector(YOUTUBE_BADGE_SELECTOR) ?? thumbnail.querySelector('.ytwb-badge');
  const img = thumbnail.querySelector('#img');

  if (shouldBeBadged) {
    if (img) {
      img.style.opacity = options.opacity;
    }

    if (!badge) {
      const newBadge = document.createElement('span');

      newBadge.className = 'ytwb-badge';
      newBadge.appendChild(document.createTextNode('WATCHED'));

      thumbnail.querySelector('#overlays')?.appendChild(newBadge);
    }
  } else {
    if (img) {
      img.style.opacity = '';
    }

    if (badge) {
      badge.remove();
    }
  }
}

const css = document.createElement('style');

css.appendChild(document.createTextNode(BADGE_CSS));

document.head.appendChild(css);

const setBadges = debounce(() => {
  Array.from(document.querySelectorAll('ytd-thumbnail')).forEach(setBadge);
});

document.addEventListener('dom-change', setBadges);
document.addEventListener('yt-action', setBadges);
