# quiet time — updated garden edition

This is a static html, css, and javascript progressive web app. All interface labels are lowercase, the app background is sampled from your garden photo, and the homepage is one scrollable collection over the garden photo: activity cards (icon and name only) grouped into games, words, explore, and away from the screen, gently coloured by kind — moss green for puzzles and games, dusty mauve for writing, olive-brown for reading, slate blue for learning, earthy sage for timer activities — followed by a compact quiet-session control.

## included
- sudoku, minesweeper, and solitaire, playable inside the app
- **just write**, an original local *forward-only writing space* built into quiet time. It deliberately follows the core idea of free-writing without editing, but **it is not the third-party justwrite.page website and does not sync with that service**. It automatically saves the current draft on this device. You can copy or download a .txt file. **new page** archives the existing page locally; archived pages can be downloaded from **previous pages**. Use downloads as backups because clearing browser storage deletes local drafts and archives.
- outside websites open their real sites in a separate browser tab/window, where allowed: murdoku, nyt games, murdle, the little daily, run 2, project gutenberg, the evolution of trust, our world in data, and mit opencourseware. Each also has a shortcut route (`#murdoku`, `#nyt`, `#murdle`, `#gutenberg`, `#little-daily`, `#run`, `#trust`, `#owid`, `#mit-ocw`) with an open button. During a quiet session these links go through the same eight-second early-exit pause.
- **mary oliver time**, **stretching time**, and **coloring time**: timer-only activities done away from the screen (`#mary-oliver`, `#stretching`, `#coloring`). Starting one starts a quiet session; it can be paused, survives a refresh, and ends with a quiet "time's up" (no sound or notification). The **light** menu sets an ambient glow (warm amber, rose, sage, lavender; still, breathing, or drifting waves; off to high) and can hide the countdown, which you can peek at by tapping. Reduced-motion systems default to still light.
- quiet sessions support sudoku, minesweeper, solitaire, just write, and the three timer activities
- offline app caching (once loaded), PWA installation and hash routes for shortcuts such as `/#write`

## github / vercel
Upload the **contents** of this folder to the **same github repository** used by your Vercel project: `index.html`, `style.css`, `app.js`, `minesweeper.js`, `sw.js`, `manifest.webmanifest`, `assets/`, and this README. Commit the changes; Vercel should redeploy automatically. Preset: Other. No build command or environment variables. The output directory is the repository root (`.`).

If an installed macOS/iPad app still looks like the old version, reload/reopen after deployment. The service-worker cache version was increased so the browser refreshes its offline copy.

## limitations
- All data stays in the local browser profile on the device (no syncing between Mac and iPad). Do not clear website data without downloading writing first.
- Just Write integration is a locally built alternative, **not an iframe of the original service**, whose framing policy and cross-site saved data are not guaranteed.
- Quiet sessions limit navigation only *within* the app. macOS apps and notifications require additional operating-system restrictions.

## apple shortcuts
In Apple's Shortcuts app, create a shortcut named **open quiet time**. Add the **URL** action containing `https://YOUR-APP.vercel.app/#home`, followed by **Open URLs**. On Mac you can assign a keyboard shortcut and enable **Use as Quick Action** in its Details. On iPad you can add the shortcut to the Home Screen or a widget. Duplicate and change the URL to `/#sudoku`, `/#minesweeper`, `/#solitaire`, `/#write`, etc. for quick-launch activities.

Shortcut URL launches may open the default browser rather than the standalone installed web-app window, depending on OS and link handling.

## stronger attention protection on macOS
1. Create a **Quiet Time Focus** in System Settings > Focus. Silence nearly all notifications; allow only people/apps you genuinely need. Use **Share Across Devices** if you want your iPad/iPhone to quiet down too.
2. **Do not rely only on app-triggered Focus:** on macOS, app-based Focus schedules turn off if you switch to another app. Instead, use a duration-based Focus, or an Apple Shortcut that activates the Focus *for a set duration* before opening quiet time.
3. For real website/app restrictions, use macOS **Screen Time** (Apps & Websites restrictions) or a blocker such as **Cold Turkey Blocker** with a locked block. Allowlist your garden URL and any external activities you deliberately want.
4. An HTML PWA cannot disable Command-Tab or Notification Center. Even a full-screen window is easy to leave.
5. The outside websites launch outside the garden and are not part of in-app quiet sessions. If you allow those sites, you'll need an external blocker to restrict other sites.

## iPad attention protection
Set up **Settings > Accessibility > Guided Access**, choose a passcode, open the installed quiet time web app, and begin a Guided Access session. This restricts you to a single app and works well with the built-in activities; launching external sites may leave the app or be prevented by the session.

## minesweeper controls
- Click/tap to reveal. The first reveal and its neighboring squares contain no mines.
- Right-click on Mac to place or remove a flag. On iPad, turn on **flag mode** then tap squares; a long press can also flag.
- You win by revealing every safe square. Large boards scroll horizontally on small screens.
