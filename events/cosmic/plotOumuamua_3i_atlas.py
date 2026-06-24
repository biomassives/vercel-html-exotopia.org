import numpy as np
import matplotlib.pyplot as plt

# Initialize the canvas
fig, ax = plt.subplots(figsize=(10, 10), dpi=150)

# 1. Define Orbital Key Parameters (Perihelion 'q', Eccentricity 'e')
q_1I, e_1I = 0.255, 1.20   # 'Oumuamua
q_3I, e_3I = 1.37, 6.14    # 3I/ATLAS

# 2. Compute angular bounds (Hyperbolas break down if cos(theta) <= -1/e)
t_max_1I = np.arccos(-1 / e_1I) - 0.15
t_max_3I = np.arccos(-1 / e_3I) - 0.05

theta_1I = np.linspace(-t_max_1I, t_max_1I, 1000)
theta_3I = np.linspace(-t_max_3I, t_max_3I, 1000)

# Polar equation for a conic section: r = q*(1+e) / (1 + e*cos(theta))
r_1I = (q_1I * (1 + e_1I)) / (1 + e_1I * np.cos(theta_1I))
r_3I = (q_3I * (1 + e_3I)) / (1 + e_3I * np.cos(theta_3I))

# 3. Rotate trajectories for a dynamic 2D view layout
omega_1I = np.radians(35)
omega_3I = np.radians(-50)

x_1I = r_1I * np.cos(theta_1I + omega_1I)
y_1I = r_1I * np.sin(theta_1I + omega_1I)
x_3I = r_3I * np.cos(theta_3I + omega_3I)
y_3I = r_3I * np.sin(theta_3I + omega_3I)

# 4. Plot Reference Objects (Sun & Earth's Orbit)
ax.plot(0, 0, 'wo', markersize=14, markeredgecolor='orange', markeredgewidth=2, label='Sun')
theta_orbit = np.linspace(0, 2 * np.pi, 200)
ax.plot(np.cos(theta_orbit), np.sin(theta_orbit), '--', color='#4A90E2', alpha=0.5, label="Earth's Orbit (1 AU)")

# 5. Plot Hyperbolic Tracks
ax.plot(x_1I, y_1I, color='#FF5733', linewidth=2.5, label="1I/'Oumuamua ($e \\approx 1.20$)")
ax.plot(x_3I, y_3I, color='#9B59B6', linewidth=2.5, label="3I/ATLAS ($e \\approx 6.14$)")

# 6. Mark and Annotate Perihelion Intersects
xp1, yp1 = q_1I * np.cos(omega_1I), q_1I * np.sin(omega_1I)
xp3, yp3 = q_3I * np.cos(omega_3I), q_3I * np.sin(omega_3I)
ax.scatter([xp1, xp3], [yp1, yp3], color='black', zorder=5, s=50)

ax.annotate('\'Oumuamua Perihelion\n(0.25 AU)', (xp1, yp1), textcoords="offset points", 
            xytext=(60,20), ha='center', fontsize=9, arrowprops=dict(arrowstyle="->", color='#D35400'))
ax.annotate('3I/ATLAS Perihelion\n(1.37 AU)', (xp3, yp3), textcoords="offset points", 
            xytext=(-60,-30), ha='center', fontsize=9, arrowprops=dict(arrowstyle="->", color='#8E44AD'))

# Graph Polish
ax.set_title('Visualizing Hyperbolic Calibration Paths', fontsize=14, fontweight='bold', pad=15)
ax.set_xlabel('X Coordinate (AU)', fontsize=11)
ax.set_ylabel('Y Coordinate (AU)', fontsize=11)
ax.set_xlim(-6, 6)
ax.set_ylim(-6, 6)
ax.set_aspect('equal', 'box')
ax.grid(True, linestyle=':', alpha=0.5)
ax.legend(loc='upper right', frameon=True, facecolor='#ffffff')

plt.tight_layout()
plt.show()
