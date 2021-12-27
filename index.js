import { parse } from "./parse.js";
import { evaluate } from "./evaluate.js";
import { display } from "./display.js";
import { run } from "./run.js";

const textarea = document.getElementById("textarea");
const canvas = document.getElementById("canvas");
const error = document.getElementById("error");
const ctx = canvas.getContext('2d');

window.draw = function() {
	const code = textarea.value;

	const show_error = function(x) {
		error.classList.remove('hidden');
		if (x.pos === undefined) {
			error.value = x.err;
			return;
		}

		const end = code.indexOf('\n', (x.end || x.pos).idx);
		const c = code.slice(x.pos.start, end === -1 ? undefined : end);
		error.value = `At ${x.pos.line}:${x.pos.idx + 1 - x.pos.start}: ${x.err}\n`;
		for (const line of c.split('\n')) {
			error.value += `> ${line}\n`;
		}
	};

	error.classList.add('hidden');
	canvas.classList.add('hidden');

	const ast = parse(code);
	if (ast.err !== undefined) {
		show_error(ast);
		return;
	}

	const p = evaluate(ast);
	if (p.err !== undefined) {
		show_error(p);
		return;
	}

	if (p.type !== 'draw') {
		error.classList.remove('hidden');
		error.value = display(p, 0);
		return;
	}

	canvas.classList.remove('hidden');

	const { width, height } = canvas.getBoundingClientRect();
	const size = Math.min(width, height);
	canvas.width = 2 * width;
	canvas.height = 2 * height;

	ctx.resetTransform();
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const turtle = {
		px: 2 * width / 2,
		py: 2 * height / 2,
		dx: 2 * size / 100,
		dy: 0,

		ctx,

		forward: arg => {
			turtle.px += arg * turtle.dx;
			turtle.py += arg * turtle.dy;
			turtle.ctx.lineTo(turtle.px, turtle.py);
		},
		rotate: arg => {
			const c = Math.cos(arg);
			const s = Math.sin(arg);
			const a = turtle.dx;
			const b = turtle.dy;
			turtle.dx = a * c - b * s;
			turtle.dy = b * c + a * s;
		},
	};

	ctx.beginPath();
	ctx.moveTo(turtle.px, turtle.py);
	run(p, turtle);
	ctx.stroke();
};
