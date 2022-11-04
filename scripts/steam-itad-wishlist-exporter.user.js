// ==UserScript==
// @name        Steam → ITAD Wishlist Exporter
// @namespace   https://benblank.github.io/user-scripts/
// @version     1.0.0
// @author      Ben "535" Blank
// @description Adds links to the Steam wishlist and followed pages to export in IsThereAnyDeal.com format.
// @homepageURL https://benblank.github.io/user-scripts/scripts/steam-itad-wishlist-exporter.html
// @supportURL  https://github.com/benblank/user-scripts/issues
// @-icon        https://benblank.github.io/user-scripts/scripts/steam-itad-wishlist-exporter.icon.png
// @license     BSD-3-Clause
// @copyright   2022 Ben Blank
// @match       https://steamcommunity.com/id/*/followedgames
// @match       https://steamcommunity.com/profiles/*/followedgames
// @match       https://store.steampowered.com/wishlist/id/*
// @match       https://store.steampowered.com/wishlist/profiles/*
// @require     https://benblank.github.io/user-scripts/libraries/observe-selector.lib.js?v=1.0.0
// @grant       none
// @-inject-into content
// ==/UserScript==

/* global observeSelector */

function createButtons() {
  const isWishlist = location.pathname.startsWith('/wishlist/');

  function getData() {
    const data = [];

    if (isWishlist) {
      const g_rgAppInfo = window.eval('g_rgAppInfo');
      for (const appid in g_rgAppInfo) {
        const appInfo = g_rgAppInfo[appid];
        data.push({
          gameid: ['steam', 'app/' + appid],
          title: appInfo.name,
          url: `https://store.steampowered.com/app/${appid}/`,
          release_date: appInfo.release_string,
        });
      }
    } else {
      for (const element of document.querySelectorAll(`[data-appid]`)) {
        data.push({
          gameid: ['steam', 'app/' + element.dataset.appid],
          title: element.querySelector('.gameListRowItemName').textContent.trim(),
          url: `https://store.steampowered.com/app/${element.dataset.appid}/`,
        });
      }
    }

    return data;
  }

  const file = JSON.stringify({ version: '02', data: getData() });
  const filename = `${new Date().toISOString().substring(0, 10)}.waitlist.json`;

  const template = document.createElement('template');
  template.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <form action="https://isthereanydeal.com/waitlist/import/" method="post" target="_blank" style="display: inline-block;">
        <input type="hidden" name="file" value="${btoa(encodeToUtf8(file))}">
        <button class="btnv6_blue_hoverfade btn_small" type="submit" name="upload">
          <span>Import into IsThereAnyDeal waitlist</span>
        </button>
        <a class="btnv6_lightblue_blue btn_small" href="data:text/json;charset=utf-8,${encodeURIComponent(
          file,
        )}" download="${filename}">
          <span>Download</span>
        </a>
      </form>
      <a class="btnv6_white_transparent btn_small" href="https://steamcommunity.com/my/${
        isWishlist ? 'followedgames' : 'wishlist'
      }">
        <span>${isWishlist ? 'Followed Games' : 'Wishlist'}</span>
      </a>
    </div>
    <div class="hr"></div>
  `;

  const content = document.importNode(template.content, true);

  if (isWishlist) {
    const container = document.getElementById('wishlist_ctn');
    container.parentNode.insertBefore(content, container);
  } else {
    const container = document.getElementById('tabs_basebg');
    container.insertBefore(content, container.firstElementChild);
  }
}

function encodeToUtf8(string) {
  return [...new TextEncoder().encode(string)].map((byte) => String.fromCharCode(byte)).join('');
}

setTimeout(createButtons, 2000);
