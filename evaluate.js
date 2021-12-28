import { parse } from "./parse.js";

export const evaluate = function(ast, env) {
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
		if (v.type === 'lazy') {
			const a = evaluate(v.ast, v.env);
			delete v.ast;
			delete v.env;
			for (const k in a) {
				if (a.hasOwnProperty(k)) {
					v[k] = a[k];
				}
			}
		}
		return v;
	}

	if (ast.type === 'call') {
		let f = evaluate(ast.a, env);
		if (f.err) return f;
		if (f.type === 'fn') {
			const v = { type: 'lazy', ast: ast.b, env };
			const env2 = { ...f.env, [f.par]: v };
			return evaluate(f.val, env2);
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

			const v = evaluate(ast.b, env);
			if (v.err) return v;
			if (v.type !== 'draw') {
				return { err: `parameter must be a drawble`, pos: ast.b.pos };
			}
			return { type: 'draw', val: 'chain', par: f.par.concat([v]) };
		}
		if (f.type === 'num') {
			return { err: `cannot call a number`, pos: ast.a.pos, end: ast.b.pos };
		}
		console.error('unknown function type', f);
	}

	if (ast.type === 'fn') {
		return { type: 'fn', par: ast.par, val: ast.val, env };
	}
};

const True = evaluate(parse('\\a.\\b.a'), {});
const False = evaluate(parse('\\a.\\b.b'), {});

const global_env = {
	'true': True,
	'false': False,

	'pair': evaluate(parse('\\a.\\b.\\f.f a b'), {}),
	'first': True,
	'second': False,

	'nil': evaluate(parse('\\f.\\g.f'), {}),
	'cons': evaluate(parse('\\x.\\l.\\f.\\g.g x l'), {}),

	'none': evaluate(parse('\\f.\\g.f'), {}),
	'some': evaluate(parse('\\x.\\f.\\g.g x'), {}),

	'Y': evaluate(parse('\\f.(\\x.x x)(\\x.f(x x))'), {}),

	'chain': { type: 'draw', val: 'chain', par: [] },
};

const make_fn_num = function(name, val) {
	global_env[name] = { type: 'fn_num', par: [], name, val };
};

make_fn_num('add', (a, b) => a + b);
make_fn_num('sub', (a, b) => a - b);
make_fn_num('mul', (a, b) => a * b);
make_fn_num('div', (a, b) => a / b);
make_fn_num('neg', a => -a);
make_fn_num('degToRad', a => a * Math.PI / 180);
make_fn_num('eq', (a, b) => a === b ? True : False);
make_fn_num('fd', par => { return { type: 'draw', val: 'fd', par } });
make_fn_num('rt', par => { return { type: 'draw', val: 'rt', par } });
