export const run = function(arg, turtle) {
	if (arg.val === 'mv') {
		turtle.move(arg.par[0], arg.par[1]);
	}

	if (arg.val === 'tr') {
		turtle.transform(arg.par[0], arg.par[1]);
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
