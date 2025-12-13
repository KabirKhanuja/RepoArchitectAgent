export class Particle {
  x: number
  y: number
  vx: number
  vy: number
  baseX: number
  baseY: number
  size: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.baseX = x
    this.baseY = y
    this.vx = (Math.random() - 0.5) * 0.5
    this.vy = (Math.random() - 0.5) * 0.5
    this.size = Math.random() * 2 + 1
  }

  update(mouseX: number, mouseY: number) {
    // Calculate distance from mouse
    const dx = mouseX - this.x
    const dy = mouseY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const repelRadius = 150

    // Repel from mouse
    if (distance < repelRadius) {
      const force = (repelRadius - distance) / repelRadius
      const angle = Math.atan2(dy, dx)
      this.vx -= Math.cos(angle) * force * 0.6
      this.vy -= Math.sin(angle) * force * 0.6
    }

    // Return to base position
    const baseDx = this.baseX - this.x
    const baseDy = this.baseY - this.y
    this.vx += baseDx * 0.01
    this.vy += baseDy * 0.01

    // Apply velocity with damping
    this.vx *= 0.95
    this.vy *= 0.95

    // Update position
    this.x += this.vx
    this.y += this.vy
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "rgba(59, 130, 246, 0.6)"
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()

    // Add glow effect
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4)
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.2)")
    gradient.addColorStop(1, "rgba(59, 130, 246, 0)")
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2)
    ctx.fill()
  }
}
