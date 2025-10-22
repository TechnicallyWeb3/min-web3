# Browser UI Code Documentation

This document provides a comprehensive overview of the browser UI code structure, components, and their locations. Use this as a reference to apply the same browser UI to another branch.

## Table of Contents
1. [Main HTML Structure](#main-html-structure)
2. [CSS Styling Files](#css-styling-files)
3. [JavaScript Components](#javascript-components)
4. [Navbar Components](#navbar-components)
5. [Tab Management](#tab-management)
6. [Address Bar & Navigation](#address-bar--navigation)
7. [Key Dependencies](#key-dependencies)
8. [File Structure Summary](#file-structure-summary)

## Main HTML Structure

### Primary File: `index.html`
The main HTML structure is defined in `index.html` and includes:

#### Window Controls
- **Location**: Lines 18-40 in `index.html`
- **Components**: Minimize, maximize, restore, close buttons
- **CSS**: `css/windowControls.css`

#### Navbar Structure
- **Location**: Lines 112-147 in `index.html`
- **Main Container**: `#navbar` with class `theme-background-color theme-text-color windowDragHandle`

```html
<div
  id="navbar"
  class="theme-background-color theme-text-color windowDragHandle"
  tabindex="-1"
>
  <div id="mac-window-drag-area"></div>
  <div id="browser-logo">
    <img src="/assets/tw3.png" alt="Browser Logo" id="navbar-logo">
  </div>
  <button
    id="menu-button"
    class="navbar-action-button i carbon:overflow-menu-vertical"
    data-label="openMenu"
    tabindex="-1"
  ></button>
  <div id="toolbar-navigation-buttons" hidden>
    <button
      id="back-button"
      class="navbar-action-button i carbon:chevron-left"
      data-label="goBack"
      tabindex="-1"
    ></button>
    <button
      id="forward-button"
      class="navbar-action-button i carbon:chevron-right"
      data-label="goForward"
      tabindex="-1"
    ></button>
  </div>
  <div id="tabs">
    <div id="tab-editor" hidden>
      <input id="tab-editor-input" class="mousetrap" spellcheck="false" />
    </div>
    <div id="tabs-inner" role="tablist" class="has-thin-scrollbar"></div>
  </div>
</div>
```

#### Address Bar Bar
- **Location**: Lines 149-163 in `index.html`
- **Container**: `#address-bar-bar`

```html
<!-- Persistent Address Bar Bar: now directly below the tab bar -->
<div id="address-bar-bar" class="theme-background-color theme-text-color">
  <button id="nav-back" class="browser-nav-btn i carbon:chevron-left" title="Back"></button>
  <button id="nav-forward" class="browser-nav-btn i carbon:chevron-right" title="Forward"></button>
  <button id="nav-reload" class="browser-nav-btn" title="Reload">
    <svg width="20" height="20" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" stroke-width="3" stroke="currentColor" fill="none" style="vertical-align: middle;">
      <path d="M53.72,36.61A21.91,21.91,0,1,1,50.37,20.1"/>
      <polyline points="51.72 7.85 50.85 20.78 37.92 19.9"/>
      <path d="M53.72,36.61A21.91,21.91,0,1,1,50.37,20.1"/>
      <polyline points="51.72 7.85 50.85 20.78 37.92 19.9"/>
    </svg>
  </button>
  <button id="nav-home" class="browser-nav-btn i carbon:home" title="Home"></button>
  <div class="address-bar-bar-rounded">
    <span id="security-icon" class="i carbon:locked"></span>
    <input id="address-bar" class="browser-address-input" type="text" placeholder="Search or enter address" spellcheck="false" />
  </div>
  <button id="bookmark-btn" class="i carbon:star" title="Bookmark"></button>
  <button id="add-tab-button" class="browser-nav-btn i carbon:add" title="New Tab"></button>
</div>
```

#### Webviews Container
- **Location**: Lines 208-224 in `index.html`
- **Container**: `#webviews`
- **Components**:
  - Web3 content container
  - Arrow indicators for navigation
  - New tab page content

## CSS Styling Files

### Core Styling Files

#### `css/base.css`
- **Purpose**: Base styles, typography, dark mode support
- **Key Features**:
  - Global reset and box-sizing
  - Font family definitions
  - Dark mode color schemes
  - Scrollbar styling
  - Main container layout

#### `css/nav.css`
- **Purpose**: Navigation bar and address bar styling
- **Key Features**:
  - Browser logo positioning
  - Navbar background and border radius
  - Address bar layout and styling
  - Dark mode support for navigation
  - Tab styling and animations

```css
#browser-logo {
  display: flex;
  align-items: center;
  padding-left: 10px;
  padding-right: 10px;
}

#navbar-logo {
  height: 24px;
  width: auto;
  object-fit: contain;
}

#navbar {
  border-radius: 10 10 0px 0px;
  background: #202020 !important;
}

/* Persistent Address Bar Bar Styles */
#address-bar-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 16px;
  position: relative;
  z-index: 9;
  margin-top: 0;
  margin-bottom: 0;
  box-shadow: 0 1px 0 #e0e0e0;
  background: #3B3B3B;
}

#address-bar-bar .browser-nav-btn {
  background: none;
  border: none;
  color: #444;
  font-size: 1.2em;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}

.address-bar-bar-rounded {
  display: flex;
  align-items: center;
  background: #23272f;
  border: 1.5px solid #444;
  border-radius: 999px;
  height: 38px;
  flex: 1 1 0;
  min-width: 240px;
  max-width: none;
  box-sizing: border-box;
  position: relative;
  transition: background 0.2s, border 0.2s;
  padding: 0 12px 0 0;
}

.browser-address-input {
  flex: 1 1 0;
  border: none !important;
  outline: none;
  background: transparent !important;
  color: #eee;
  font-size: 1em;
  padding: 8px 0;
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
  margin: 0;
}
```

#### `css/tabBar.css`
- **Purpose**: Tab bar specific styling
- **Key Features**:
  - Tab layout and flex properties
  - Tab animations (animate-in, closing)
  - Tab icons and buttons
  - Progress bar styling
  - Drag and drop visual feedback

### Additional CSS Files

#### Modal and Overlay Components
- `css/modal.css` - Modal dialogs and overlays
- `css/taskOverlay.css` - Task overlay interface

#### Feature-Specific Styling
- `css/searchbar.css` - Search functionality
- `css/downloadManager.css` - Download management
- `css/passwordManager.css` - Password management
- `css/passwordCapture.css` - Password capture dialogs
- `css/passwordViewer.css` - Password viewer modal
- `css/bookmarkManager.css` - Bookmark management
- `css/findinpage.css` - Find in page functionality
- `css/newTabPage.css` - New tab page styling
- `css/webviews.css` - Webview container styling
- `css/tabEditor.css` - Tab editing interface
- `css/listItem.css` - List item components
- `css/windowControls.css` - Window control buttons

## JavaScript Components

### Main Browser UI Controller

#### `js/browserUI.js`
- **Purpose**: Main UI controller and coordination
- **Key Functions**:
  - `addTask()` - Creates new tasks
  - `addTab()` - Creates new tabs
  - `switchToTab()` - Tab switching logic
  - `closeTab()` - Tab closing logic
  - Address bar event handling
  - Navigation button functionality

```javascript
// Address Bar Event Handling
document.addEventListener('DOMContentLoaded', function () {
  const addressBar = document.getElementById('address-bar');
  const navBack = document.getElementById('nav-back');
  const navForward = document.getElementById('nav-forward');
  const navReload = document.getElementById('nav-reload');
  const navHome = document.getElementById('nav-home');
  const bookmarkBtn = document.getElementById('bookmark-btn');
  const securityIcon = document.getElementById('security-icon');

  // Helper to update address bar with current tab's URL
  function updateAddressBar() {
    const tab = tabs.get(tabs.getSelected());
    if (!tab) return;
    // Prefer prettyUrl if available
    addressBar.value = tab.prettyUrl || tab.url || '';
    // Optionally update security icon (locked/unlocked)
    if (tab.secure === false) {
      securityIcon.className = 'i carbon:unlocked';
      securityIcon.title = 'Not Secure';
    } else {
      securityIcon.className = 'i carbon:locked';
      securityIcon.title = 'Secure';
    }
  }

  // Update address bar on tab switch and tab update
  tabBar.events.on('tab-selected', updateAddressBar);
  tasks.on('tab-updated', function (id, key) {
    if (id === tabs.getSelected() && (key === 'url' || key === 'secure')) {
      updateAddressBar();
    }
  });

  // On Enter in address bar, navigate current tab
  addressBar.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      let prettyUrl = addressBar.value.trim();

      // If user entered just an ETH address or ENS name, rewrite to wttp://<address>/
      if (/^0x[a-fA-F0-9]{40}$/.test(prettyUrl) || /\.eth$/.test(prettyUrl)) {
        prettyUrl = `wttp://${prettyUrl}/`;
      }

      let internalUrl = toInternalWttpUrl(prettyUrl);
      webviews.update(tabs.getSelected(), internalUrl);
      // Store the pretty URL for this tab
      tabs.update(tabs.getSelected(), { prettyUrl: prettyUrl });
    }
  });

  // Navigation buttons
  navBack.addEventListener('click', function () {
    webviews.callAsync(tabs.getSelected(), 'goBack');
  });
  navForward.addEventListener('click', function () {
    webviews.callAsync(tabs.getSelected(), 'goForward');
  });
  navReload.addEventListener('click', function () {
    webviews.callAsync(tabs.getSelected(), 'reload');
  });
  navHome.addEventListener('click', function () {
    webviews.update(tabs.getSelected(), settings.get('homePage') || 'min://newtab');
  });
});
```

### Tab Management System

#### `js/navbar/tabBar.js`
- **Purpose**: Tab bar management and rendering
- **Key Features**:
  - Tab creation and destruction
  - Tab dragging and reordering
  - Tab state management
  - Progress bar integration
  - Tab animations

```javascript
// Tab Creation Function
createTab: function (data) {
  var tabEl = document.createElement('div')
  tabEl.className = 'tab-item tab-animate-in'
  tabEl.setAttribute('data-tab', data.id)
  tabEl.setAttribute('role', 'tab')
  
  // Remove animation class after animation ends
  tabEl.addEventListener('animationend', function handler(e) {
    if (e.animationName === 'tab-animate-in') {
      tabEl.classList.remove('tab-animate-in')
      tabEl.removeEventListener('animationend', handler)
    }
  })

  tabEl.appendChild(readerView.getButton(data.id))
  tabEl.appendChild(tabAudio.getButton(data.id))
  tabEl.appendChild(progressBar.create())

  // Create icon area
  var iconArea = document.createElement('span')
  iconArea.className = 'tab-icon-area'

  if (data.private) {
    var pbIcon = document.createElement('i')
    pbIcon.className = 'icon-tab-is-private tab-icon tab-info-icon i carbon:view-off'
    iconArea.appendChild(pbIcon)
  }

  var closeTabButton = document.createElement('button')
  closeTabButton.className = 'tab-icon tab-close-button i carbon:close'

  closeTabButton.addEventListener('click', function (e) {
    tabBar.events.emit('tab-closed', data.id)
    e.stopPropagation()
  })

  iconArea.appendChild(closeTabButton)
  tabEl.appendChild(iconArea)

  // Create title container
  var titleContainer = document.createElement('div')
  titleContainer.className = 'title-container'

  var spinner = document.createElement('span')
  spinner.className = 'tab-spinner'
  titleContainer.appendChild(spinner)

  var favicon = document.createElement('img')
  favicon.className = 'tab-favicon'
  titleContainer.appendChild(favicon)

  var textContainer = document.createElement('div')
  textContainer.className = 'tab-text-container'
  titleContainer.appendChild(textContainer)

  var title = document.createElement('span')
  title.className = 'title'

  var urlElement = document.createElement('span')
  urlElement.className = 'url-element'

  textContainer.appendChild(title)
  textContainer.appendChild(urlElement)
  tabEl.appendChild(titleContainer)

  // Click to switch to tab
  tabEl.addEventListener('click', function (e) {
    tabBar.events.emit('tab-selected', data.id)
  })

  return tabEl
}
```

#### `js/tabState/tab.js`
- **Purpose**: Individual tab state management
- **Key Features**:
  - Tab data structure
  - Tab lifecycle management
  - Tab properties and methods

#### `js/tabState/task.js`
- **Purpose**: Task (window) state management
- **Key Features**:
  - Task data structure
  - Task-tab relationships
  - Task lifecycle management

## Navbar Components

### Core Navbar Files

#### `js/navbar/addTabButton.js`
- **Purpose**: Add tab button functionality
- **Features**: New tab creation logic

#### `js/navbar/bookmarkStar.js`
- **Purpose**: Bookmark functionality
- **Features**: Bookmark toggle and state management

#### `js/navbar/contentBlockingToggle.js`
- **Purpose**: Content blocking controls
- **Features**: Ad blocking toggle functionality

#### `js/navbar/menuButton.js`
- **Purpose**: Main menu button
- **Features**: Menu display and interaction

#### `js/navbar/navigationButtons.js`
- **Purpose**: Back/forward navigation
- **Features**: Navigation state management

#### `js/navbar/permissionRequests.js`
- **Purpose**: Permission request handling
- **Features**: Permission icons and interactions

#### `js/navbar/progressBar.js`
- **Purpose**: Loading progress indication
- **Features**: Progress bar animations and states

#### `js/navbar/tabActivity.js`
- **Purpose**: Tab activity tracking
- **Features**: Inactive tab fading

#### `js/navbar/tabColor.js`
- **Purpose**: Tab color theming
- **Features**: Dynamic tab coloring

#### `js/navbar/tabContextMenu.js`
- **Purpose**: Tab right-click menu
- **Features**: Context menu actions

#### `js/navbar/tabEditor.js`
- **Purpose**: Tab editing interface
- **Features**: Tab title/URL editing

## Address Bar & Navigation

### Address Bar Implementation
The address bar is implemented in two parts:

1. **HTML Structure** (in `index.html`):
   - `#address-bar-bar` container
   - `#address-bar` input field
   - Navigation buttons
   - Security icon

2. **JavaScript Logic** (in `js/browserUI.js`):
   - Address bar event handling
   - URL navigation logic
   - Security icon updates
   - Navigation button functionality

### Navigation Features
- Back/Forward navigation
- Reload functionality
- Home button
- Bookmark toggle
- Security status indication
- URL validation and formatting

## Key Dependencies

### External Libraries
- **dragula**: Tab dragging functionality
- **EventEmitter**: Event system for components
- **Carbon Icons**: Icon system (`ext/icons/iconfont.css`)

### Internal Modules
- `webviews.js` - Webview management
- `settings.js` - User preferences
- `urlParser.js` - URL parsing utilities
- `focusMode.js` - Focus mode functionality
- `readerView.js` - Reader mode
- `tabAudio.js` - Tab audio controls

## File Structure Summary

### Essential Files for UI Implementation

#### HTML Structure
```
index.html                    # Main HTML structure
```

#### CSS Files (in order of importance)
```
css/base.css                 # Base styles and typography
css/nav.css                  # Navigation and address bar
css/tabBar.css              # Tab bar styling
css/modal.css               # Modal dialogs
css/webviews.css            # Webview container
css/windowControls.css      # Window controls
```

#### JavaScript Core
```
js/browserUI.js             # Main UI controller
js/navbar/tabBar.js         # Tab management
js/tabState/tab.js          # Tab state
js/tabState/task.js         # Task state
```

#### Navbar Components
```
js/navbar/
├── addTabButton.js         # Add tab functionality
├── bookmarkStar.js         # Bookmark controls
├── contentBlockingToggle.js # Content blocking
├── menuButton.js           # Main menu
├── navigationButtons.js    # Back/forward
├── permissionRequests.js   # Permission handling
├── progressBar.js          # Loading progress
├── tabActivity.js          # Tab activity
├── tabColor.js             # Tab theming
├── tabContextMenu.js       # Tab context menu
└── tabEditor.js            # Tab editing
```

#### Supporting Files
```
js/webviews.js              # Webview management
js/util/settings/settings.js # Settings management
js/util/urlParser.js        # URL utilities
ext/icons/iconfont.css      # Icon system
```

## Implementation Notes

### Key CSS Classes
- `.theme-background-color` - Theme-aware background
- `.theme-text-color` - Theme-aware text color
- `.windowDragHandle` - Window dragging support
- `.tab-item` - Individual tab styling
- `.active` - Active tab state
- `.dark-mode` - Dark theme support

### Event System
The UI uses an event-driven architecture:
- `tabBar.events` - Tab-related events
- `tasks.on()` - Task-related events
- `webviews.bindEvent()` - Webview events

### State Management
- Tab state managed in `js/tabState/`
- UI state coordinated through `js/browserUI.js`
- Settings managed through `js/util/settings/`

## Code Examples Summary

### HTML Structure Examples
1. **Navbar Container** - Complete navbar with logo, menu, and tabs
2. **Address Bar** - Navigation buttons, URL input, and security icon
3. **Tab Structure** - Tab editor and tabs container

### CSS Examples
1. **Navigation Styling** - Address bar layout, button styling, and dark mode
2. **Tab Styling** - Tab animations, hover effects, and responsive design

### JavaScript Examples
1. **Address Bar Logic** - Event handling, URL navigation, and security updates
2. **Tab Creation** - Dynamic tab creation with icons, titles, and event listeners

## Quick Implementation Checklist

### Essential Files to Copy
- [ ] `index.html` - Main HTML structure
- [ ] `css/base.css` - Base styles
- [ ] `css/nav.css` - Navigation styling
- [ ] `css/tabBar.css` - Tab styling
- [ ] `js/browserUI.js` - Main UI controller
- [ ] `js/navbar/tabBar.js` - Tab management
- [ ] All files in `js/navbar/` directory

### Key Dependencies
- [ ] Carbon Icons (`ext/icons/iconfont.css`)
- [ ] Dragula library for tab dragging
- [ ] EventEmitter for event system

### Integration Points
- [ ] Webview management system
- [ ] Settings management
- [ ] URL parsing utilities
- [ ] Theme system

This documentation provides a complete reference for implementing the browser UI in another branch. All the essential files, their purposes, relationships, and actual code examples are documented above.
