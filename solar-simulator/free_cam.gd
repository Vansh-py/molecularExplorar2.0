extends Camera3D

var rotation_speed := 0.005
var move_speed := 10.0

func _input(event):
	# Mouse look when right mouse is held
	if event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
		rotate_y(-event.relative.x * rotation_speed)
		rotate_x(-event.relative.y * rotation_speed)

func _process(delta):
	var direction := Vector3.ZERO

	# Movement controls (WASD + QE)
	if Input.is_action_pressed("move_forward"):
		direction -= transform.basis.z
	if Input.is_action_pressed("move_backward"):
		direction += transform.basis.z
	if Input.is_action_pressed("move_left"):
		direction -= transform.basis.x
	if Input.is_action_pressed("move_right"):
		direction += transform.basis.x
	if Input.is_action_pressed("move_up"):
		direction += transform.basis.y
	if Input.is_action_pressed("move_down"):
		direction -= transform.basis.y

	if direction != Vector3.ZERO:
		direction = direction.normalized()
		translate(direction * move_speed * delta)


func _on_move_up_button_pressed() -> void:
	pass # Replace with function body.


func _on_move_down_button_pressed() -> void:
	pass # Replace with function body.


func _on_move_left_button_pressed() -> void:
	pass # Replace with function body.


func _on_move_right_button_pressed() -> void:
	pass # Replace with function body.


func _on_move_forward_button_pressed() -> void:
	pass # Replace with function body.


func _on_move_back_button_pressed() -> void:
	pass # Replace with function body.


func _on_rotate_left_button_pressed() -> void:
	pass # Replace with function body.


func _on_rotate_right_button_pressed() -> void:
	pass # Replace with function body.
