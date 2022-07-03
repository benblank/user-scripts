## YouTube: No list autoplay

YouTube has an "autoplay" setting, which can easily be turned off in the video
player, and will remain off unless you delete your cookies. Great, right? Not so
fast — playlists don't honor that setting! In fact, YouTube doesn't provide a
way to turn off list autoplaying at all. This script attempts to remedy that, by
removing the parts of the URL which tell YouTube that a video was launched as
part of a playlist.

There are currently some limitations to the script — it only affects links on
youtube.com (so links from other sites into playlists will still autoplay) and
it affects _all_ links on YouTube, even the "Play All" buttons, which you might
expect to still enable autoplay. I may enhance the script at some point in the
future to address these limitations.
