# Copilot Instructions for my-first-app2

## 言語設定

**説明は日本語で表示するようにしてください。** ユーザーとの対話や、コード分析、提案、指導はすべて日本語で行ってください。

---

## Project Overview

This is a **web-based music player MVP** built with vanilla HTML, CSS, and JavaScript. It provides a minimal but functional audio player with file upload, playback controls, progress tracking, and time display.

## Architecture

The project follows a **separation of concerns** pattern with three independent files:

- **index.html** - Semantic HTML structure with a `<audio>` element and DOM elements for UI controls
- **style.css** - All styling using CSS Grid/Flexbox for layout and modern design patterns (gradients, shadows, transitions)
- **script.js** - Event-driven JavaScript that manages audio playback and updates the DOM

### Key Design Patterns

1. **Element Caching** - All DOM elements are queried once at the top of `script.js` and stored in constants
2. **Event-Driven Architecture** - Functionality is built around HTML5 Audio API events (`timeupdate`, `loadedmetadata`, etc.)
3. **File Handling** - Uses `URL.createObjectURL()` to handle local file uploads without server backend
4. **Time Formatting** - Utility function `formatTime()` converts seconds to MM:SS format for display

### File Structure

```
index.html          - UI markup with audio element and control buttons
style.css           - Component-based styling (player-container, controls, progress-bar, etc.)
script.js           - Audio control logic and event listeners
.github/            - GitHub configuration
  └─ copilot-instructions.md
```

## Language & Frameworks

- **HTML5** with semantic structure
- **Vanilla CSS3** (no preprocessors) - supports modern browsers
- **Vanilla JavaScript (ES6+)** - no external libraries, direct DOM manipulation

## UI/UX Conventions

- **Color Scheme**: Purple gradient (`#667eea` to `#764ba2`) with white containers
- **Component Structure**: Follows a nested container pattern with clear separation
  - `.player-container` (top level)
    - `.file-upload` (input section)
    - `.player` (main controls and display)
      - `.controls` (button group)
      - `.progress-bar` (progress display)
      - `.time-info` (time display)
- **Button Styling**: Consistent use of `.btn` class with hover/active states
- **Responsive Design**: Flexbox-based with mobile-first approach (max-width: 500px container)

## Development Guidelines

### Adding Features

1. **New UI Elements**: Add to HTML structure, then add corresponding CSS selectors to `style.css`
2. **New Functionality**: Cache DOM elements at the top of `script.js`, add event listeners in the appropriate section
3. **Time-Related Logic**: Use `formatTime()` utility for consistency

### Extending Audio Controls

Current controls are:
- File input (file selection)
- Play button
- Pause button
- Stop button (pause + reset to 0:00)
- Progress bar (clickable for seeking)

To add controls (volume, speed, etc.):
1. Add button/input to HTML
2. Query and cache in `script.js`
3. Add event listener and manipulate `audioPlayer` properties (e.g., `volume`, `playbackRate`)

### Browser Compatibility

Uses standard HTML5 Audio API - works in all modern browsers. Note:
- `URL.createObjectURL()` for file handling
- CSS gradients and flexbox (IE11 limited support)
- Audio formats supported depend on browser (test with MP3, WAV, OGG)

## Common Patterns

### Element Selection Pattern
```javascript
const element = document.getElementById('elementId');
element.addEventListener('event', (e) => {
    // Handler code
});
```

### Audio Event Pattern
```javascript
audioPlayer.addEventListener('timeupdate', () => {
    // Update UI based on audioPlayer.currentTime and audioPlayer.duration
});
```

### CSS Class Pattern
- Semantic class names: `.controls`, `.player-container`, `.track-info`
- Component-focused (not single-property utility classes)
- Consistent spacing and color usage

## No Build Process

This is a static HTML project with no build step, linting, or testing frameworks. Simply open `index.html` in a browser to run.

### Testing Approach

Manual testing only:
1. Open `index.html` in a web browser
2. Select an audio file (MP3, WAV, OGG, etc.)
3. Test each control: play, pause, stop
4. Verify progress bar updates and time display works
5. Test progress bar clicking for seek functionality

## Commit Message Convention

Use clear, descriptive commit messages. Example:
```
Add volume control to player
Fix time display formatting for durations > 1 hour
Update progress bar styling for better visibility
```

Include co-authored-by trailer when pairing:
```
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```
