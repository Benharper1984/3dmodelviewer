/**
 * Main Application Controller
 * Coordinates all modules and handles initialization
 */

class App {
    constructor() {
        this.userManager = new UserManager();
        this.galleryManager = new GalleryManager();
        this.modelViewerController = new ModelViewerController();
        this.modalManager = new ModalManager();
        this.screenshotCore = null;
    }

    initialize() {
        // Initialize model viewer
        const modelViewer = this.modelViewerController.initialize();
        
        // Detect user and set permissions
        const currentUser = this.userManager.detectUserFromSession();
        this.galleryManager.setCurrentUser(currentUser);
        
        // Initialize screenshot core with dependencies
        this.screenshotCore = new ScreenshotCore(
            modelViewer, 
            this.modelViewerController.getCurrentModelName(), 
            currentUser
        );
        
        // Load stored data
        this.galleryManager.loadStoredData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Make managers globally available for backward compatibility
        window.galleryManager = this.galleryManager;
        window.modalManager = this.modalManager;
    }

    setupEventListeners() {
        // Listen for screenshot saved events
        window.addEventListener('screenshotSaved', (e) => {
            this.galleryManager.addScreenshot(e.detail);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'escape':
                    if (this.screenshotCore.isSelectingArea) {
                        this.screenshotCore.cancelScreenshot();
                    } else {
                        this.modalManager.closeModal();
                    }
                    break;
                case 'r':
                    if (!this.screenshotCore.isSelectingArea) {
                        this.modelViewerController.resetCamera();
                    }
                    break;
                case 'a':
                    if (!this.screenshotCore.isSelectingArea) {
                        this.modelViewerController.toggleAutoRotate();
                    }
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.screenshotCore.startScreenshot();
                    }
                    break;
            }
        });
    }

    // Global functions for backward compatibility
    startScreenshot() {
        this.screenshotCore.startScreenshot();
    }

    resetCamera() {
        this.modelViewerController.resetCamera();
    }

    toggleAutoRotate() {
        this.modelViewerController.toggleAutoRotate();
    }

    clearAllScreenshots() {
        this.galleryManager.clearAllScreenshots();
    }
}

// Global functions for backward compatibility
let app;

function startScreenshot() {
    app.startScreenshot();
}

function resetCamera() {
    app.resetCamera();
}

function toggleAutoRotate() {
    app.toggleAutoRotate();
}

function clearAllScreenshots() {
    app.clearAllScreenshots();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    app.initialize();
});
