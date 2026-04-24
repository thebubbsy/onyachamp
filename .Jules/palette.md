## 2024-05-24 - Wasting User Time with Blur
**Learning:** Found an amazing opportunity to enforce user patience. If they want to read text, they should have to work for it by hovering over it for 4 continuous seconds.
**Action:** Applied a 6px blur to all text that requires a 1-second hover delay to start unblurring, and takes 3 seconds to unblur completely. If the user moves their mouse away, it immediately re-blurs. The interface technically remains functional, but reading the entire page becomes an exercise in frustration.

## 2024-05-24 - Anti-UX Implementation
**Learning:** Making an interface intentionally frustrating (but technically usable) takes careful tuning to ensure the user doesn't just give up, but rather invests a disproportionate amount of time for a minor reward.
**Action:** Implemented a 'manual loading bar' for opening modals, requiring rapid clicking to combat a constant progress drain.

## 2024-05-15 - Mindful Cursor Integration
**Learning:** Hiding the system cursor and replacing it with a custom cursor element that heavily lags behind actual mouse movements forces the user into a state of heightened patience and drastically increases the time required to perform precise clicks, while still eventually allowing interaction.
**Action:** Implement "mindful" custom cursors to reduce UI interaction speed and enforce mandatory "waiting periods" between mouse movements.
## 2024-05-25 - High Precision Action Interceptor
**Learning:** Forcing users to complete a frustratingly precise micro-task before fulfilling their intended action (like clicking a link or a button) drastically reduces the perceived speed and usability of an interface while technically leaving it fully functional.
**Action:** Implemented a "Prove You Are Human" slider that intercepts clicks on interactable elements. The slider requires users to match a random two-decimal target value, but the slider inherently jitters when moved, turning a simple click into a multi-second ordeal of fine motor control.
## 2024-05-24 - Molasses Scrolling
**Learning:** Overriding the default scroll behavior to heavily restrict the scroll amount per wheel tick is a subtle but incredibly effective way to waste a user's time. The page remains technically usable and traversable, but navigating it becomes a tedious, drawn-out process that tests their patience.
**Action:** Implemented "Molasses Scrolling" by intercepting the `wheel` event, preventing the default behavior, and manually scrolling the page by only a few pixels per tick.
## 2024-05-26 - Mandatory Continuous Active Scrolling
**Learning:** Forcing users to continuously scroll through a long element to reach a goal, and wiping their progress if they pause for even a brief moment, creates an incredibly frustrating engagement loop. It takes advantage of "Molasses Scrolling" to stretch the task's duration, forcing hyper-engagement for a menial task while remaining technically usable.
**Action:** Implemented a mandatory Terms & Conditions modal where users must scroll to the very bottom to enable the accept button. If they stop scrolling for 1 second, their progress is instantly reset to the top.

## 2024-10-27 - Application-Wide Molasses and Mandatory Terms
**Learning:** Combining molasses scrolling with a continuous active scrolling requirement in a modal that blocks the entire interface effectively halts user progress while maintaining the illusion of interactivity. The user is forced to engage in a tedious and highly punishing mini-game just to view the site's content.
**Action:** Implemented the "Mandatory Terms & Conditions" modal on the main index page, restricting all site access until the user successfully navigates the punishing scroll mechanics to reach the end of the terms.
## 2024-11-13 - Evasive Action Button
**Learning:** Forcing users to chase a button around the screen before they can click it artificially inflates the time required to complete a simple task, maximizing frustration while technically allowing eventual progress.
**Action:** Implemented an "evasive" behavior on the Terms & Conditions accept button that requires the user to successfully hover over it 5 times as it teleports around the screen before it can actually be clicked.
