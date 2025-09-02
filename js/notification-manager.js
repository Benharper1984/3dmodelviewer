/**
 * Notification Manager
 * Handles email notifications between admin and clients
 */

class NotificationManager {
    constructor() {
        this.userManager = window.userManager;
        this.isNotifying = false;
    }

    // Admin sending notification to client (manual only)
    async notifyClient(message) {
        if (!this.isAdmin()) {
            throw new Error('Only admin can send client notifications');
        }

        const currentUser = this.userManager.getCurrentUser();

        return await this.sendNotification({
            notificationType: 'admin-to-client',
            senderName: currentUser.name,
            message: message,
            jobId: window.cloudStorageManager?.currentJobId || 'unknown',
            action: 'Designer sent you a message'
        });
    }

    // Auto-notify admin when client adds comment
    async notifyComment(screenshotId, commentText) {
        if (!this.shouldAutoNotify()) return;

        const currentUser = this.userManager.getCurrentUser();
        
        await this.sendNotification({
            notificationType: 'client-to-admin',
            senderName: currentUser.name,
            screenshotId: screenshotId,
            commentText: commentText,
            jobId: window.cloudStorageManager?.currentJobId || 'unknown',
            action: 'Added a comment'
        });
    }

    // Auto-notify admin when client takes screenshot
    async notifyScreenshot(screenshotId) {
        if (!this.shouldAutoNotify()) return;

        const currentUser = this.userManager.getCurrentUser();
        
        await this.sendNotification({
            notificationType: 'client-to-admin',
            senderName: currentUser.name,
            screenshotId: screenshotId,
            jobId: window.cloudStorageManager?.currentJobId || 'unknown',
            action: 'Took a screenshot'
        });
    }

    // Manual client message to admin
    async notifyAdmin(message = null) {
        if (this.isAdmin()) {
            throw new Error('Admin cannot send notifications to themselves');
        }

        const currentUser = this.userManager.getCurrentUser();
        
        return await this.sendNotification({
            notificationType: 'client-to-admin',
            senderName: currentUser.name,
            message: message,
            jobId: window.cloudStorageManager?.currentJobId || 'unknown',
            action: message ? 'Sent you a message' : 'Requested your attention'
        });
    }

    // Show modal for admin to send message to client
    showAdminMessageModal() {
        const modalHtml = `
            <div id="notificationModal" class="notification-modal">
                <div class="notification-modal-content">
                    <span class="close-modal" onclick="notificationManager.closeNotificationModal()">&times;</span>
                    <h3>📧 Send Message to The Thoughtful Father</h3>
                    
                    <div class="message-input">
                        <label>Message:</label>
                        <textarea id="notificationMessage" placeholder="Type your message to the client here..." rows="4"></textarea>
                    </div>
                    
                    <div class="notification-actions">
                        <button onclick="notificationManager.sendAdminMessage()" class="send-notification-btn">
                            📧 Send Message
                        </button>
                        <button onclick="notificationManager.closeNotificationModal()" class="cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Show modal for client to send message to admin
    showClientMessageModal() {
        const modalHtml = `
            <div id="notificationModal" class="notification-modal">
                <div class="notification-modal-content">
                    <span class="close-modal" onclick="notificationManager.closeNotificationModal()">&times;</span>
                    <h3>📬 Send Message to Ben (Designer)</h3>
                    
                    <div class="message-input">
                        <label>Message:</label>
                        <textarea id="notificationMessage" placeholder="Type your message to Ben here..." rows="4"></textarea>
                    </div>
                    
                    <div class="notification-actions">
                        <button onclick="notificationManager.sendClientMessage()" class="send-notification-btn">
                            📧 Send Message
                        </button>
                        <button onclick="notificationManager.closeNotificationModal()" class="cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async sendAdminMessage() {
        const message = document.getElementById('notificationMessage').value.trim();
        if (!message) {
            alert('Please enter a message');
            return;
        }

        try {
            await this.notifyClient(message);
            alert('Message sent to The Thoughtful Father!');
            this.closeNotificationModal();
        } catch (error) {
            alert('Failed to send message: ' + error.message);
        }
    }

    async sendClientMessage() {
        const message = document.getElementById('notificationMessage').value.trim();
        if (!message) {
            alert('Please enter a message');
            return;
        }

        try {
            await this.notifyAdmin(message);
            alert('Message sent to Ben!');
            this.closeNotificationModal();
        } catch (error) {
            alert('Failed to send message: ' + error.message);
        }
    }

    // Quick notify admin (client only)
    async quickNotifyAdmin() {
        if (this.isAdmin()) return;

        if (this.isNotifying) return;

        const button = document.getElementById('quickNotifyBtn');
        
        try {
            this.isNotifying = true;
            button.textContent = '📧 Sending...';
            button.disabled = true;

            await this.notifyAdmin();

            button.textContent = '✅ Sent!';
            setTimeout(() => {
                button.textContent = '🔔 Quick Notify';
                button.disabled = false;
                this.isNotifying = false;
            }, 3000);

        } catch (error) {
            button.textContent = '❌ Failed';
            setTimeout(() => {
                button.textContent = '🔔 Quick Notify';
                button.disabled = false;
                this.isNotifying = false;
            }, 3000);
        }
    }

    closeNotificationModal() {
        const modal = document.getElementById('notificationModal');
        if (modal) modal.remove();
    }

    // Core notification sender
    async sendNotification(data) {
        try {
            const response = await fetch('/api/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to send notification');
            }

            return await response.json();
        } catch (error) {
            console.error('Notification failed:', error);
            throw error;
        }
    }

    // Helper methods
    isAdmin() {
        const currentUser = this.userManager.getCurrentUser();
        return currentUser && currentUser.role === 'admin';
    }

    shouldAutoNotify() {
        // Only auto-notify when clients do things (to send to admin)
        return !this.isAdmin();
    }
}

// Initialize
window.notificationManager = new NotificationManager();
