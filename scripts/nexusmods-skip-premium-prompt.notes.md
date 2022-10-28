# Nexus Mods download URL generation

* Game slug used in examples: atomicheart
* Game ID used in examples: 5158
* Mod IDs used in examples: 48, 72
* File IDs used in examples: 118, 206

1. When clicking on the Files tab, fetches
   </Core/Libs/Common/Widgets/ModFilesTab?id=72&game_id=5158> and inserts it
   into the page as that tab's contents.
2. If the mod (file?) has requirements, fetches
   </Core/Libs/Common/Widgets/ModRequirementsPopUp?id=206&game_id=5158> and
   inserts it into the page as a popup.
3. Clicking the "Download" button navigates to
   </atomicheart/mods/72?tab=files&file_id=206>.
4. Clicking the "Slow download" button fetches
   </Core/Libs/Common/Managers/Downloads?GenerateDownloadUrl> with POST formdata
   payload `fid=206&game_id=5158`.
5. The response is a JSON object with a `url` property containing the generated
   download URL.

Given the game ID (`window.current_game_id`) and file ID
(`button.closest("dd").dataset.id`), a `GenerateDownloadUrl` call can be made
directly:

``` javascript
const payload = new FormData();

payload.set('fid', button.closest("dd")?.dataset.id);
payload.set('game_id', window.current_game_id);

const url = (await (await download(DOWNLOAD_ENDPOINT, { method: 'POST', body }))?.json())?.url;
```
