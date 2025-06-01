extends Control

@export var camera_path: NodePath  # Set this to Free Cam in the Inspector

var camera: Camera3D

func _ready():
	camera = get_node(camera_path)  # This grabs the Free Cam

	# Connect button signals
	$RotateLeftButton.pressed.connect(_on_rotate_left)
	$RotateRightButton.pressed.connect(_on_rotate_right)
	$ZoomInButton.pressed.connect(_on_zoom_in)
	$ZoomOutButton.pressed.connect(_on_zoom_out)

func _on_rotate_left():
	camera.rotate_y(deg_to_rad(10))  # Rotate camera left

func _on_rotate_right():
	camera.rotate_y(deg_to_rad(-10))  # Rotate camera right

func _on_zoom_in():
	camera.translate_object_local(Vector3(0, 0, -1))  # Move camera forward

func _on_zoom_out():
	camera.translate_object_local(Vector3(0, 0, 1))  # Move camera backward
