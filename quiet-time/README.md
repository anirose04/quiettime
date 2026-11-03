# Quiet Time — Quiet Sessions + Minesweeper 🌿
A private-feeling, deliberately limited personal garden for slow screen time. Pure HTML/CSS/JavaScript, no build step, no accounts, no analytics, no Supabase.

## What's here
- Botanical homepage using the provided garden photograph
- Playable Sudoku with 3 difficulty settings, pencil notes, hints, keyboard navigation, local saves
- Playable botanical Minesweeper (9×9/16×16/16×30), first-reveal safety, flagging, flood-fill, local saves
- Playable draw-one Klondike Solitaire with one-step undo, local saves
- Launch buttons for Murdoku, NYT Games and Just Write
- Installable Progressive Web App with offline cache for the app's built-in games
- Hash routes for Apple Shortcuts: `#sudoku`, `#minesweeper`, `#solitaire`, `#links`, `#write`, `#nyt`, `#murdoku`

## How to publish
1. Create a new GitHub repository, then upload all files **including the `assets` folder** from this archive.
2. In Vercel, choose **Add New Project**, import that GitHub repository, and select **Other** framework preset (plain static site). No build command is necessary. Publish.
3. Open your deployed URL (for example, `https://YOUR-APP.vercel.app/`) in Safari on Mac. Select **File → Add to Dock** (macOS Sonoma 14+).
4. On iPad, open the URL in Safari; select **Share → Add to Home Screen** and choose Open as Web App if available.

## Apple Shortcuts
In Apple's Shortcuts app, create a shortcut named **Open Quiet Time**. Add the **URL** action containing `https://YOUR-APP.vercel.app/#home`, followed by **Open URLs**. On Mac you can assign a keyboard shortcut and enable **Use as Quick Action** in its Details; you can optionally display it in the menu bar. On iPad you can add the shortcut to the Home Screen or a widget. Duplicate and change URL to `/#sudoku` etc. for quick-launch activities.

External websites open in a new window/tab, and require internet. Shortcut URL launches may open the default browser rather than the standalone installed web-app window, depending on OS and link handling.

## Notes
- Saves are in **localStorage**, only on the current device/browser. Clearing website data will remove them; Mac and iPad do not sync automatically.
- Fonts are enhanced using Google Fonts when online, but fallback local fonts work offline.
- The service worker caches app assets on first successful load; deploy under HTTPS to enable installation and caching.
- Some Sudoku puzzles may have more given numbers than the nominal target because clue removal preserves a unique solution.
- Games are intended as a personal first version, not a production game engine. Solitaire is click/tap-to-move, not drag-and-drop.

## Quiet Session (added in this edition)
On the home screen, choose **Sudoku **, Solitaire, or Minesweeper** and a 15/30/45/60-minute session. Internal navigation away from that chosen game is paused until the timer expires; finishing early takes an 8-second intentional pause. The timer is saved locally, so refreshing the page does not reset it.

**Important:** This is navigation friction *within the HTML app*, not an operating-system lock. You can still Command-Tab, switch Spaces, open browsers, or check Notification Center. It does not suppress notifications or block other websites. Use system-level settings below. Do not rely on the in-app timer alone for strict attention protection.

## Stronger attention protection on macOS
1. Create a **Quiet Time Focus** in System Settings > Focus. Silence nearly all notifications; allow only people/apps you genuinely need. Consider disabling badges and previews in Notifications settings. Use **Share Across Devices** if you want your iPad/iPhone to quiet down too.
2. **Do not rely only on app-triggered Focus:** on macOS, Apple's app-based Focus schedules turn off if you switch to another app — exactly the kind of switch you're trying to discourage. Instead, use a duration-based Focus (e.g., one hour), or an Apple Shortcut that activates the Focus *for a set duration* before opening Quiet Time. Verify the actions available on your installed macOS version.
3. For real website/app restrictions during the session, use macOS **Screen Time** (Apps & Websites restrictions, schedules/allowances) or a compatible blocker such as **Cold Turkey Blocker** with a **locked block** (app blocking and allowlist features may require paid tier). Configure an allowlist for your exact garden URL and any external activities you deliberately want. Test that it doesn't interfere with the Safari web app or legitimate system apps. If you control the passcode/lock yourself, remember you can potentially override it.
4. There is no built-in iPad-style Guided Access single-app lock for normal personal Mac apps. An HTML PWA cannot disable Command-Tab or Notification Center. Even a full-screen window is easy to leave.
5. External activities (Murdoku, NYT Games, Just Write) launch outside the garden and are intentionally not included in in-app Quiet Sessions. If you allow those sites, you'll need an external blocker to restrict other sites, and allowlisting a domain may still expose other pages on that domain.

## iPad attention protection
Set up **Settings > Accessibility > Guided Access**, choose a passcode, open the installed Quiet Time web app, and begin a Guided Access session. Test this combination on your specific iPadOS version. Guided Access restricts you to a single app and offers a stronger experience for the garden's **built-in** games; launching external sites may leave the app or be prevented by the session.

## Minesweeper controls
Choose **Minesweeper** from the homepage, or visit `#minesweeper` directly. The game is built into Quiet Time, plays offline after caching, and resumes locally from where you left off. It offers three board sizes.
- Click/tap to reveal. The first reveal and its neighboring squares contain no mines.
- Right-click on Mac to place or remove a flag. On iPad, turn on **flag mode** then tap squares; a long press can also flag.
- You win by revealing every safe square. The board scrolls horizontally on small screens for large difficulties.
- Select Minesweeper from the **Quiet Session** activity dropdown to stay with it for the session duration.
