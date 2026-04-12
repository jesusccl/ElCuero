// ===== CAMERA SYSTEM =====
class Camera {
    constructor(viewWidth, viewHeight) {
        this.x = 0;
        this.y = 0;
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeTime = 0;
        this.shakeMagnitude = 0;
    }

    follow(targetX, targetY, mapWidth, mapHeight) {
        const targetCamX = targetX - this.viewWidth / 2;
        const targetCamY = targetY - this.viewHeight / 2;

        // Smooth follow
        this.x += (targetCamX - this.x) * 0.1;
        this.y += (targetCamY - this.y) * 0.1;

        // Clamp to map bounds
        this.x = Math.max(0, Math.min(this.x, mapWidth * TILE_SIZE - this.viewWidth));
        this.y = Math.max(0, Math.min(this.y, mapHeight * TILE_SIZE - this.viewHeight));

        // Apply shake
        if (this.shakeTime > 0) {
            this.x += (Math.random() - 0.5) * this.shakeMagnitude;
            this.y += (Math.random() - 0.5) * this.shakeMagnitude;
        }
    }

    shake(magnitude, duration) {
        this.shakeMagnitude = magnitude;
        this.shakeTime = duration;
    }

    update(dt) {
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            if (this.shakeTime <= 0) {
                this.shakeMagnitude = 0;
            }
        }
    }

    resize(w, h) {
        this.viewWidth = w;
        this.viewHeight = h;
    }
}
