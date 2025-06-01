from manim import *

class SineWave(Scene):
    def construct(self):
        axes = Axes(
            x_range=[0, 2*PI, PI/2],
            y_range=[-1.5, 1.5, 0.5],
            axis_config={"include_numbers": True},
        )

        sine_graph = axes.plot(lambda x: np.sin(x), color=BLUE)
        sine_label = axes.get_graph_label(sine_graph, label='\\sin(x)')

        self.play(Create(axes), run_time=2)
        self.play(Create(sine_graph), Write(sine_label))
        self.wait(1)
