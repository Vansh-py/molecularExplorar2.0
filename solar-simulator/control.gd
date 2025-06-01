extends Control


@onready var camera = get_tree().get_root().get_node("Solar-System/Free Cam")

var move_amount := 0.5
var rotate_amount := deg_to_rad(10)

func _on_move_up_button_pressed():
	camera.translate(Vector3.UP * move_amount)

func _on_move_down_button_pressed():
	camera.translate(Vector3.DOWN * move_amount)

func _on_move_left_button_pressed():
	camera.translate(-camera.transform.basis.x * move_amount)

func _on_move_right_button_pressed():
	camera.translate(camera.transform.basis.x * move_amount)

func _on_move_forward_button_pressed():
	camera.translate(-camera.transform.basis.z * move_amount)

func _on_move_back_button_pressed():
	camera.translate(camera.transform.basis.z * move_amount)

func _on_rotate_left_button_pressed():
	camera.rotate_y(-rotate_amount)

func _on_rotate_right_button_pressed():
	camera.rotate_y(rotate_amount)
