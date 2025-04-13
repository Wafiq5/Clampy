document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the code editor
    initializeCodeEditor();
    initializeResizablePanels();
    
    // Check if we should initialize room features
    const isRoomPage = window.location.search.includes('roomId') || 
                      document.querySelector('.room-code-editor') !== null ||
                      localStorage.getItem('userRoom') !== null;
    
    if (isRoomPage) {
        console.log("Room editor detected, initializing real-time collaboration");
        // Import and initialize the room functionality
        try {
            const roomModule = await import('./code-editor-room.js');
            await roomModule.initializeCodeEditorRoom();
            // Store room module globally for access from other functions
            window.roomModule = roomModule;
        } catch (error) {
            console.error("Error loading room module:", error);
        }
    }
});

// Global variables to store editor instances so they can be accessed from outside functions
let htmlEditor, cssEditor, jsEditor;
let ignoreNextEditorChange = false;

function initializeCodeEditor() {
    // Create HTML Editor with empty starting value for room collaboration
    htmlEditor = CodeMirror(document.querySelector('#html-editor'), {
        mode: 'xml',
        theme: 'material',
        lineNumbers: true,
        autoCloseTags: true,
        lineWrapping: true,
        value: ''  // Start with empty editor for room collaboration
    });

    // Create CSS Editor with empty starting value for room collaboration
    cssEditor = CodeMirror(document.querySelector('#css-editor'), {
        mode: 'css',
        theme: 'material',
        lineNumbers: true,
        autoCloseBrackets: true,
        lineWrapping: true,
        value: ''  // Start with empty editor for room collaboration
    });

    // Create JS Editor with empty starting value for room collaboration
    jsEditor = CodeMirror(document.querySelector('#js-editor'), {
        mode: 'javascript',
        theme: 'material',
        lineNumbers: true,
        autoCloseBrackets: true,
        lineWrapping: true,
        value: ''  // Start with empty editor for room collaboration
    });

    const consoleOutput = document.querySelector('#console-output');
    const clearConsoleBtn = document.querySelector('#clear-console-btn');

    // Clear console button functionality
    if (clearConsoleBtn) {
        clearConsoleBtn.addEventListener('click', () => {
            if (consoleOutput) {
                consoleOutput.innerHTML = '';
            }
        });
    }

    // Handle messages from the iframe (console logs)
    window.addEventListener('message', function (event) {
        // Check if the message is from our console interceptor
        if (event.data && event.data.source === 'clampy-console') {
            const message = event.data.message;

            // If we have a console output element
            if (consoleOutput) {
                // Create a new log entry
                const logEntry = document.createElement('div');
                logEntry.className = `console-${message.type}`;

                // Format the content
                const content = message.content.join(' ');
                logEntry.textContent = content;

                // Add timestamp
                const timestamp = new Date().toLocaleTimeString();
                const timestampSpan = document.createElement('span');
                timestampSpan.className = 'console-timestamp';
                timestampSpan.textContent = timestamp + ' ';
                logEntry.prepend(timestampSpan);

                // Add to console
                consoleOutput.appendChild(logEntry);

                // Auto-scroll to bottom
                consoleOutput.scrollTop = consoleOutput.scrollHeight;
            }
        }
    });

    // Set up event listeners for code changes with debouncing to improve performance
    let previewTimeout = null;
    let syncTimeout = null;
    
    const updateWithDelay = () => {
        // Skip if the change was programmatically triggered and should be ignored
        if (ignoreNextEditorChange) {
            ignoreNextEditorChange = false;
            return;
        }
        
        // Update the preview
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(updatePreview, 300);
        
        // Sync with other room members
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            // Only update if we have the room module
            if (window.roomModule && window.roomModule.getCurrentRoomId()) {
                const code = {
                    html: htmlEditor.getValue(),
                    css: cssEditor.getValue(),
                    js: jsEditor.getValue()
                };
                window.roomModule.updateRoomCode(window.roomModule.getCurrentRoomId(), code);
            }
        }, 500);
    };

    htmlEditor.on('change', updateWithDelay);
    cssEditor.on('change', updateWithDelay);
    jsEditor.on('change', updateWithDelay);

    // Add collapse/expand functionality for editors
    document.querySelectorAll('.editor-header button.toggle-btn').forEach(button => {
        button.addEventListener('click', function () {
            const container = this.closest('.editor-container');
            container.classList.toggle('collapsed');
            this.innerHTML = container.classList.contains('collapsed') ? '⤢' : '⤡';

            // Refresh editors when expanding to fix any display issues
            if (!container.classList.contains('collapsed')) {
                if (container.querySelector('#html-editor')) htmlEditor.refresh();
                if (container.querySelector('#css-editor')) cssEditor.refresh();
                if (container.querySelector('#js-editor')) jsEditor.refresh();
            }
        });
    });

    // Handle console toggle
    const consoleToggleBtn = document.querySelector('#console-toggle-btn');
    const consoleContainer = document.querySelector('#console-container');

    if (consoleToggleBtn && consoleContainer) {
        consoleToggleBtn.addEventListener('click', () => {
            const isHidden = consoleContainer.classList.toggle('hidden');
            consoleToggleBtn.textContent = isHidden ? 'Show Console' : 'Hide Console';

            // Adjust the layout
            const previewPane = document.querySelector('.preview-pane');
            if (previewPane) {
                previewPane.style.height = isHidden ? '100%' : '70%';
            }
        });
    }

    // Initial preview render
    updatePreview();
}

// Function to make editor panels resizable
function initializeResizablePanels() {
    // Add resize handlers for horizontal panel resizing (between editors)
    let isResizing = false;
    let currentResizer = null;
    let startX, startWidth, nextStartWidth;

    document.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('resize-handle-horizontal')) {
            isResizing = true;
            currentResizer = e.target;
            document.body.classList.add('resizing');
            
            // Get the editor container
            const editorContainer = currentResizer.parentNode;
            const nextContainer = editorContainer.nextElementSibling;
            
            // Store the initial width
            startWidth = editorContainer.getBoundingClientRect().width;
            if (nextContainer) {
                nextStartWidth = nextContainer.getBoundingClientRect().width;
            }
            
            // Store the starting cursor position
            startX = e.clientX;
        }
    });

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        
        // Calculate how far the mouse has moved
        const dx = e.clientX - startX;
        
        // Get the editor container and its sibling
        const editorContainer = currentResizer.parentNode;
        const nextContainer = editorContainer.nextElementSibling;
        
        // Update the width based on the mouse position
        const newWidth = startWidth + dx;
        
        // Don't allow the editor to get too small
        if (newWidth > 50 && (!nextContainer || nextContainer.getBoundingClientRect().width > 50)) {
            editorContainer.style.flex = 'none';
            editorContainer.style.width = `${newWidth}px`;
            
            if (nextContainer) {
                const newNextWidth = nextStartWidth - dx;
                if (newNextWidth > 50) {
                    nextContainer.style.flex = 'none';
                    nextContainer.style.width = `${newNextWidth}px`;
                }
            }
        }
    });

    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            currentResizer = null;
            document.body.classList.remove('resizing');
            
            // Refresh all editors to ensure proper rendering
            if (htmlEditor) htmlEditor.refresh();
            if (cssEditor) cssEditor.refresh();
            if (jsEditor) jsEditor.refresh();
        }
    });

    // Add resize handler for vertical resizing (between editors pane and preview)
    let isVerticalResizing = false;
    let currentVerticalResizer = null;
    let startY, startHeight, bottomStartHeight;

    document.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('resize-handle-vertical')) {
            isVerticalResizing = true;
            currentVerticalResizer = e.target;
            document.body.classList.add('resizing');
            
            const paneName = currentVerticalResizer.getAttribute('data-resize');
            
            if (paneName === 'editors-pane-height') {
                const editorsPane = document.querySelector('.editors-pane');
                const previewPane = document.querySelector('.preview-pane');
                
                startHeight = editorsPane.getBoundingClientRect().height;
                bottomStartHeight = previewPane.getBoundingClientRect().height;
                startY = e.clientY;
            } else if (paneName === 'preview-pane-height') {
                const previewPane = document.querySelector('.preview-pane');
                const consoleContainer = document.querySelector('.console-container');
                
                startHeight = previewPane.getBoundingClientRect().height;
                bottomStartHeight = consoleContainer.getBoundingClientRect().height;
                startY = e.clientY;
            }
        }
    });

    document.addEventListener('mousemove', function(e) {
        if (!isVerticalResizing) return;
        
        const dy = e.clientY - startY;
        const paneName = currentVerticalResizer.getAttribute('data-resize');
        
        if (paneName === 'editors-pane-height') {
            const editorsPane = document.querySelector('.editors-pane');
            const previewPane = document.querySelector('.preview-pane');
            
            const newHeight = startHeight + dy;
            const newBottomHeight = bottomStartHeight - dy;
            
            // Don't allow panes to get too small
            if (newHeight > 100 && newBottomHeight > 100) {
                editorsPane.style.height = `${newHeight}px`;
                previewPane.style.height = `${newBottomHeight}px`;
            }
        } else if (paneName === 'preview-pane-height') {
            const previewPane = document.querySelector('.preview-pane');
            const consoleContainer = document.querySelector('.console-container');
            
            if (consoleContainer.classList.contains('hidden')) return;
            
            const newHeight = startHeight + dy;
            const newBottomHeight = bottomStartHeight - dy;
            
            // Don't allow panes to get too small
            if (newHeight > 100 && newBottomHeight > 50) {
                previewPane.style.height = `${newHeight}px`;
                consoleContainer.style.height = `${newBottomHeight}px`;
            }
        }
    });

    document.addEventListener('mouseup', function() {
        if (isVerticalResizing) {
            isVerticalResizing = false;
            currentVerticalResizer = null;
            document.body.classList.remove('resizing');
            
            // Refresh all editors to ensure proper rendering
            if (htmlEditor) htmlEditor.refresh();
            if (cssEditor) cssEditor.refresh();
            if (jsEditor) jsEditor.refresh();
        }
    });
}

// Function to get code from the editors
function getEditorCode(roomId) {
    const code = {
        html: htmlEditor ? htmlEditor.getValue() : '',
        css: cssEditor ? cssEditor.getValue() : '',
        js: jsEditor ? jsEditor.getValue() : ''
    };
    
    // If we have a room module and roomId is provided, update the room code
    if (window.roomModule && (roomId || window.roomModule.getCurrentRoomId())) {
        const targetRoomId = roomId || window.roomModule.getCurrentRoomId();
        window.roomModule.updateRoomCode(targetRoomId, code);
    }
    
    return code;
}

// Function to set code in the editors
async function setEditorCode(html, css, js, roomId, skipUpdate = false) {
    // If skipUpdate is true, we won't trigger the change event handlers
    if (skipUpdate) {
        ignoreNextEditorChange = true;
    }
    
    // If roomId is provided, try to get code from that room
    if (roomId && window.roomModule) {
        try {
            const roomCode = await window.roomModule.getRoomCode(roomId);
            html = html || roomCode.html;
            css = css || roomCode.css;
            js = js || roomCode.js;
        } catch (error) {
            console.error("Error getting room code:", error);
        }
    }
    
    if (htmlEditor && html !== undefined) {
        htmlEditor.setValue(html || '');
        localStorage.setItem('clampy-html', html);
    }

    if (cssEditor && css !== undefined) {
        cssEditor.setValue(css || '');
        localStorage.setItem('clampy-css', css);
    }

    if (jsEditor && js !== undefined) {
        jsEditor.setValue(js || '');
        localStorage.setItem('clampy-js', js);
    }

    // Update the preview
    updatePreview();
}

// Make the functions available globally
window.getEditorCode = getEditorCode;
window.setEditorCode = setEditorCode;

// Function to update the preview
function updatePreview() {
    if (!htmlEditor || !cssEditor || !jsEditor) return;

    const htmlCode = htmlEditor.getValue();
    const cssCode = cssEditor.getValue();
    const jsCode = jsEditor.getValue();

    // Save to localStorage
    localStorage.setItem('clampy-html', htmlCode);
    localStorage.setItem('clampy-css', cssCode);
    localStorage.setItem('clampy-js', jsCode);
    
    // Sync with room if we're in a room
    if (window.roomModule && window.roomModule.getCurrentRoomId()) {
        window.roomModule.updateRoomCode(window.roomModule.getCurrentRoomId(), {
            html: htmlCode,
            css: cssCode,
            js: jsCode
        });
    }

    // Update preview
    const previewFrame = document.querySelector('#preview-frame');

    try {
        // Access the iframe's document
        const preview = previewFrame.contentDocument ||
            (previewFrame.contentWindow && previewFrame.contentWindow.document);

        if (!preview) {
            console.error("Could not access iframe document");
            return;
        }

        // Clear the previous content
        preview.open();

        // Create custom console to capture logs
        const consoleInterceptScript = `
        <script>
          (function() {
            const originalConsole = console;
            
            // Override console methods
            console = {
              log: function() {
                originalConsole.log.apply(originalConsole, arguments);
                captureLog('log', arguments);
              },
              error: function() {
                originalConsole.error.apply(originalConsole, arguments);
                captureLog('error', arguments);
              },
              warn: function() {
                originalConsole.warn.apply(originalConsole, arguments);
                captureLog('warn', arguments);
              },
              info: function() {
                originalConsole.info.apply(originalConsole, arguments);
                captureLog('info', arguments);
              }
            };
            
            // Helper function to format and send messages to parent window
            function captureLog(type, args) {
              const message = {
                type: type,
                content: Array.from(args).map(arg => {
                  if (typeof arg === 'object') {
                    try {
                      return JSON.stringify(arg);
                    } catch (e) {
                      return arg.toString();
                    }
                  }
                  return arg;
                })
              };
              
              window.parent.postMessage({
                source: 'clampy-console',
                message: message
              }, '*');
            }
          })();
        </script>
      `;

        // Write the new content with console interceptor
        preview.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${cssCode}</style>
            ${consoleInterceptScript}
          </head>
          <body>
            ${htmlCode}
            <script>${jsCode}</script>
          </body>
        </html>
      `);

        // Close the document
        preview.close();
    } catch (error) {
        console.error("Error updating preview:", error);
    }
}