/**
 * Gallery Manager Module
 * Handles screenshot gallery and comment management
 */

class GalleryManager {
    constructor() {
        this.screenshots = [];
        this.currentUser = null;
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }

    getScreenshots() {
        return this.screenshots;
    }

    addScreenshot(screenshot) {
        this.screenshots.push(screenshot);
        this.addScreenshotToGallery(screenshot, true);
        this.saveToStorage();
        
        // Show gallery if first screenshot
        if (this.screenshots.length === 1) {
            document.getElementById('screenshotGallery').style.display = 'block';
        }
    }

    addScreenshotToGallery(screenshot, shouldSave = true) {
        const container = document.getElementById('screenshotsContainer');
        
        // Hide empty state if this is the first screenshot
        const emptyState = container.querySelector('.empty-gallery');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Determine if current user can delete this screenshot
        const canDeleteScreenshot = this.currentUser && this.currentUser.canDelete;
        
        const item = document.createElement('div');
        item.className = 'screenshot-item';
        item.innerHTML = `
            <img src="${screenshot.image}" alt="Screenshot" class="screenshot-preview" onclick="openModal('${screenshot.image}')">
            <div class="screenshot-timestamp">${screenshot.timestamp}</div>
            <div class="screenshot-metadata">
                <div class="model-version-info">Model File: ${screenshot.modelVersion}</div>
                <div class="created-by-info">Created by: <strong>${screenshot.createdBy}</strong></div>
            </div>
            <div class="comment-section">
                <div id="comments-list-${screenshot.id}" class="comments-list"></div>
                <textarea class="comment-input" placeholder="Add a comment about this screenshot..." data-id="${screenshot.id}"></textarea>
                <div class="comment-buttons">
                    <button class="save-comment-btn" onclick="galleryManager.addComment(${screenshot.id})">Add Comment</button>
                    ${canDeleteScreenshot ? `<button class="delete-screenshot-btn" onclick="galleryManager.deleteScreenshot(${screenshot.id})">Delete Screenshot</button>` : ''}
                </div>
            </div>
        `;
        
        container.appendChild(item);
        
        // Load existing comments
        if (screenshot.comments && screenshot.comments.length > 0) {
            screenshot.comments.forEach(comment => {
                this.displayComment(screenshot.id, comment);
            });
        }
    }

    addComment(screenshotId) {
        const input = document.querySelector(`[data-id="${screenshotId}"]`);
        const commentText = input.value.trim();
        
        if (!commentText) {
            alert('Please enter a comment first!');
            return;
        }
        
        // Find screenshot and add comment
        const screenshot = this.screenshots.find(s => s.id === screenshotId);
        if (screenshot) {
            const comment = {
                id: Date.now(),
                text: commentText,
                timestamp: new Date().toLocaleString(),
                author: this.currentUser ? this.currentUser.name : 'Unknown User',
                authorRole: this.currentUser ? this.currentUser.role : 'unknown'
            };
            
            screenshot.comments.push(comment);
            this.displayComment(screenshotId, comment);
            
            // Save to storage
            this.saveToStorage();
            
            // Clear input
            input.value = '';
        }
    }

    displayComment(screenshotId, comment) {
        const commentsList = document.getElementById(`comments-list-${screenshotId}`);
        
        // Determine if current user can delete this comment
        const canDeleteComment = this.currentUser && (this.currentUser.canDelete || comment.author === this.currentUser.name);
        
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        commentDiv.innerHTML = `
            ${canDeleteComment ? `<button class="delete-comment-btn" onclick="galleryManager.deleteComment(${screenshotId}, ${comment.id})" title="Delete comment">×</button>` : ''}
            <div class="comment-author">
                <strong>${comment.author}</strong>
                <span class="comment-role">${comment.authorRole === 'admin' ? '(Admin)' : '(Client)'}</span>
            </div>
            <div class="comment-text">${comment.text}</div>
            <div class="comment-timestamp">${comment.timestamp}</div>
        `;
        
        commentsList.appendChild(commentDiv);
    }

    deleteComment(screenshotId, commentId) {
        if (confirm('Delete this comment?')) {
            // Remove from screenshot data
            const screenshot = this.screenshots.find(s => s.id === screenshotId);
            if (screenshot) {
                screenshot.comments = screenshot.comments.filter(c => c.id !== commentId);
                
                // Save to storage
                this.saveToStorage();
            }
            
            // Remove from DOM
            const commentElement = event.target.closest('.comment-item');
            commentElement.remove();
        }
    }

    deleteScreenshot(screenshotId) {
        if (!this.currentUser || !this.currentUser.canDelete) {
            alert('You do not have permission to delete screenshots.');
            return;
        }
        
        if (confirm('Are you sure you want to delete this screenshot?')) {
            // Remove from array
            this.screenshots = this.screenshots.filter(s => s.id !== screenshotId);
            
            // Save to storage
            this.saveToStorage();
            
            // Remove from DOM
            const item = document.querySelector(`[data-id="${screenshotId}"]`).closest('.screenshot-item');
            item.remove();
            
            // Show empty state if no screenshots remain
            if (this.screenshots.length === 0) {
                this.showEmptyState();
            }
        }
    }

    clearAllScreenshots() {
        if (!this.currentUser || !this.currentUser.canDelete) {
            alert('You do not have permission to clear all screenshots.');
            return;
        }
        
        if (confirm('Are you sure you want to delete all screenshots?')) {
            this.screenshots = [];
            
            // Clear storage
            localStorage.removeItem('screenshotData');
            
            this.showEmptyState();
        }
    }

    showEmptyState() {
        const container = document.getElementById('screenshotsContainer');
        container.innerHTML = `
            <div class="empty-gallery">
                <div class="empty-gallery-icon">📷</div>
                <div class="empty-gallery-text">No screenshots yet</div>
                <div class="empty-gallery-subtext">Drag to select an area on the model above to take a screenshot</div>
            </div>
        `;
    }

    saveToStorage() {
        const data = {
            screenshots: this.screenshots,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('screenshotData', JSON.stringify(data));
    }

    loadStoredData() {
        try {
            const stored = localStorage.getItem('screenshotData');
            if (stored) {
                const data = JSON.parse(stored);
                this.screenshots = data.screenshots || [];
                
                // Load screenshots into gallery
                if (this.screenshots.length > 0) {
                    const container = document.getElementById('screenshotsContainer');
                    container.innerHTML = ''; // Clear empty state
                    
                    this.screenshots.forEach(screenshot => {
                        this.addScreenshotToGallery(screenshot, false); // false = don't save to storage again
                    });
                }
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
            this.screenshots = [];
        }
    }
}
