from vpython import *

# Set up the scene
scene.background = color.black
scene.title = "Python Solar System Simulation"
scene.width = 1200
scene.height = 800
scene.forward = vector(0, -1, -2)

# Create the Sun
sun = sphere(pos=vector(0,0,0), radius=5, color=color.yellow, emissive=True)
sun_light = local_light(pos=vector(0,0,0), color=color.white)

# Planet data: name, color, distance from sun, radius, orbital speed
planets_data = [
    ("Mercury", color.gray(0.5), 10, 0.5, 0.04),
    ("Venus", color.orange, 15, 0.6, 0.015),
    ("Earth", color.blue, 20, 0.8, 0.01),
    ("Mars", color.red, 25, 0.6, 0.008),
    ("Jupiter", color.orange, 35, 1.2, 0.004),
    ("Saturn", color.yellow, 45, 1.0, 0.002),
    ("Uranus", color.cyan, 55, 0.9, 0.001),
    ("Neptune", color.blue, 65, 0.9, 0.0005)
]

# Create planets and their orbit paths
planets = []
for name, col, distance, radius, speed in planets_data:
    p = sphere(pos=vector(distance,0,0), radius=radius, color=col, make_trail=True, retain=100)
    p.orbit_radius = distance
    p.orbit_speed = speed
    p.orbit_angle = random()
    p.label = name
    planets.append(p)

# Animation loop
while True:
    rate(60)
    for planet in planets:
        planet.orbit_angle += planet.orbit_speed
        x = cos(planet.orbit_angle) * planet.orbit_radius
        z = sin(planet.orbit_angle) * planet.orbit_radius
        planet.pos = vector(x, 0, z)
