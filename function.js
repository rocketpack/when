/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * @author brian@hovercraftstudios.com
 */

(function(define) {
define(['./when', './nextTick'], function(when, nextTick) {

	var slice;

	slice = Array.prototype.slice;

	return {
		apply: apply,
		call: call,
		bind: bind,
		compose: compose,
		promisify: promisify
	};

	function apply(func, context, args) {
		var d = when.defer();

		nextTick(function() {
			try {
				d.resolve(func.apply(context, args));
			} catch(e) {
				d.reject(e);
			}
		});

		return d.promise;
	}

	function call(func, context /*, args... */) {
		return apply(func, context, slice.call(arguments, 2));
	}

	function bind(func, context /*, args... */) {
		var args = slice.call(arguments, 2);
		return function() {
			return apply(func, context, args.concat(slice.call(arguments)));
		};
	}

	function compose(f /*g, ... */) {
		var funcs = slice.call(arguments, 1);

		return function() {
			var args = slice.call(arguments);

			return when.reduce(funcs, function(arg, func) {
				return func(arg);
			}, f.apply(null, args));
		};
	}

	function promisify(func, callbackPos, errbackPos, progbackPos) {
		var orig, initArgs;

		orig = func;

		// If you only supply the function, assume callback and errback
		// will always be the last two params.
		// If you supply positions, use them to inject callback/errback/progback
		// into the args.
		if(arguments.length === 1) {
			initArgs = function(args, deferred) {
				args.push(deferred.resolve);
				args.push(deferred.reject);

				return args;
			};
		} else {
			initArgs = function(args, deferred) {
				if(typeof callbackPos == 'number') {
					args.splice(callbackPos, 0, deferred.resolve);
				}

				if(typeof errbackPos == 'number') {
					args.splice(errbackPos, 0, deferred.reject);
				}

				if(typeof progbackPos == 'number') {
					args.splice(progbackPos, 0, deferred.progress);
				}

				return args;
			};
		}

		return function() {
			var args, d;

			args = slice.call(arguments);
			d = when.defer();

			apply(orig, this, initArgs(args, d));

			return d.promise;
		};
	}
});

})(typeof define == 'function'
	? define
	: function (deps, factory) { typeof module != 'undefined'
	? (module.exports = factory(require('./when'), require('./nextTick')))
	: (this.when_fn = factory(this.when, this.when_nextTick));
}
	// Boilerplate for AMD, Node, and browser global
);

