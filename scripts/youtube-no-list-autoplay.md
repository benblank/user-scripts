## YouTube: No list autoplay

YouTube has an "autoplay" setting, which can easily be turned off in the video
player, and will remain off unless you delete your cookies. Great, right? Not so
fast — playlists don't honor that setting! In fact, YouTube doesn't provide a
way to turn off list autoplaying at all. This script remedies that by removing
the parts of the URL which tell YouTube that a video was launched as part of a
playlist and then forcing YouTube to use those modified URLs.

### Limitations

YouTube is a complex web application and this script makes some sacrifices in
order to limit its own complexity and how much knowledge of YouTube's
ever-changing app I need in order to keep it working.

* It affects *all* playlists. For now, the best way to autoplay a specific list
  is to either use its "Play All" button or to temporarily toggle off this
  script in your userscript extension.

* It only affects links on YouTube playlist pages (e.g.
  <https://www.youtube.com/playlist?list=WL>), so links from other pages and
  sites will still autoplay.

  If you use AdBlock Origin, adding the following filters will make links from
  other sites also not autoplay.

  ``` adblock
  ! Strip playlist parameters from watch pages (only works when fully loading
  ! the page, not when navigating within YouTube).
  ||youtube.com/watch$removeparam=index
  ||youtube.com/watch$removeparam=list

  ```

  Fixing the same for other pages within YouTube involves mucking with the
  YouTube app the same way this script does, so there's no simple solution. If
  there are specific other pages within YouTube which you'd also like to see
  prevent list autoplaying, feel free to open an issue requesting the feature.

* It breaks YouTube's normal page navigation. This isn't likely to be
  particularly noticable as a user in most cases, as their navigation is
  designed to mimic normal browser navigation. You may, however, notice the
  links to both videos and creators from within playlists load just a bit more
  slowly.
