extends Node3D

@export var semi_major_axis : float = 50.0
@export var eccentricity     : float = 0.009
@export var orbit_speed      : float = 0.14   # radians per second
@export var orbit_offset     : float = 	3.5   # starting angle (radians)

var angle : float = 0.0
var planet : Node3D

func _ready():
	# Auto-find child planet (assumes there's only one child and it's the planet)
	for child in get_children():
		if child is Node3D:
			planet = child
			break

	if planet == null:
		push_error("No planet (Node3D) child found under " + name)
		return

	# Start at initial position
	angle = orbit_offset
	_update_position()

func _process(delta: float) -> void:
	angle += delta * orbit_speed
	_update_position()

func _update_position():
	var b = semi_major_axis * sqrt(1.0 - pow(eccentricity, 2))
	var x = semi_major_axis * cos(angle)
	var z = b * sin(angle)
	planet.position = Vector3(x, 0, z)
