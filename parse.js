export const parse = function(str) {
	let idx = 0;
	let line = 1;
	let start = 0;

	const spaces = function() {
		while (/\s/.test(str[idx])) {
			if (str[idx] === '\n') {
				line += 1;
				start = idx + 1;
			}
			idx += 1;
		}
	};

	const parse_token = function() {
		const pos = { line, idx, start };

		const num = /^[+-]?(([1-9]\d*|0)(\.\d*)?|\.\d+)(?!\w)/.exec(str.substr(idx));
		if (num !== null) {
			idx += num[0].length;
			spaces();
			return { pos, type: 'num', val: eval(num[0]) };
		}

		const zero_num = /^[+-]?(\d+(\.\d*)?|\.\d+)(?!\w)/.exec(str.substr(idx));
		if (zero_num !== null) {
			return { err: `can't parse token`, pos };
		}

		const m = /^[-+*/'\w]+/.exec(str.substr(idx));
		if (m !== null) {
			idx += m[0].length;
			spaces();
			return { pos, type: 'id', val: m[0] };
		}

		return { err: `can't parse token`, pos };
	};

	const parse_atom = function() {
		if (str[idx] === '(') {
			idx += 1;
			spaces();
			const r = parse_expr();
			if (r.err) return r;
			if (str[idx] === ')') {
				idx += 1;
				spaces();
				return r;
			}
			return { err: `expected ')'`, pos: { line, idx, start } };
		}

		return parse_token();
	};

	const parse_call = function() {
		const pos = { line, idx, start };
		let v = parse_atom();
		if (v.err) return v;
		while (idx < str.length && str[idx] !== ')' && str[idx] !== ';') {
			const u = parse_atom();
			if (u.err) return u;
			v = { pos, type: 'call', a: v, b : u };
		}
		return v;
	};

	const parse_expr = function() {
		const pos = { line, idx, start };
		if (str[idx] === '\\') {
			++idx;
			spaces();
			const pos2 = { line, idx, start };
			const par = parse_token();
			if (par.err) return par;
			if (par.type !== 'id') return { err: `expected identifier`, pos: pos2 };
			if (str[idx] !== '.') return { err: `expected '.'`, pos: { line, idx, start } };
			++idx;
			spaces();
			const val = parse_expr();
			if (val.err) return val;
			return { pos, type: 'fn', par: par.val, val };
		} else {
			const pos = { idx, line, start };
			const id = parse_token();
			if (id.err || id.type !== 'id' || str.substr(idx, 2) !== ':=') {
				idx = pos.idx;
				line = pos.line;
				start = pos.start;
				return parse_call();
			}
			idx += 2;
			spaces();
			const expr = parse_expr();
			if (expr.err) return expr;
			if (str[idx] !== ';') return { err: `expected ';'`, pos: { line, idx, start } };
			idx += 1;
			spaces();
			const ast = parse_expr();
			if (ast.err) return ast;
			return { pos, type: 'bind', id: id.val, expr, ast };
		}
	};

	spaces();
	const r = parse_expr();
	if (r.err) return r;
	if (idx !== str.length) {
		return { pos: { line, idx, start }, err: 'syntax error' };
	}
	return r;
};
