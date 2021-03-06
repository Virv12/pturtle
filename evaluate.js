import { parse } from "./parse.js";

export const unlazy = function(v) {
	const a = evaluate(v.ast, v.env);
	delete v.ast;
	delete v.env;
	for (const k in a) {
		if (a.hasOwnProperty(k)) {
			v[k] = a[k];
		}
	}
	return v;
};

export const evaluate = function(ast, env, lazy=false) {
	env = env || global_env;

	if (ast.type === 'num') {
		return ast;
	}

	if (ast.type === 'id') {
		if (!env.hasOwnProperty(ast.val)) {
			return { err: `'${ast.val}' is not defined`, pos: ast.pos };
		}
		const v = env[ast.val];
		if (v.err) return v;
		if (!lazy && v.type === 'lazy') {
			unlazy(v);
		}
		return v;
	}

	if (ast.type === 'fn') {
		return { type: 'fn', par: ast.par, val: ast.val, env };
	}

	if (lazy) {
		return { type: 'lazy', ast, env };
	}

	if (ast.type === 'bind') {
		const val = evaluate(ast.expr, env, true);
		const env2 = { ...env, [ast.id]: val };
		return evaluate(ast.ast, env2, lazy);
	}

	if (ast.type === 'call') {
		let f = evaluate(ast.a, env);
		if (f.err) return f;
		if (f.type === 'fn') {
			const v = evaluate(ast.b, env, true);
			const env2 = { ...f.env, [f.par]: v };
			return evaluate(f.val, env2, lazy);
		}
		if (f.type === 'fn_num') {
			const v = evaluate(ast.b, env);
			if (v.err) return v;
			if (v.type !== 'num') {
				return { err: `parameter must be a number`, pos: ast.b.pos };
			}
			const par = f.par.concat([v.val]);
			if (par.length === f.val.length) {
				const x = f.val(...par);
				if (typeof x === 'number') {
					return { type: 'num', val: f.val(...par) };
				} else {
					return x;
				}
			} else {
				return { type: f.type, name: f.name, par, val: f.val };
			}
		}
		if (f.type === 'draw') {
			if (f.val !== 'chain') {
				return { err: `cannot call a drawing object`, pos: ast.a.pos, end: ast.b.pos };
			}

			const v = evaluate(ast.b, env, true);
			if (v.err) return v;
			if (v.type !== 'lazy' && v.type !== 'draw') {
				return { err: `parameter must be a drawble`, pos: ast.b.pos };
			}
			return { type: 'draw', val: 'chain', par: f.par.concat([v]) };
		}
		if (f.type === 'num') {
			return { err: `cannot call a number`, pos: ast.a.pos, end: ast.b.pos };
		}
		console.error('unknown function type', f);
	}
};

const True = evaluate(parse('\\a.\\b.a'), {});
const False = evaluate(parse('\\a.\\b.b'), {});

const global_env = {
	'true': True,
	'false': False,

	'Y': evaluate(parse('\\f.(\\x.x x)(\\x.f(x x))'), {}),

	'chain': { type: 'draw', val: 'chain', par: [] },
	'penup': { type: 'draw', val: 'penup', par: [] },
	'pendw': { type: 'draw', val: 'pendw', par: [] },
};

const make_fn_num = function(name, val) {
	global_env[name] = { type: 'fn_num', par: [], name, val };
};

make_fn_num('+', (a, b) => a + b);
make_fn_num('-', (a, b) => a - b);
make_fn_num('*', (a, b) => a * b);
make_fn_num('/', (a, b) => a / b);
make_fn_num('quot', (a, b) => Math.trunc(a / b));
make_fn_num('rem', (a, b) => a % b);
make_fn_num('neg', a => -a);
make_fn_num('cos', a => Math.cos(a));
make_fn_num('sin', a => Math.sin(a));
make_fn_num('degToRad', a => a * Math.PI / 180);
make_fn_num('eq', (a, b) => a === b ? True : False);
make_fn_num('mv', (a, b) => { return { type: 'draw', val: 'mv', par: [a, b] } });
make_fn_num('tr', (a, b) => { return { type: 'draw', val: 'tr', par: [a, b] } });
make_fn_num('sleep', ms => { return { type: 'draw', val: 'sleep', par: [ms] } });
make_fn_num('nf', ms => { return { type: 'draw', val: 'nf', par: [ms] } });

global_env['fd'] = evaluate(parse('\\t.mv t 0'), global_env);
global_env['rt'] = evaluate(parse('\\t.tr (cos t) (sin t)'), global_env);
