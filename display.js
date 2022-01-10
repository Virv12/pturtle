
const remove = function(env, id) {
	const ret = {};
	for (const k in env) {
		if (env.hasOwnProperty(k) && k !== id) {
			ret[k] = env[k];
		}
	}
	return ret;
};

export const display_ast = function(ast, env, p) {
	if (ast.type === 'num') {
		return ast.val.toString();
	}

	if (ast.type === 'id') {
		if (env.hasOwnProperty(ast.val)) {
			return display(env[ast.val], p);
		} else {
			return ast.val;
		}
	}

	if (ast.type === 'bind') {
		const val = { type: 'lazy', ast: ast.expr, env };
		const env2 = { ...env, [ast.id]: val };
		return display_ast(ast.ast, env2, p);
	}

	if (ast.type === 'fn') {
		const s = `\\${ast.par}.${display_ast(ast.val, remove(env, ast.par), 0)}`;
		return p > 0 ? `(${s})` : s;
	}

	if (ast.type === 'call') {
		const s = `${display_ast(ast.a, env, 1)} ${display_ast(ast.b, env, 2)}`;
		return p > 1 ? `(${s})` : s;
	}
};

export const display = function(arg, p) {
	if (arg.type === 'num') {
		return arg.val.toString();
	}

	if (arg.type === 'fn') {
		const s = `\\${arg.par}.${display_ast(arg.val, remove(arg.env, arg.par), 0)}`;
		return p > 0 ? `(${s})` : s;
	}

	if (arg.type === 'fn_num') {
		if (arg.par.length === 0) return arg.name;
		const s = `${arg.name} ${arg.par.join(' ')}`;
		return p > 1 ? `(${s})` : s;
	}

	if (arg.type === 'lazy') {
		return display_ast(arg.ast, arg.env, p);
	}

	if (arg.type === 'draw') {
		const s = `${arg.val} ${arg.par}`;
		return p > 0 ? `(${s})` : s;
	}
};
