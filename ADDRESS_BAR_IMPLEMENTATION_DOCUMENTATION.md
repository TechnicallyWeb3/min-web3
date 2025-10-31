# Address Bar and Navigation Buttons Implementation Documentation

This document provides comprehensive details about how the address bar (URL bar/search bar) and navigation buttons (back/forward) are implemented in the Min browser. This documentation will help you implement the same functionality in another branch.

## Table of Contents

1. [Overview](#overview)
2. [HTML Structure](#html-structure)
3. [CSS Styling](#css-styling)
4. [JavaScript Implementation](#javascript-implementation)
5. [Navigation Buttons](#navigation-buttons)
6. [Search Bar System](#search-bar-system)
7. [Event Handling](#event-handling)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Plugin System](#plugin-system)
10. [Integration Points](#integration-points)

## Overview

The browser implements a persistent address bar with navigation controls that includes:
- **Address Bar**: Input field for URLs and search queries
- **Navigation Buttons**: Back, Forward, Reload, Home buttons
- **Security Icon**: Shows lock/unlock status
- **Bookmark Button**: For bookmarking pages
- **Search Suggestions**: Real-time search suggestions
- **URL Suggestions**: History and bookmark suggestions

## HTML Structure

The main HTML structure is located in `index.html`:

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

### Key Elements:
- `#address-bar-bar`: Main container for the address bar
- `#nav-back`, `#nav-forward`: Navigation buttons
- `#nav-reload`: Reload button with custom SVG icon
- `#nav-home`: Home button
- `#address-bar`: Main input field
- `#security-icon`: Security status indicator
- `#bookmark-btn`: Bookmark toggle button

## CSS Styling

The styling is primarily handled in `css/nav.css`:

### Main Address Bar Container
```css
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
```

### Navigation Buttons
```css
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

#address-bar-bar .browser-nav-btn:hover {
  background: #e3e3e3;
}
```

### Address Input Field
```css
.browser-address-input {
  width: 100%;
  padding: 8px 12px 8px 40px;
  border-radius: 999px;
  border: 1px solid #d0d0d0;
  background: transparent !important;
  color: #222;
  font-size: 1em;
  transition: border 0.2s;
  box-sizing: border-box;
  margin: 0;
  min-width: 0;
  height: 36px;
  display: block;
}

#address-bar-bar .browser-address-input:focus {
  border: 1.5px solid #1976d2;
  outline: none;
}
```

### Security Icon
```css
#security-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1em;
  color: #4caf50;
  pointer-events: none;
  z-index: 10;
  background: transparent;
  height: 20px;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Dark Mode Support
```css
body.dark-mode #address-bar-bar {
  background: #23272f;
  border-bottom: 1px solid #333;
}

body.dark-mode #address-bar-bar .browser-nav-btn {
  color: #bbb;
}

body.dark-mode #address-bar-bar .browser-nav-btn:hover {
  background: #333;
}

body.dark-mode #address-bar-bar .browser-address-input {
  background: #2c2f36;
  color: #eee;
  border: 1px solid #444;
}
```

## JavaScript Implementation

### Main Address Bar Logic (`js/browserUI.js`)

The core address bar functionality is implemented in `browserUI.js`:

```javascript
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
    // You can set your home page here
    webviews.update(tabs.getSelected(), settings.get('homePage') || 'min://newtab');
  });

  // Bookmark button (toggle bookmark)
  bookmarkBtn.addEventListener('click', function () {
    // Implement bookmark logic here if needed
    // For now, just a placeholder
    alert('Bookmark feature coming soon!');
  });

  // Initial sync
  updateAddressBar();
});
```

## Navigation Buttons

### Legacy Navigation Buttons (`js/navbar/navigationButtons.js`)

There's also a separate navigation buttons implementation:

```javascript
const webviews = require('webviews.js')

var navigationButtons = {
  tabsList: document.getElementById('tabs-inner'),
  container: document.getElementById('toolbar-navigation-buttons'),
  backButton: document.getElementById('back-button'),
  forwardButton: document.getElementById('forward-button'),
  update: function () {
    if (!tabs.get(tabs.getSelected()).url) {
      navigationButtons.backButton.disabled = true
      navigationButtons.forwardButton.disabled = true
      return
    }
    webviews.callAsync(tabs.getSelected(), 'canGoBack', function (err, canGoBack) {
      if (err) {
        return
      }
      navigationButtons.backButton.disabled = !canGoBack
    })
    webviews.callAsync(tabs.getSelected(), 'canGoForward', function (err, canGoForward) {
      if (err) {
        return
      }
      navigationButtons.forwardButton.disabled = !canGoForward
      if (canGoForward) {
        navigationButtons.container.classList.add('can-go-forward')
      } else {
        navigationButtons.container.classList.remove('can-go-forward')
      }
    })
  },
  initialize: function () {
    navigationButtons.container.hidden = false

    navigationButtons.backButton.addEventListener('click', function (e) {
      webviews.goBackIgnoringRedirects(tabs.getSelected())
    })

    navigationButtons.forwardButton.addEventListener('click', function () {
      webviews.callAsync(tabs.getSelected(), 'goForward')
    })

    // Event listeners for tab changes and navigation
    tasks.on('tab-selected', this.update)
    webviews.bindEvent('did-navigate', this.update)
    webviews.bindEvent('did-navigate-in-page', this.update)
  }
}
```

## Search Bar System

### Main Search Bar (`js/searchbar/searchbar.js`)

The search bar system is more complex and handles suggestions:

```javascript
const EventEmitter = require('events')

var searchbar = {
  el: document.getElementById('searchbar'),
  associatedInput: null,
  events: new EventEmitter(),
  show: function (associatedInput) {
    searchbar.el.hidden = false
    searchbar.associatedInput = associatedInput
  },
  hide: function () {
    searchbar.associatedInput = null
    searchbar.el.hidden = true
    searchbarPlugins.clearAll()
  },
  getValue: function () {
    var text = searchbar.associatedInput.value
    return text.replace(text.substring(searchbar.associatedInput.selectionStart, searchbar.associatedInput.selectionEnd), '')
  },
  showResults: function (text, event) {
    // find the real input value, accounting for highlighted suggestions and the key that was just pressed
    var realText
    if (event && event.keyCode !== 8) {
      realText = text.substring(0, searchbar.associatedInput.selectionStart) + event.key + text.substring(searchbar.associatedInput.selectionEnd, text.length)
    } else {
      realText = text
    }
    searchbarPlugins.run(realText, searchbar.associatedInput, event)
  },
  openURL: function (url, event) {
    var hasURLHandler = searchbarPlugins.runURLHandlers(url)
    if (hasURLHandler) {
      return
    }

    if (event && (window.platformType === 'mac' ? event.metaKey : event.ctrlKey)) {
      openURLInBackground(url)
      return true
    } else {
      searchbar.events.emit('url-selected', { url: url, background: false })
      // focus the webview, so that autofocus inputs on the page work
      webviews.focus()
      return false
    }
  }
}
```

### Search Bar Plugins System (`js/searchbar/searchbarPlugins.js`)

The search bar uses a plugin system for different types of suggestions:

```javascript
const searchbarPlugins = {
  topAnswerArea: searchbar.querySelector('.top-answer-area'),
  // empties all containers in the searchbar
  clearAll: function () {
    empty(searchbarPlugins.topAnswerArea)
    topAnswer = {
      plugin: null,
      item: null
    }
    for (var i = 0; i < plugins.length; i++) {
      empty(plugins[i].container)
    }
  },

  addResult: function (pluginName, data, options = {}) {
    if (options.allowDuplicates) {
      data.allowDuplicates = true
    }
    if (data.url && !data.allowDuplicates) {
      // skip duplicates
      for (var plugin in results) {
        for (var i = 0; i < results[plugin].length; i++) {
          if (results[plugin][i].url === data.url && !results[plugin][i].allowDuplicates) {
            return
          }
        }
      }
    }
    var item = searchbarUtils.createItem(data)

    if (data.url) {
      item.setAttribute('data-url', data.url)
      item.addEventListener('click', function (e) {
        URLOpener(data.url, e)
      })
    }

    searchbarPlugins.getContainer(pluginName).appendChild(item)
    results[pluginName].push(data)
  },

  register: function (name, object) {
    // add the container
    var container = document.createElement('div')
    container.classList.add('searchbar-plugin-container')
    container.setAttribute('data-plugin', name)
    searchbar.insertBefore(container, searchbar.childNodes[object.index + 2])

    plugins.push({
      name: name,
      container: container,
      trigger: object.trigger,
      showResults: object.showResults
    })

    results[name] = []
  },

  run: function (text, input, event) {
    for (var i = 0; i < plugins.length; i++) {
      try {
        if (plugins[i].showResults && (!plugins[i].trigger || plugins[i].trigger(text))) {
          plugins[i].showResults(text, input, event)
        } else {
          searchbarPlugins.reset(plugins[i].name)
        }
      } catch (e) {
        console.error('error in searchbar plugin "' + plugins[i].name + '":', e)
      }
    }
  }
}
```

### Search Suggestions Plugin (`js/searchbar/searchSuggestionsPlugin.js`)

```javascript
function showSearchSuggestions (text, input, event) {
  const suggestionsURL = searchEngine.getCurrent().suggestionsURL

  if (!suggestionsURL) {
    searchbarPlugins.reset('searchSuggestions')
    return
  }

  if ((searchbarPlugins.getResultCount() - searchbarPlugins.getResultCount('searchSuggestions')) > 3) {
    searchbarPlugins.reset('searchSuggestions')
    return
  }

  fetch(suggestionsURL.replace('%s', encodeURIComponent(text)), {
    cache: 'force-cache'
  })
    .then(function (response) {
      return response.json()
    })
    .then(function (results) {
      searchbarPlugins.reset('searchSuggestions')

      if (searchbarPlugins.getResultCount() > 3) {
        return
      }

      if (results) {
        results = results[1].slice(0, 3)
        results.forEach(function (result) {
          var data = {
            title: result,
            url: result
          }

          if (urlParser.isPossibleURL(result)) { // website suggestions
            data.icon = 'carbon:earth-filled'
          } else { // regular search results
            data.icon = 'carbon:search'
          }

          searchbarPlugins.addResult('searchSuggestions', data)
        })
      }
    })
}
```

### Place Suggestions Plugin (`js/searchbar/placeSuggestionsPlugin.js`)

```javascript
async function showPlaceSuggestions (text, input, event) {
  // use the current tab's url for history suggestions, or the previous tab if the current tab is empty
  var url = tabs.get(tabs.getSelected()).url

  if (!url) {
    var previousTab = tabs.getAtIndex(tabs.getIndex(tabs.getSelected()) - 1)
    if (previousTab) {
      url = previousTab.url
    }
  }

  let results = await places.getPlaceSuggestions(url)

  searchbarPlugins.reset('placeSuggestions')

  var tabList = tabs.get().map(function (tab) {
    return tab.url
  })

  results = results.filter(function (item) {
    return tabList.indexOf(item.url) === -1
  })

  results.slice(0, 4).forEach(function (result) {
    searchbarPlugins.addResult('placeSuggestions', {
      title: urlParser.prettyURL(result.url),
      secondaryText: searchbarUtils.getRealTitle(result.title),
      url: result.url,
      delete: function () {
        places.deleteHistory(result.url)
      }
    })
  })
}
```

## Event Handling

### Tab Editor Integration (`js/navbar/tabEditor.js`)

The tab editor handles the address bar input when in edit mode:

```javascript
tabEditor.input.addEventListener('keypress', function (e) {
  if (e.keyCode === 13) { // return key pressed; update the url
    if (this.getAttribute('data-autocomplete') && this.getAttribute('data-autocomplete').toLowerCase() === this.value.toLowerCase()) {
      // special case: if the typed input is capitalized differently from the actual URL that was autocompleted (but is otherwise the same), then we want to open the actual URL instead of what was typed.
      searchbar.openURL(this.getAttribute('data-autocomplete'), e)
    } else {
      searchbar.openURL(this.value, e)
    }
  } else if (e.keyCode === 9) {
    return
    // tab key, do nothing - in keydown listener
  } else if (e.keyCode === 16) {
    return
    // shift key, do nothing
  } else if (e.keyCode === 8) {
    return
    // delete key is handled in keyUp
  } else { // show the searchbar
    searchbar.showResults(this.value, e)
  }

  // on keydown, if the autocomplete result doesn't change, we move the selection instead of regenerating it to avoid race conditions with typing.
  var v = e.key
  var sel = this.value.substring(this.selectionStart, this.selectionEnd).indexOf(v)

  if (v && sel === 0) {
    this.selectionStart += 1
    e.preventDefault()
  }
})
```

## Keyboard Shortcuts

### Key Bindings (`js/util/keyMap.js`)

```javascript
var defaultKeyMap = {
  goBack: 'mod+left',
  goForward: 'mod+right',
  enterEditMode: ['mod+l', 'mod+k'],
  completeSearchbar: 'mod+enter',
  reload: ['mod+r', 'f5'],
  reloadIgnoringCache: 'mod+f5',
  // ... other shortcuts
}
```

### Default Keybindings (`js/defaultKeybindings.js`)

```javascript
keybindings.defineShortcut('goBack', function (d) {
  webviews.callAsync(tabs.getSelected(), 'goBack')
})

keybindings.defineShortcut('goForward', function (d) {
  webviews.callAsync(tabs.getSelected(), 'goForward')
})

keybindings.defineShortcut('enterEditMode', function (e) {
  tabEditor.show(tabs.getSelected())
  return false
})

keybindings.defineShortcut('completeSearchbar', function () {
  if (searchbar.associatedInput) { // if the searchbar is open
    var value = searchbar.associatedInput.value

    // if the text is already a URL, navigate to that page
    if (urlParser.isPossibleURL(value)) {
      searchbar.events.emit('url-selected', { url: value, background: false })
    } else {
      searchbar.events.emit('url-selected', { url: urlParser.parse(value + '.com'), background: false })
    }
  }
})
```

### Keyboard Navigation Helper (`js/util/keyboardNavigationHelper.js`)

```javascript
const keyboardNavigationHelper = {
  groups: {}, // name: [containers]
  moveFocus: function (group, direction) { // 1: forward, -1: backward
    var items = []
    var realFocusItem
    var fakeFocusItem
    keyboardNavigationHelper.groups[group].forEach(function (container) {
      items = items.concat(Array.from(container.querySelectorAll('input:not(.ignores-keyboard-focus), [tabindex="-1"]:not(.ignores-keyboard-focus)')))
      if (!realFocusItem) {
        realFocusItem = container.querySelector(':focus')
      }
      if (!fakeFocusItem) {
        fakeFocusItem = container.querySelector('.fakefocus')
      }
    })

    var currentItem = fakeFocusItem || realFocusItem

    if (!items) {
      return
    }
    if (!currentItem) {
      items[0].focus()
      return
    }

    currentItem.classList.remove('fakefocus')

    while (items.length > 1) {
      var index = items.indexOf(currentItem)

      var nextItem
      if (items[index + direction]) {
        nextItem = index + direction
      } else if (index === 0 && direction === -1) {
        nextItem = items.length - 1
      } else if (index === items.length - 1 && direction === 1) {
        nextItem = 0
      }
      items[nextItem].focus()

      if (document.activeElement !== items[nextItem]) {
        // this item isn't focusable, try again
        items.splice(nextItem, 1)
      } else {
        // done
        break
      }
    }
  },
  handleKeypress: function (group, e) {
    if (e.keyCode === 9 && e.shiftKey) { // shift+tab
      e.preventDefault()
      keyboardNavigationHelper.moveFocus(group, -1)
    } else if (e.keyCode === 9 || e.keyCode === 40) { // tab or arrowdown key
      e.preventDefault()
      keyboardNavigationHelper.moveFocus(group, 1)
    } else if (e.keyCode === 38) { // arrowup key
      e.preventDefault()
      keyboardNavigationHelper.moveFocus(group, -1)
    }
  },
  addToGroup: function (group, container) {
    if (!keyboardNavigationHelper.groups[group]) {
      keyboardNavigationHelper.groups[group] = []
    }

    // insert the containers so that they are ordered based on DOM position
    var pos = 0
    while (pos <= keyboardNavigationHelper.groups[group].length - 1 && keyboardNavigationHelper.groups[group][pos].compareDocumentPosition(container) & Node.DOCUMENT_POSITION_FOLLOWING) {
      pos++
    }
    keyboardNavigationHelper.groups[group].splice(pos, 0, container)

    container.addEventListener('keydown', function (e) {
      keyboardNavigationHelper.handleKeypress(group, e)
    })
  }
}
```

## Plugin System

### Search Bar Utils (`js/searchbar/searchbarUtils.js`)

The search bar utils provide helper functions for creating suggestion items:

```javascript
function createItem (data) {
  var item = document.createElement('div')
  item.classList.add('searchbar-item')

  item.setAttribute('tabindex', '-1')

  if (data.classList) {
    for (var i = 0; i < data.classList.length; i++) {
      item.classList.add(data.classList[i])
    }
  }

  if (data.fakeFocus) {
    item.classList.add('fakefocus')
  }

  if (data.opacity) {
    item.style.opacity = data.opacity
  }

  if (data.colorCircle) {
    var colorCircle = document.createElement('div')
    colorCircle.className = 'image color-circle'
    colorCircle.style.backgroundColor = data.colorCircle
    item.appendChild(colorCircle)
  }

  if (data.icon) {
    var el = document.createElement('i')
    el.className = 'i ' + data.icon
    item.appendChild(el)
  }

  if (data.title) {
    var title = document.createElement('span')
    title.classList.add('title')

    if (!data.secondaryText) {
      title.classList.add('wide')
    }

    title.textContent = data.title.substring(0, 1000)
    item.appendChild(title)
  }

  if (data.secondaryText) {
    var secondaryText = document.createElement('span')
    secondaryText.classList.add('secondary-text')
    secondaryText.textContent = data.secondaryText.substring(0, 1000)
    item.appendChild(secondaryText)

    if (data.metadata) {
      data.metadata.forEach(function (str) {
        var metadataElement = document.createElement('span')
        metadataElement.className = 'md-info'
        metadataElement.textContent = str
        secondaryText.insertBefore(metadataElement, secondaryText.firstChild)
      })
    }
  }

  if (data.url) {
    item.setAttribute('data-url', data.url)
    item.addEventListener('click', function (e) {
      URLOpener(data.url, e)
    })
  }

  if (data.button) {
    var button = document.createElement('button')
    button.classList.add('action-button')
    button.classList.add('ignores-keyboard-focus')
    button.tabIndex = -1
    button.classList.add('i')
    button.classList.add(data.button.icon)

    button.addEventListener('click', function (e) {
      e.stopPropagation()
      data.button.fn(this)
    })
    item.appendChild(button)
    item.classList.add('has-action-button')
  }

  item.addEventListener('keydown', function (e) {
    // return should act like click
    if (e.keyCode === 13) {
      item.click()
    }
  })

  return item
}
```

## Integration Points

### Webviews Integration

The address bar integrates with the webviews system:

```javascript
// Navigation calls
webviews.callAsync(tabs.getSelected(), 'goBack')
webviews.callAsync(tabs.getSelected(), 'goForward')
webviews.callAsync(tabs.getSelected(), 'reload')
webviews.update(tabs.getSelected(), internalUrl)

// Check navigation state
webviews.callAsync(tabs.getSelected(), 'canGoBack', function (err, canGoBack) {
  navigationButtons.backButton.disabled = !canGoBack
})

webviews.callAsync(tabs.getSelected(), 'canGoForward', function (err, canGoForward) {
  navigationButtons.forwardButton.disabled = !canGoForward
})
```

### Tab System Integration

```javascript
// Get current tab
const tab = tabs.get(tabs.getSelected())

// Update tab with pretty URL
tabs.update(tabs.getSelected(), { prettyUrl: prettyUrl })

// Listen for tab changes
tabBar.events.on('tab-selected', updateAddressBar)
tasks.on('tab-updated', function (id, key) {
  if (id === tabs.getSelected() && (key === 'url' || key === 'secure')) {
    updateAddressBar()
  }
})
```

### Settings Integration

```javascript
// Get home page setting
webviews.update(tabs.getSelected(), settings.get('homePage') || 'min://newtab')

// Get keymap settings
var keyMap = keyMapModule.userKeyMap(settings.get('keyMap'))
```

## Implementation Checklist

To implement this in another branch, you'll need:

### HTML Structure
- [ ] Create the address bar container with proper IDs
- [ ] Add navigation buttons (back, forward, reload, home)
- [ ] Add the address input field
- [ ] Add security icon
- [ ] Add bookmark button
- [ ] Add new tab button

### CSS Styling
- [ ] Style the main address bar container
- [ ] Style navigation buttons with hover effects
- [ ] Style the address input field
- [ ] Position the security icon
- [ ] Add dark mode support
- [ ] Add responsive design considerations

### JavaScript Functionality
- [ ] Implement address bar update logic
- [ ] Add navigation button event handlers
- [ ] Implement URL parsing and navigation
- [ ] Add security icon updates
- [ ] Integrate with tab system
- [ ] Add keyboard shortcuts
- [ ] Implement search suggestions system

### Plugin System
- [ ] Create search bar plugins framework
- [ ] Implement search suggestions plugin
- [ ] Implement history suggestions plugin
- [ ] Add keyboard navigation support
- [ ] Create search bar utilities

### Integration
- [ ] Connect with webviews system
- [ ] Integrate with tab management
- [ ] Connect with settings system
- [ ] Add event handling for tab changes
- [ ] Implement URL validation and parsing

This documentation provides a complete overview of how the address bar and navigation buttons are implemented in the Min browser. The system is modular and extensible, making it relatively straightforward to implement in another branch while maintaining the same functionality and user experience.
