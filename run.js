export const run = function(arg, turtle) {
	if (arg.val === 'fd') {
		turtle.forward(arg.par);
	}

	if (arg.val === 'rt') {
		turtle.rotate(arg.par);
	}

	if (arg.val === 'penup') {
		turtle.draw_off();
	}

	if (arg.val === 'pendw') {
		turtle.draw_on();
	}

	if (arg.val === 'chain') {
		for (const e of arg.par) {
			run(e, turtle);
		}
	}
};
