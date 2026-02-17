// ==UserScript==
// @name        Steam Community: Toggleable spoilers in guides
// @namespace   https://benblank.github.io/user-scripts/
// @version     1.0.0
// @author      Ben "535" Blank
// @description Click on a spoiler to unhide or rehide it. Remembered between visits!
// @homepageURL https://benblank.github.io/user-scripts/scripts/steam-guides-toggleable-spoilers.html
// @supportURL  https://github.com/benblank/user-scripts/issues
// @icon        https://benblank.github.io/user-scripts/icon.png
// @license     BSD-3-Clause
// @copyright   2025 Ben Blank
// @match       https://steamcommunity.com/sharedfiles/filedetails/*
// @grant       none
// ==/UserScript==

/// <reference lib="DOM" />

/**
 * @typedef FileInfo
 * @property {string} id The "sharedfile" ID assigned by Steam.
 * @property {string} updated Indicates when the file was updated.
 *
 * Both properties are treated as black boxes. IDs appear to always be numeric,
 * but only the fact that they're unique per file is relevant to us. Similarly,
 * "updated" is a formatted timestamp from Steam, but we don't actually care
 * *when* the file was changed, only *that* it changed (and that old spoiler IDs
 * can therefore no longer be relied upon).
 */

/**
 * @typedef ToggledSpoilers
 * @property {string} updated The {@link FileInfo.updated} associated with these
 * spoiler IDs.
 * @property {{ [id: string]: true }} ids The IDs of the spoilers which have
 * been disabled.
 */

const ENABLED_SPOILER = "bb_spoiler";
const DISABLED_SPOILER = "disabled-spoiler";

const styles = `
.${ENABLED_SPOILER} {
  cursor: pointer;
}

.${DISABLED_SPOILER} {
  border-color: black;
  border-style: solid;
  border-width: 0 4px;
  cursor: pointer;
  padding: 0 4px;
}

.${DISABLED_SPOILER}:hover {
  background: black;
  border-color: white;
  color: white;
}
`;

const createClickHandler = (/** @type {FileInfo} */ fileInfo) => {
  return (/** @type {PointerEvent} */ event) => {
    // Only toggle spoilers on left-clicks.
    if (event.button !== 0) {
      return;
    }

    // It shouldn't be possible for this handler to be fired for non-
    // HTMLElements, but this is technically safer and makes TypeScript happy.
    if (!(event.currentTarget instanceof HTMLElement)) {
      return;
    }

    const spoilerId = event.currentTarget.dataset.spoilerId;

    if (!spoilerId) {
      return;
    }

    if (event.currentTarget.classList.contains(ENABLED_SPOILER)) {
      markSpoiler(fileInfo, spoilerId, true);
      disableSpoiler(event.currentTarget);
    } else if (event.currentTarget.classList.contains(DISABLED_SPOILER)) {
      markSpoiler(fileInfo, spoilerId, false);
      enableSpoiler(event.currentTarget);
    }
  };
};

const disableSpoiler = (/** @type {HTMLElement} */ spoiler) => {
  spoiler.classList.remove(ENABLED_SPOILER);
  spoiler.classList.add(DISABLED_SPOILER);
};

const enableSpoiler = (/** @type {HTMLElement} */ spoiler) => {
  spoiler.classList.add(ENABLED_SPOILER);
  spoiler.classList.remove(DISABLED_SPOILER);
};

/** @type {() => FileInfo | null} */
const getFileInfo = () => {
  // The unique identifier for this guide.
  const id = new URL(document.location.toString()).searchParams.get("id");

  // There's no reasonable way to store data if we don't know what document to
  // associate it with.
  if (!id) {
    return null;
  }

  let updated;

  container_loop: for (const container of document.querySelectorAll(".rightDetailsBlock")) {
    for (const [index, header] of container.querySelectorAll(".detailsStatLeft").entries()) {
      if (header.textContent.trim() === "Updated") {
        updated = container.querySelectorAll(".detailsStatRight")[index].textContent.trim();

        break container_loop;
      }
    }
  }

  // If there's no way to tell when stored data is stale, it probably isn't
  // worth storing it.
  if (!updated) {
    return null;
  }

  return { id, updated };
};

/** @type {(fileInfo: FileInfo) => ToggledSpoilers} */
const getToggledSpoilers = (fileInfo) => {
  const rawData = localStorage.getItem(`toggled-spoilers-${fileInfo.id}`);

  if (rawData) {
    try {
      /** @type {ToggledSpoilers} */
      const data = JSON.parse(rawData);

      // Only return stored data if it is up to date.
      if (data.updated === fileInfo.updated) {
        return data;
      }
    } catch {
      // If the stored data is invalid, just fall back to returning empty data.
    }
  }

  // Stored data was missing, invalid, or out of date; start fresh.
  return { updated: fileInfo.updated, ids: {} };
};

const initialize = (/** @type {FileInfo} */ fileInfo) => {
  const stylesheet = document.createElement("style");

  stylesheet.textContent = styles;
  document.head.appendChild(stylesheet);

  /** @type {NodeListOf<HTMLElement>} */
  const allSpoilers = document.querySelectorAll(".bb_spoiler");
  const toggledSpoilers = getToggledSpoilers(fileInfo);
  const clickHandler = createClickHandler(fileInfo);

  for (const [index, spoiler] of allSpoilers.entries()) {
    const spoilerId = String(index);

    spoiler.dataset.spoilerId = spoilerId;

    if (spoilerId in toggledSpoilers.ids) {
      disableSpoiler(spoiler);
    }

    spoiler.addEventListener("click", clickHandler);
  }
};

const markSpoiler = (
  /** @type {FileInfo} */ fileInfo,
  /** @type {string} */ spoilerId,
  /** @type {boolean} */ disabled,
) => {
  const toggledSpoilers = getToggledSpoilers(fileInfo);

  if (disabled) {
    toggledSpoilers.ids[spoilerId] = true;
  } else {
    delete toggledSpoilers.ids[spoilerId];
  }

  setToggledSpoilers(fileInfo, toggledSpoilers);
};

/** @type {(fileInfo: FileInfo, toggledSpoilers: ToggledSpoilers) => void} */
const setToggledSpoilers = (fileInfo, toggledSpoilers) => {
  localStorage.setItem(`toggled-spoilers-${fileInfo.id}`, JSON.stringify(toggledSpoilers));
};

const fileInfo = getFileInfo();

if (fileInfo) {
  initialize(fileInfo);
}

console.log("Finished loading 'Toggleable Spoilers for Steam Community Guides'.");
