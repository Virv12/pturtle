import { unlazy } from './evaluate.js';

const run_impl = function(list, frame, turtle, gen, error_handler) {
	if (gen !== turtle.gen)
		return;

	if (frame) {
		turtle.reset();
	}

	turtle.begin();

	while (list.length > 0) {
		const arg = list.pop();

		if (arg.type === 'lazy') {
			unlazy(arg);
		}

		if (arg.err) {
			error_handler(arg);
			return;
		}

		if (arg.type !== 'draw') {
			error_handler({ err: `parameter must be a drawable` });
			return;
		}

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
			for (let i = arg.par.length; i--; ){
				list.push(arg.par[i]);
			}
		}

		if (arg.val === 'nf') {
			setTimeout(() => run_impl(list, true, turtle, gen, error_handler), arg.par[0]);
			break;
		}

		if (arg.val === 'sleep') {
			setTimeout(() => run_impl(list, false, turtle, gen, error_handler), arg.par[0]);
			break;
		}
	}

	turtle.stroke();
};

export const run = function(arg, turtle, error_handler) {
	const list = [arg];
	setTimeout(() => run_impl(list, true, turtle, turtle.gen, error_handler), 0);
};
