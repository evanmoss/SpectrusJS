/**
 * @Author: Evan Moss
 * @Website: evanmoss.info
 * @Copyright: Copyright 2014-2015. All Rights Reserved. Something something fair use license.  Don't copy and redistribute without attribution.
 * @Git: https://github.com/evanmoss/spectrusjs
 */
var Spectrus = (function(){
	
	/**
	 * Spectrus Finite State Machine Properties
	 */
	var _vector_norm = ['euclidean'];
	// set current vector norm
	function setVectorNorm(norm) {
		if ( norm === 'euclidean' ) {
			Vec.prototype.norm = vec_euclidean_norm;
		}
		else if ( norm === 'manhattan' ) {
			Vec.prototype.norm = vec_manhattan_norm;
		}
		else if ( norm[0] === 'p' ) {
			var p = +norm.substring(1);
			if ( typeof p !== 'number' ) return;
			Vec.prototype.norm = vec_p_norm(p);
		}
		else if ( norm === 'maximum' ) {
			Vec.prototype.norm = vec_maximum_norm;
		}
		else if ( norm === 'minimum' ) {
			Vec.prototype.norm = vec_minimum_norm;
		}
	}
	function popVectorNormState() {
		if ( _vector_norm.length > 1 )
			_vector_norm.pop();
		setVectorNorm(_vector_norm[_vector_norm.length - 1]);
	}
	function pushVectorNormState(norm) {
		if ( norm === 'euclidean' ) {
			_vector_norm.push('euclidean');
			Vec.prototype.norm = vec_euclidean_norm;
		}
		else if ( norm === 'manhattan' ) {
			_vector_norm.push('manhattan');
			Vec.prototype.norm = vec_manhattan_norm;
		}
		else if ( norm[0] === 'p' ) {
			var p = +norm.substring(1);
			if ( typeof p !== 'number' ) return;
			_vector_norm.push('p' + p);
			Vec.prototype.norm = vec_p_norm(p);
		}
		else if ( norm === 'maximum' ) {
			_vector_norm.push('maximum');
			Vec.prototype.norm = vec_maximum_norm;
		}
		else if ( norm === 'minimum' ) {
			_vector_norm.push('minimum');
			Vec.prototype.norm = vec_minimum_norm;
		}
	}
	
	/** Vec default properties */
	var
	/** Default Vec size **/
		DEFAULT_VEC_SIZE = 4,
	/** Default Vec type **/
		DEFAULT_VEC_TYPE = 'Float64Array';
	
	/**
	 * Generic Vector Class
	 * @optional @param type: type of elements
	 * @optional @param size: size of vector
	 * @optional @param arr: Vec to copy, or an array of numbers
	 */
	function Vec(type, size, vec) {
		// @TODO should we coerce to type & size for vec?
		if ( typeof vec === 'object' ) {
			var name = vec.constructor.name;
			// if arr is a Vec class, copy it
			// @TODO fix for miniifcation
			if ( name === 'Vec' ) {
				this._type = vec._buffer.constructor.name;
				this._buffer = new window[this._type](vec._buffer);
			}
			
			else if ( name === 'Array' ) {
				this._type = DEFAULT_VEC_TYPE;
				this._buffer = new window[this._type](vec);
			}
			
		}
		else {
			this._type = type || DEFAULT_VEC_TYPE;
			this._buffer = new window[this._type](size || DEFAULT_VEC_SIZE);
		}
		
		//return this;
	};
	
	Vec.prototype.size = function() {
		return this._buffer.length;
	};
	
	Vec.prototype.type = function() {
		return this._type;
	};
	
	Vec.prototype.getCopy = function() {
		return new Vec(null,null,this);
	};
	
	// returns a copy of _buffer
	Vec.prototype.data = function() {
		return new window[this._type](this._buffer);
	};
	
	/** Euclidean norm */
	function vec_euclidean_norm() {
		var a = 0;
		for ( var i = 0, len = this.size(); i < len; i++ )
			a += this.at(i) * this.at(i);
		return Math.sqrt(a);
	}
	
	/** Manhattan norm */
	function vec_manhattan_norm() {
		var a = 0;
		for ( var i = 0, len = this.size(); i < len; i++ )
			a += Math.abs(this.at(i));
		return a;
	}
	
	/** p-norm */
	function vec_p_norm(p) {
		var p_inv = 1.0 / p;
		return function() {
			var a = 0;
			for ( var i = 0, len = this.size(); i < len; i++ )
				a += Math.pow(Math.abs(this.at(i)), p);
			return Math.pow(a, p_inv);
		}
	}
	
	/** Maximum norm */
	function vec_maximum_norm() {
		if ( this.size() < 1 ) return 0;
		
		var a = Math.abs(this.at(0));
		for ( var i = 1, len = this.size(); i < len; i++ )
			if ( a < Math.abs(this.at(i)) ) a = Math.abs(this.at(i));
		return a;
	}
	
	/** Minimum norm */
	function vec_minimum_norm() {
		if ( this.size() < 1 ) return 0;
		
		var a = Math.abs(this.at(0));
		for ( var i = 1, len = this.size(); i < len; i++ )
			if ( a > Math.abs(this.at(i)) ) a = Math.abs(this.at(i));
		return a;
	}
	
	// default vector norm
	Vec.prototype.norm = vec_euclidean_norm;
	
	/** Access */
	Vec.prototype.x = function(a) {
		if ( a ) this._buffer[0] = a;
		else return this._buffer[0];
	};
	Vec.prototype.y = function(a) {
		if ( a ) this._buffer[1] = a;
		else return this._buffer[1];
	};
	Vec.prototype.z = function(a) {
		if ( a ) this._buffer[2] = a;
		else return this._buffer[2];
	};
	Vec.prototype.w = function(a) {
		if ( a ) this._buffer[3] = a;
		else return this._buffer[3];
	};
	Vec.prototype.set = function(i,a) {
		if ( a ) this._buffer[i] = a;
	};
	Vec.prototype.at = function(i) {
		return this._buffer[i];
	}
	
	/** Normalize */
	Vec.prototype.normalize = function() {
		var x = this.norm();
		for ( var i = 0, len = this.size(); i < len; i++ )
			this._buffer[i] /= x;
	};
	/** Normalize a tiny bit faster at a tiny loss of precision */
	Vec.prototype.normalize_faster = function() {
		var x = 1.0 / this.norm();
		for ( var i = 0, len = this.size(); i < len; i++ )
			this._buffer[i] *= x;	
	};
	
	/** Cross Product */
	Vec.prototype.cross = function(b) {
		// return null on error
		if ( this.size() != 3 || b.size() != 3 ) return null;
		
		var y = new Vec(this._type, 3);
		y.x(this.y() * b.z() - this.z() * b.y());
		y.y(this.z() * b.x() - this.x() * b.z());
		y.z(this.x() * b.y() - this.y() * b.x());
		return y;
	};
	
	/** Dot Product */
	Vec.prototype.dot = function(b) {
		// return null on error
		if ( this.size() != b.size() ) return null;
		
		var a = 0;
		for ( var i = 0, len = this.size(); i < len; i++ )
			a += this.at(i) * b.at(i);
		return a;
	};
	
	/** Scalar Multiply */
	Vec.prototype.scale = function(x) {
		var y = new Vec(this._type, this.size());
		for ( var i = 0, len = this.size(); i < len; i++ )
			y.set(i, this.at(i) * x);
		return y;
	};
	
	/** Scalar Subtract */
	Vec.prototype.subtract = function(x) {
		var y = new Vec(this._type, this.size());
		for ( var i = 0, len = this.size(); i < len; i++ )
			y.set(i, this.at(i) - x);
		return y;
	};
	
	/** Scalar Addition */
	Vec.prototype.add = function(x) {
		var y = new Vec(this._type, this.size());
		for ( var i = 0, len = this.size(); i < len; i++ )
			y.set(i, this.at(i) + x);
		return y;
	};
	
	/** Vector sum */
	Vec.prototype.sum = function(b) {
		// return null on error
		if ( this.size() != b.size() ) return null;
		
		var y = new Vec(this._type, this.size());
		for ( var i = 0, len = this.size(); i < len; i++ )
			y.set(i, this.at(i) + b.at(i));
		return y;
	};
	
	/** Vector difference */
	Vec.prototype.difference = function(b) {
		// return null on error
		if ( this.size() != b.size() ) return null;
		
		var y = new Vec(this._type, this.size());
		for ( var i = 0, len = this.size(); i < len; i++ )
			y.set(i, this.at(i) - b.at(i));
		return y;
	};
	
	/** Vector product */
	Vec.prototype.product = function(b) {
		// return null on error
		if ( this.size() != b.size() ) return null;
		
		var y = new Vec(this._type, this.size());
		for ( var i = 0, len = this.size(); i < len; i++ )
			y.set(i, this.at(i) * b.at(i));
		return y;
	};
	
	/** Vector quotient */
	Vec.prototype.quotient = function(b) {
		// return null on error
		if ( this.size() != b.size() ) return null;
		
		var y = new Vec(this._type, this.size());
		for ( var i = 0, len = this.size(); i < len; i++ )
			y.set(i, this.at(i) / b.at(i));
		return y;
	};
	
	/** Vecotr sum */
	Vec.prototype.sum = function() {
		var a = 0;
		for ( var i = 0, len = this.size(); i < len; i++ )
			a += this.at(i);
		return a;
	};
	
	/** Vector mean */
	Vec.prototype.mean = function() {
		var a = 0;
		for ( var i = 0, len = this.size(); i < len; i++ )
			a += this.at(i);
		return a / this.size();
	};
	
	/** Vector standard deviation */
	Vec.prototype.std = function() {
		var a = 0, mean = this.mean();
		for ( var i = 0, len = this.size(); i < len; i++ ) {
			var x = this.at(i) - mean;
			a += x * x;
		}
		return Math.sqrt(a / this.size());
	};
	
	/** Covariance */
	Vec.prototype.cov = function(b) {
		// return null on error
		if ( this.size() != b.size() ) return null;
		
		var a = 0, a_mean = this.mean(), b_mean = b.mean();
		for ( var i = 0, len = this.size(); i < len; i++ )
			a += (this.at(i) - a_mean) * (b.at(i) - b_mean);
		return a / this.size();
	};
	
	/** Cosine Similarity or Cos(Theta) for vectors A & B */
	Vec.prototype.cosine = function(b) {
		// return null on error
		if ( this.size() != b.size() ) return null;
		
		pushVectorNormState('euclidean');
		var a = this.dot(b) / (this.norm() * b.norm());
		popVectorNormState();
		return a;
	};
	
	/** Pearson Correlation */
	Vec.prototype.cor = function(b) {
		// return null on error
		if ( this.size() != b.size() ) return null;
		
		return this.cov(b) / (this.std() * b.std());
	};
	
	/** Hamming Distance */
	Vec.prototype.hamming = function(b) {
		var error = Math.abs(this.size() - b.size());
		
		var a = 0;
		for ( var i = 0, len = Math.min(this.size(), b.size()); i < len; i++ )
			if ( this.at(i) != b.at(i) ) a++;
		return a + error;
	};
	
	/** Fisher Yates Shuffle */
	Vec.prototype.shuffle = function() {
		var m = this.size(), t, i;
		while (m) {
			 
		    // Pick a remaining element
		    i = Math.floor(Math.random() * m--);
		 
		    // And swap it with the current element.
		    t = this.at(m);
		    this.set(m, this.at(i));
		    this.set(i, t);
		}
	};
	
	/** Zero all elements */
	Vec.prototype.reset = function() {
		for ( var i = 0, len = this.size(); i < len; i++ )
			this.set(i, 0);
	};
	
	/** 
	 * Randomize elements to [0,1]
	 * Obviously will result in all 0 for int vectors
	 */
	Vec.prototype.randomize = function() {
		for ( var i = 0, len = this.size(); i < len; i++ )
			this.set(i, Math.random());
	};
	
	/**
	 * Randomize elements to range [n,m]
	 */
	Vec.prototype.randomizeRange = function(n, m) {
		var min = Math.min(n, m), d = Math.max(n, m) - min;
		for ( var i = 0, len = this.size(); i < len; i++ )
			this.set(i, Math.random() * d + min);
	};
	
	return {
		// Public Vector Constructors
		Vec: function(type, size, vec) { return new Vec(type, size, vec); },
		Vec3d: function() { return new Vec('Float64Array', 3); },
		Vec3f: function() { return new Vec('Float32Array', 3); },
		Vec3i: function() { return new Vec('Int32Array', 3); },
		Vec3u: function() { return new Vec('Uint32Array', 3); },
		Vec4d: function() { return new Vec('Float64Array', 4); },
		Vec4f: function() { return new Vec('Float32Array', 4); },
		Vec4i: function() { return new Vec('Int32Array', 4); },
		Vec4u: function() { return new Vec('Uint32Array', 4); },
		
		// Vector State Functions
		pushVectorNorm: function(norm) { pushVectorNormState(state); },
		popVectorNorm: function() { popVectorNormState(); },
		currentVectorNorm: function() { return _vector_norm; }
		
		// Public Matrix Constructors
	}
}());
