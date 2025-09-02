/**
 * Cloud Storage Manager
 * Handles Vercel Blob storage for screenshots and metadata
 */

class CloudStorageManager {
    constructor() {
        this.apiBase = '/api';
        this.currentJobId = this.getCurrentJobId();
    }

    // Generate or get current job ID (you can customize this logic)
    getCurrentJobId() {
        let jobId = sessionStorage.getItem('currentJobId');
        if (!jobId) {
            jobId = `job-${Date.now()}`;
            sessionStorage.setItem('currentJobId', jobId);
        }
        return jobId;
    }

    // Convert canvas to blob for upload
    async canvasToBlob(canvas, quality = 0.8) {
        return new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', quality);
        });
    }

    // Upload screenshot to Vercel Blob
    async uploadScreenshot(canvas, metadata) {
        try {
            const blob = await this.canvasToBlob(canvas);
            const timestamp = Date.now();
            const filename = `screenshots/${this.currentJobId}/screenshot-${timestamp}.jpg`;
            
            // Upload image
            const uploadResponse = await fetch(`${this.apiBase}/upload-screenshot?filename=${encodeURIComponent(filename)}`, {
                method: 'POST',
                body: blob
            });
            
            if (!uploadResponse.ok) {
                throw new Error('Failed to upload screenshot');
            }
            
            const { url } = await uploadResponse.json();
            
            // Create screenshot record with cloud URL
            const screenshotRecord = {
                id: timestamp,
                url: url,
                timestamp: new Date().toLocaleString(),
                comments: [],
                jobId: this.currentJobId,
                user: metadata.user || 'Unknown',
                ...metadata
            };
            
            // Store metadata in localStorage (much smaller footprint)
            await this.saveMetadata(screenshotRecord);
            
            return screenshotRecord;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    }

    // Save metadata to localStorage
    async saveMetadata(screenshotRecord) {
        const metadata = this.getStoredMetadata();
        metadata.push(screenshotRecord);
        localStorage.setItem(`screenshots_metadata_${this.currentJobId}`, JSON.stringify(metadata));
    }

    // Get stored metadata
    getStoredMetadata() {
        const stored = localStorage.getItem(`screenshots_metadata_${this.currentJobId}`);
        return stored ? JSON.parse(stored) : [];
    }

    // Load all screenshots for current job
    async loadScreenshots() {
        try {
            // Get metadata from localStorage
            const metadata = this.getStoredMetadata();
            
            // Verify cloud images still exist (optional)
            const validScreenshots = [];
            for (const screenshot of metadata) {
                // You could add a HEAD request here to verify the image exists
                // For now, we'll trust the metadata
                validScreenshots.push(screenshot);
            }
            
            return validScreenshots;
        } catch (error) {
            console.error('Failed to load screenshots:', error);
            return [];
        }
    }

    // Add comment to screenshot
    async addComment(screenshotId, comment, user) {
        const metadata = this.getStoredMetadata();
        const screenshot = metadata.find(s => s.id === screenshotId);
        
        if (screenshot) {
            screenshot.comments.push({
                id: Date.now(),
                text: comment,
                user: user,
                timestamp: new Date().toLocaleString()
            });
            
            await this.saveMetadata(screenshot);
            localStorage.setItem(`screenshots_metadata_${this.currentJobId}`, JSON.stringify(metadata));
        }
    }

    // Delete screenshot
    async deleteScreenshot(screenshotId) {
        try {
            const metadata = this.getStoredMetadata();
            const screenshotIndex = metadata.findIndex(s => s.id === screenshotId);
            
            if (screenshotIndex === -1) {
                throw new Error('Screenshot not found');
            }
            
            const screenshot = metadata[screenshotIndex];
            
            // Delete from Vercel Blob
            const deleteResponse = await fetch(`${this.apiBase}/delete-screenshot?url=${encodeURIComponent(screenshot.url)}`, {
                method: 'DELETE'
            });
            
            if (!deleteResponse.ok) {
                console.warn('Failed to delete from cloud, removing from metadata anyway');
            }
            
            // Remove from metadata
            metadata.splice(screenshotIndex, 1);
            localStorage.setItem(`screenshots_metadata_${this.currentJobId}`, JSON.stringify(metadata));
            
            return true;
        } catch (error) {
            console.error('Delete failed:', error);
            throw error;
        }
    }

    // Clear all screenshots for current job
    async clearAllScreenshots() {
        try {
            const metadata = this.getStoredMetadata();
            
            // Delete all from cloud
            const deletePromises = metadata.map(screenshot => 
                fetch(`${this.apiBase}/delete-screenshot?url=${encodeURIComponent(screenshot.url)}`, {
                    method: 'DELETE'
                }).catch(console.warn) // Don't fail if some deletions fail
            );
            
            await Promise.allSettled(deletePromises);
            
            // Clear metadata
            localStorage.removeItem(`screenshots_metadata_${this.currentJobId}`);
            
            return true;
        } catch (error) {
            console.error('Clear all failed:', error);
            throw error;
        }
    }

    // Get current job info
    getJobInfo() {
        return {
            jobId: this.currentJobId,
            screenshotCount: this.getStoredMetadata().length
        };
    }
}
