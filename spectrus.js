/**
 * @Author: Evan Moss
 * @Website: evanmoss.info
 * @Copyright: Copyright 2014-2015. All Rights Reserved. Something something fair use license.  Don't copy and redistribute without attribution.
 * @Git: https://github.com/evanmoss/spectrusjs
 */
module.exports = function() {
	
	/**
	 * swap function
	 */
	function swap(a, b) {
		var tmp = a;
		a = b;
		b = tmp;
	}

	// returns -1 or 1 for sign of number or 0 for 0
	function sign(x) {
		return (x > 0) | -(x < 0);
	}	
	
	/**
	 * round function
	 * from http://phpjs.org/functions/round/
	 */
	function round(value, precision, mode) {
		var m, f, isHalf, sgn; // helper variables
		// making sure precision is integer
		precision |= 0;
		m = Math.pow(10, precision);
		value *= m;
		// sign of the number
		sgn = sign(value);
		isHalf = value % 1 === 0.5 * sgn;
		f = Math.floor(value);

		if (isHalf) {
			switch (mode) {
		    	case 'ROUND_HALF_DOWN':
		    		// rounds .5 toward zero
		    		value = f + (sgn < 0);
		    		break;
		    	case 'ROUND_HALF_EVEN':
		    		// rouds .5 towards the next even integer
		    		value = f + (f % 2 * sgn);
		    		break;
		    	case 'ROUND_HALF_ODD':
		     	 // rounds .5 towards the next odd integer
		    		value = f + !(f % 2);
		    		break;
		    	default:
		    		// rounds .5 away from zero
		    		value = f + (sgn > 0);
			}
		}
		
		return (isHalf ? value : Math.round(value)) / m;
	}
	
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
	
	/** Vec/Mat default properties */
	var
	/** Default Vec size **/
		DEFAULT_SIZE = 4,
	/** Default Vec type **/
		DEFAULT_TYPE = 'Float64Array';
	
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
				this._type = type || vec._buffer.constructor.name;
				if ( global )
					this._buffer = new global[this._type](vec._buffer);
				else
					this._buffer = new window[this._type](vec._buffer);
			}
			
			else if ( name.substring(name.length - 5) === 'Array' ) {
				this._type = type || DEFAULT_TYPE;
				if ( global )
					this._buffer = new global[this._type](vec);
				else
					this._buffer = new window[this._type](vec);
			}
		}
		else {
			this._type = type || DEFAULT_TYPE;
			if ( global )
				this._buffer = new global[this._type](size || DEFAULT_SIZE);
			else
				this._buffer = new window[this._type](size || DEFAULT_SIZE);
		}
	};
	
	Vec.prototype.size = function() {
		return this._buffer.length;
	};
	
	Vec.prototype.type = function() {
		return this._type;
	};
	
	Vec.prototype.getCopy = function(type) {
		return new Vec(type,null,this);
	};
	
	/**
	 * debug function prints buffer object to console
	 */
	Vec.prototype.print = function() {
		console.log(this._buffer);
	};
	
	// returns a copy of _buffer
	Vec.prototype.data = function() {
		if ( global ) 
			return new global[this._type](this._buffer);
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
		if ( a != null ) this._buffer[0] = a;
		else return this._buffer[0];
	};
	Vec.prototype.y = function(a) {
		if ( a != null ) this._buffer[1] = a;
		else return this._buffer[1];
	};
	Vec.prototype.z = function(a) {
		if ( a != null ) this._buffer[2] = a;
		else return this._buffer[2];
	};
	Vec.prototype.w = function(a) {
		if ( a != null ) this._buffer[3] = a;
		else return this._buffer[3];
	};
	Vec.prototype.set = function(i,a) {
		this._buffer[i] = a;
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
	
	/** Scalar Divide */
	Vec.prototype.divide = function(x) {
		var y = new Vec(this._type, this.size());
		for ( var i = 0, len = this.size(); i < len; i++ )
			y.set(i, this.at(i) / x);
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
	Vec.prototype.sumWith = function(b) {
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
	
	/** Vector variance */
	Vec.prototype.var = function(biased) {
		var a = 0, mean = this.mean();
		for ( var i = 0, len = this.size(); i < len; i++ ) {
			var x = this.at(i) - mean;
			a += x * x;
		}
		
		var x = biased ? this.size() : this.size() - 1;
		
		return a / x;
	};
	
	/** Vector standard deviation */
	Vec.prototype.std = function() {
		return Math.sqrt(this.var());
	};
	
	/** Log Transform */
	Vec.prototype.logTransform = function() {
		for ( var i = 0, len = this.size(); i < len; i++ ) {
			this.set(i, Math.log(this.at(i)));
		}	
	};
	
	/** Hyperbolic Sine Transform */
	Vec.prototype.hyperbolicSineTransform = function(theta) {
		for ( var i = 0, len = this.size(); i < len; i++ ) {
			this.set(i, Math.asinh(this.at(i) * theta) / theta);
		}	
	};
	
	/** Box-Cox Transform */
	Vec.prototype.boxCoxTransform = function(lambda) {
		for ( var i = 0, len = this.size(); i < len; i++ ) {
			this.set(i, (Math.pow(this.at(i), lambda) - 1 )/ lambda);
		}	
	};
	
	/** UNFINISHED ###################################################################################################################
	 * Vector Median using binmedian #################################################################################################
	 * http://www.stat.cmu.edu/~ryantibs/papers/median.pdf ###########################################################################
	 * B is number of bins to use, which interacts with the data's distribution to affect speed ######################################
	 * @TODO add quickselect option smaller vectors (<10e5?) for large stds, or single use... (see paper for binmedian's weaknesses) #
	 * @TODO Finish, fix, etc... #####################################################################################################
	 */
	Vec.prototype.median = function(B) {
		
		var n = this.size();
		
		// corner cases
		if ( n == 0 ) return 0;
		else if ( n == 1 ) return this._buffer[0];
		else if ( n == 2 ) return (this._buffer[0] + this._buffer[1]) / 2;
		
		var mean = this.mean(), std = this.std();
		
		// paper uses B = n/10e4, but let's use 10e2 for now
		if ( !B ) B = Math.ceil(n/10e2);
		if ( n < 20 || B > n )
			B = n;
		
		// form bins
		var bins = [];
		for ( var i = 0; i < B; i++ )
			bins[i] = [];
		
		var count = 0, a = mean - std, b = mean + std, range = b - a, binSize = range / B;
		
		// insert into bins
		for ( var i = 0; i < n; i++ ) {
			var x = this._buffer[i];
			
			if ( x < a ) {
				count++;
				continue;
			}
			else if ( x > b ) continue;
			
			var y = Math.floor((x-a) / binSize);
			//console.log("putting into bin " + y + " of " + B);
			bins[y].push(x);
		}
		
		var lim, curBin = -1;
		
		// if odd # elements
		//if ( this.size() & 1 ) {
			lim = (n + 1) / 2;

			//console.log(bins[curBin]);
			
			while ( count < lim ) {
				count += bins[++curBin].length;
			}
			
			var V = new Vec(this._type, bins[curBin].length, bins[curBin]);
			return V.median();
		//}
		//else {
		//	lim = n / 2;
		//}
	};
	
	/** Covariance */
	Vec.prototype.cov = function(b, biased) {
		// return null on error
		if ( this.size() != b.size() ) return null;
		
		var a = 0, a_mean = this.mean(), b_mean = b.mean();
		for ( var i = 0, len = this.size(); i < len; i++ )
			a += (this.at(i) - a_mean) * (b.at(i) - b_mean);
		
		var x = biased ? this.size() : this.size() - 1;
		
		return a / x;
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
	
	/**
	 * Shuffles two vectors together
	 */
	Vec.prototype.shuffleWith = function(b) {
		// map indices
		var aSize = this.size(), bSize = b.size(), t, i, ielt, m = aSize + bSize;
		
		while (m) {
			
			// pick a remaining element
			i = Math.floor(Math.random() * m-- );
			ielt = i < aSize ? this.at(i) : b.at(i - aSize);
			
			// and swap it with the current element
			t = m < aSize ? this.at(m) : b.at(m - aSize);
			if ( m < aSize ) this.set(m, ielt);
			else b.set(m - aSize, ielt);
			if ( i < aSize ) this.set(i, t);
			else b.set(i - aSize, t);
		}
	};
	
	/** Zero all elements */
	Vec.prototype.reset = function() {
		for ( var i = 0, len = this.size(); i < len; i++ )
			this.set(i, 0);
	};
	
	/** Set all elements to a */
	Vec.prototype.fill = function(a) {
		for ( var i = 0, len = this.size(); i < len; i++ )
			this.set(i, a);
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
		if ( !n ) n = 0;
		if ( !m ) m = 1;
		var min = Math.min(n, m), d = Math.max(n, m) - min;
		for ( var i = 0, len = this.size(); i < len; i++ )
			this.set(i, Math.random() * d + min);
	};
	
	/**
	 * Equivalance check
	 */
	Vec.prototype.isEquivalent = function(a) {
		if ( this.size() != a.size() ) return false;
		for ( var i = 0, len = this.size(); i < len; i++ )
			if ( this.at(i) != a.at(i) ) return false;
		return true;
	};
	
	/**
	 * Equality check
	 */
	Vec.prototype.isEqual = function(a) {
		if ( this.size() != a.size() ) return false;
		if ( this._type != a._type ) return false;
		for ( var i = 0, len = this.size(); i < len; i++ )
			if ( this.at(i) != a.at(i) ) return false;
		return true;
	};
	
	/**
	 * Cleans up vector
	 * i.e., rounds all entries to d digits
	 * and uses mode m (see round())
	 */
	Vec.prototype.cleanup = function(d, mode) {
		for ( var i = 0; i < this.size(); i++ )
			this._buffer[i] = round(this._buffer[i], d, mode);
	};
	
	/**
	 * Creates a new cleaned up vector
	 */
	Vec.prototype.getClean = function(d, mode) {
		var V = this.getCopy();
		V.cleanup(d, mode);
		return V;
	};
	
	/**
	 * Samples this vector and returns a new one of size n
	 */
	Vec.prototype.sample = function(n) {
		if ( n > this.size() ) n = this.size();
		var v = new Vec(this.type(), n), v2 = this.getCopy();

		// instead of shuffling the entire array
		// let's just shuffle the n elements
		var m = this.size(), a = m - n;
		while ( m - a ) {
			// Pick a remaining element
			var i = Math.floor(Math.random() * m--);
		 
			// And swap it with the current element.
			t = v2.at(m);
			v2.set(m, v2.at(i));
			v2.set(i, t);
		}
		
		var idx = 0;
		for ( var i = this.size() - 1, len = this.size() - n; i >= len; i-- ) v.set(idx++, v2.at(i));
		return v;
	};
	
	/**
	 * Samples (with replacement) this vector and returns a new one of size n
	 */
	Vec.prototype.resample = function(n) {
		if ( n > this.size() ) n = this.size();
		var v = new Vec(this.type(), n), m = this.size();
		for ( var i = 0; i < n; i++ ) {
			var j = Math.floor(Math.random() * m);
			v.set(i, this.at(j));
		}
		return v;
	};
	
	/** 
	 * Some Math Functions
	 */
	
	/**
	 * Factorial
	 * returns n! for n > -1, or 1
	 */
	var factorial_map = [];
	function factorial(n) {
		if ( n < 2 ) return 1;
		if ( factorial_map[n] ) return factorial_map[n];
		return factorial_map[n] = factorial(n - 1) * n;
	}
	
	/**
	 * Choose
	 * returns n choose k for 0 <= k <= n
	 */
	var choose_map = [];
	function choose(n, k) {
		if ( k > n ) return 0;
		if ( n < 0 ) return 0;
		if ( !choose_map[n] ) choose_map[n] = [];
		if ( choose_map[n][k] ) return choose_map[n][k];
		return choose_map[n][k] = factorial(n) / (factorial(k) * factorial(n - k));
	}
	
	/**
	 * Convert degrees to rads
	 */
	function degToRad(x) {
		return Math.PI * (x / 180);
	}
	
	/**
	 * Convert rads to degrees
	 */
	function radToDeg(x) {
		return 180 * (x / Math.PI);
	}
	
	/**
	 * Matrix Class
	 */
	function Mat(type, rows, cols, mat) {
		
		if ( typeof mat === "object" ) {
			var name = mat.constructor.name;
			// if arr is a Mat class, copy it
			// @TODO fix for miniifcation
			if ( name === 'Mat' ) {
				this._type = type || mat._type;
				this._rows = mat._rows;
				this._cols = mat._cols;
				this._buffer = mat._buffer.getCopy();
				return;
			}
			else {
				if ( rows && cols ) {
					this._rows = rows;
					this._cols = cols;
				}
				else {
					this._rows = mat.size();
					this._cols = 1;
				}
				if ( name === 'Vec' ) {
					this._type = type || mat._type;
					this._buffer = mat.getCopy();
				}
				else if ( name.substring(name.length - 5) === 'Array' ) {
					this._type = type || DEFAULT_TYPE;
					this._buffer = new Vec(this._type, null, mat);
				}
				return;
			}
		}
		else {
			this._type = type || DEFAULT_TYPE;
			this._rows = rows;
			this._cols = cols;
		}

		this._buffer = new Vec(this._type, this._rows * this._cols);
	}
	
	Mat.prototype.rows = function() {
		return this._rows;
	};
	
	Mat.prototype.cols = function() {
		return this._cols;
	};
	
	Mat.prototype.getCopy = function(type) {
		return new Mat(type, null, null, this);
	};
	
	Mat.prototype.data = function() {
		return this._buffer;
	};
	
	Mat.prototype.type = function() {
		return this._type;
	};
	
	/** Debug function prints mat to console (Column-major) **/
	Mat.prototype.print = function() {
		for ( var i = 0; i < this._cols; i++ ) {
			var str = "";
			for ( var j = 0; j < this._rows; j++ ) {
				str += "\t";
				str += this._type[0] == 'F' ? this.at(i,j).toFixed(20) : this.at(i,j); 
			}
			console.log(str);
		}		
	};
	
	/** Debug function prints mat to console (Row-major) **/
	Mat.prototype.print_r = function() {
		for ( var i = 0; i < this._rows; i++ ) {
			var str = "";
			for ( var j = 0; j < this._cols; j++ ) {
				str += "\t";
				str += this._type[0] == 'F' ? this.at(j,i).toFixed(20) : this.at(j,i); 
			}
			console.log(str);
		}	
	};
	
	/** Access (Column-major) **/
	Mat.prototype.at = function(i, j) {
		return this._buffer.at(i * this._rows + j);
	};
	/** Setter (Column-major) **/
	Mat.prototype.set = function(i, j, a) {
		this._buffer.set(i * this._rows + j, a);
	};
	
	/** Access (Row-major) **/
	Mat.prototype.at_r = function(i, j) {
		return this._buffer.at(j * this._rows + i);
	};
	/** Setter (Column-major) **/
	Mat.prototype.set_r = function(i, j, a) {
		this._buffer.set(j * this._rows + i, a);
	};
	
	/**
	 * Transpose
	 */
	Mat.prototype.transpose = function() {
		var M = new Mat(this._type, this._cols, this._rows);
		for ( var i = 0; i < this._rows; i++ )
			for ( var j = 0; j < this._cols; j++ )
				M.set(i, j, this.at(j, i));
		return M;
	};
	
	/** Fisher Yates Shuffle */
	Mat.prototype.shuffle = function() {
		this._buffer.shuffle();
	};
	
	/** Zero all elements */
	Mat.prototype.reset = function() {
		this._buffer.reset();
	};
	
	/** Set all elements to a */
	Mat.prototype.fill = function(a) {
		this._buffer.fill(a);
	};
	
	/** Join columns **/
	Mat.prototype.joinCols = function(b) {
		var M = new Mat(this._type, this._rows, this._cols + b._cols);
		
		if ( this._rows == b._rows ) {
			for ( var col = 0; col < this._cols; col++ ) {
				for ( var row = 0; row < this._rows; row++ ) {
					M.set(col, row, this.at(col, row));
				}
			}
			for ( var col = 0; col < b._cols; col++ ) {
				for ( var row = 0; row < b._rows; row++ ) {
					M.set(col + this._cols, row, b.at(col, row));
				}
			}
		}
		
		return M;
	};
	
	/** Join rows **/
	Mat.prototype.joinRows = function(b) {
		var M = new Mat(this._type, this._rows + b._rows, this._cols);
		
		if ( this._cols == b._cols ) {
			for ( var row = 0; row < this._rows; row++ ) {
				for ( var col = 0; col < this._cols; col++ ) {
					M.set(col, row, this.at(col, row));
				}
			}
			
			for ( var row = 0; row < b._rows; row++ ) {
				for ( var col = 0; col < b._cols; col++ ) {
					M.set(col, row + this._rows, b.at(col, row));
				}
			}
		}
		
		return M;
	};
	
	/** Shuffle column col **/
	Mat.prototype.shuffleCol = function(col) {
		var m = this._rows, t, i;
		while (m) {
			 
		    // Pick a remaining element
		    i = Math.floor(Math.random() * m--);
		 
		    // And swap it with the current element.
		    t = this.at(col, m);
		    this.set(col, m, this.at(col, i));
		    this.set(col, i, t);
		}
	};
	
	/** Shuffle row row **/
	Mat.prototype.shuffleRow = function(row) {
		var m = this._cols, t, i;
		while (m) {
			 
		    // Pick a remaining element
		    i = Math.floor(Math.random() * m--);
		 
		    // And swap it with the current element.
		    t = this.at(m, row);
		    this.set(m, row, this.at(i, row));
		    this.set(i, row, t);
		}
	};
	
	/** 
	 * Randomize elements to [0,1]
	 * Obviously will result in all 0 for int matrices
	 */
	Mat.prototype.randomize = function() {
		this._buffer.randomize();
	};
	
	/**
	 * Randomize elements to range [n,m]
	 */
	Mat.prototype.randomizeRange = function(n, m) {
		this._buffer.randomizeRange(n,m);
	};
	
	/**
	 * Scale by a scalar
	 */
	Mat.prototype.scale = function(a) {
		return new Mat(this._type, this._rows, this._cols, this._buffer.scale(a));
	};
	
	/**
	 * Divide by a scalar
	 */
	Mat.prototype.divide = function(a) {
		return new Mat(this._type, this._rows, this._cols, this._buffer.divide(a));
	};
	
	/**
	 * Add two matrices
	 */
	Mat.prototype.add = function(a) {
		var M = new Mat(this._type, this._rows, this._cols);
		
		if ( this._rows != a._rows || this._cols != a._cols ) return M;
		
		for ( var i = 0; i < M._cols; i++ )
			for ( var j = 0; j < M._rows; j++ )
				M.set(i, j, this.at(i,j) + a.at(i,j));
		
		return M;
	};
	
	/**
	 * Subtract two matrices
	 */
	Mat.prototype.subtract = function(a) {
		var M = new Mat(this._type, this._rows, this._cols);
		
		if ( this._rows != a._rows || this._cols != a._cols ) return M;
		
		for ( var i = 0; i < M._cols; i++ )
			for ( var j = 0; j < M._rows; j++ )
				M.set(i, j, this.at(i,j) - a.at(i,j));
		
		return M;
	};
	
	/**
	 * Tensor product of two matrices
	 */
	Mat.prototype.tensorProduct = function(a) {
		var M = new Mat(this._type, this._rows, this._cols);
		
		if ( this._rows != a._rows || this._cols != a._cols ) return M;
		
		for ( var i = 0; i < M._cols; i++ )
			for ( var j = 0; j < M._rows; j++ )
				M.set(i, j, this.at(i,j) * a.at(i,j));
		
		return M;
	};
	
	/**
	 * Tensor quotient of two matrices
	 */
	Mat.prototype.tensorQuotient = function(a) {
		var M = new Mat(this._type, this._rows, this._cols);
		
		if ( this._rows != a._rows || this._cols != a._cols ) return M;
		
		for ( var i = 0; i < M._cols; i++ )
			for ( var j = 0; j < M._rows; j++ )
				M.set(i, j, this.at(i,j) / a.at(i,j));
		
		return M;
	};
	
	/**
	 * Direct sum of two matrices
	 */
	Mat.prototype.directSum = function(a) {
		var M = new Mat(this._type, this._rows + a._rows, this._cols + a._cols);
		
		for ( var i = 0; i < this._cols; i++ )
			for ( var j = 0; j < this._rows; j++ )
				M.set(i, j, this.at(i,j));
		
		for ( var i = this._cols; i < M._cols; i++ )
			for ( var j = this._rows; j < M._rows; j++ )
				M.set(i, j, a.at(i,j));
		
		return M;
	};
	
	/**
	 * Multiply two matrices (tested)
	 */
	Mat.prototype.multiply = function(a) {
		var M = new Mat(this._type, this._rows, a._cols);
		
		// check m for nxm * mxp
		if ( this._rows != a._cols ) return M;
		
		for ( var c = 0; c < M._cols; c++ )
			for ( var r = 0; r < M._rows; r++ ) {
				var AB = 0;
				for ( var m = 0; m < this._cols; m++ )
					AB += this.at(m, c) * a.at(r, m);
				M.set(c, r, AB);
			}
		
		return M;
	};
	
	/**
	 * checks whether a matrix is square
	 */
	Mat.prototype.isSquare = function() {
		if ( this._cols == this._rows ) return true;
		return false;
	};
	
	/**
	 * Turns a matrix into an identity matrix if it's square
	 */
	Mat.prototype.toIdentity = function() {
		if ( !this.isSquare() ) return;
		this.reset();
		for ( var i = 0; i < this._rows; i++ )
			this.set(i,i,1);
	};
	
	/**
	 * returns a new dxd identity matrix
	 */
	Mat.prototype.identity = function() {
		var M = new Mat(this._type, this._rows, this.rows);
		if ( !this.isSquare() ) return M;
		for ( var i = 0; i < M._rows; i++ )
			M.set(i,i,1);
		return M;
	};
	
	/**
	 * returns the ith column
	 */
	Mat.prototype.getCol = function(i) {
		var idx = i * this._rows;
		return new Mat(this._type, this._rows, 1, this._buffer._buffer.subarray(idx, idx + this._rows));
	};
	
	/**
	 * returns the ith row
	 */
	Mat.prototype.getRow = function(i) {
		var R = new Mat(this._type, 1, this._cols);
		for ( var c = 0; c < this._cols; c++ )
			R.set(0, c, this.at(c, i));
		return R;
	};
	
	/** 
	 * returns a subset of rows from specified indices
	 * @param arr is a nomral javascript array
	 */
	 Mat.prototype.getRows = function(arr) {
		var M = new Mat(this._type, arr.length, this._cols);
		
		for ( var i = 0; i < arr.length; i++ ) {
			var row = arr[i];
			for ( var col = 0; col < this._cols; col++ ) {
				M.set(col, i, this.at(col, row));
			}
		}
		
		return M;
	 };
	 
	 /**
	  * returns subset of first MIN(HEAD_SIZE, |rows|) rows
	  */
	  Mat.prototype.head = function() {
	  	var 
		HEAD_SIZE = Math.min(5, this._rows),
		M = new Mat(this._type, HEAD_SIZE, this._cols);
		
		for ( var i = 0; i < HEAD_SIZE; i++ ) {
			for ( var col = 0; col < this._cols; col++ ) {
				M.set(col, i, this.at(col, i));
			}
		}
		
		return M;
	  };
	 
	 /** 
	 * returns a subset of columns from specified indices
	 * @param arr is a nomral javascript array
	 */
	 Mat.prototype.getCols = function(arr) {
		var M = new Mat(this._type, this._rows, arr.length);
		
		for ( var i = 0; i < arr.length; i++ ) {
			var col = arr[i];
			for ( var row = 0; row < this._rows; row++ ) {
				M.set(i, row, this.at(col, row));
			}
		}
		
		return M;
	 };
	
	/**
	 * returns the trace of a square matrix
	 * or 0 ( for faster compile)
	 */
	Mat.prototype.trace = function() {
		// check that matrix is square
		if ( !this.isSquare() ) return 0;
		
		var trace = 0;
		for ( var i = 0; i < this._rows; i++ )
			trace += this.at(i,i);
		
		return trace;
	};
	
	/**
	 * returns the determinant of a matrix
	 * adapted from http://professorjava.weebly.com/matrix-determinant.html
	 * or 0
	 */
	Mat.prototype.det = function() {
		// check taht matrix is square
		if ( !this.isSquare() ) return 0;
		
		var det = 0, s;
		
		if ( this._rows == 1 ) return this.at(0,0);
		
		for ( var i = 0; i < this._rows; i++ ) {
			var M = new Mat(this._type, this._rows - 1, this._rows - 1);
			for ( var a = 1; a < this._rows; a++ )
				for ( var b = 0; b < this._rows; b++ ) {
					if ( b < i )
						M.set(a-1, b, this.at(a,b));
					else if ( b > i )
						M.set(a-1, b-1, this.at(a,b));
				}
			
			if ( i & 1 ) s = -1;
			else s = 1;
			
			det += s * this.at(0,i) * M.det();
		}
		
		return det;
	};
	
	/**
	 * returns the row-major (i,j) minor
	 * or 0
	 */
	Mat.prototype.minor_r = function(i, j) {
		if ( !this.isSquare() ) return 0;
		
		// get a new d-1xd-1 matrix
		var M = new Mat(this._type, this._rows - 1, this._cols - 1);
		// fill in
		var curRow = 0, curCol;
		for ( var row = 0; row < this._rows; row++ ) {
			if ( row == i ) continue;
			curCol = 0;
			for ( var col = 0; col < this._cols; col++ ) {
				if ( col == j ) continue;
				M.set(curCol, curRow, this.at(col, row));
				curCol++;
			}
			curRow++;
		}
		
		return M.det();
	};
	
	/**
	 * returns the column-major (i,j) minor
	 * or 0
	 */
	Mat.prototype.minor = function(i, j) {
		return this.minor_r(j,i);
	};
	
	/**
	 * returns the column-major (i,j) cofactor
	 * or 0
	 */
	Mat.prototype.cofactor = function(i, j) {
		var minor = this.minor(i, j);
		return ( (i + j) & 1 ) ? -minor : minor;
	};
	
	/**
	 * returns the row-major (i, j) cofactor
	 * or 0
	 */
	Mat.prototype.cofactor_r = function(i, j) {
		return this.cofactor(j, i);
	};
	
	/**
	 * Returns the cofactor matrix
	 */
	Mat.prototype.cofactorMatrix = function() {
		var M = new Mat(this._type, this._rows, this._cols);
		
		if ( !this.isSquare() ) return M;
		
		for ( var i = 0; i < this._cols; i++ )
			for ( var j = 0; j < this._rows; j++ )
				M.set(i, j, this.cofactor(i, j));
		
		return M;
	};
	
	/**
	 * Returns the adjugate matrix
	 */
	Mat.prototype.adjugate = function() {
		return this.cofactorMatrix().transpose();
	};
	
	/**
	 * Returns whether or not the matrix is singular
	 */
	Mat.prototype.isSingular = function() {
		if ( this.det() == 0 ) return true;
		return false;
	};
	
	/**
	 * Returns the inverse matrix
	 */
	Mat.prototype.inverse = function() {
		// instead of calculating the determinent twice...
		var det = this.det();
		
		if ( det == 0 ) return new Mat(this._type, this._rows, this._cols);

		return this.adjugate().scale(1.0 / det);
	};
	
	/**
	 * Cleans up matrix
	 * i.e., rounds all entries to d digits
	 * and uses mode m (see round())
	 */
	Mat.prototype.cleanup = function(d, mode) {
		this._buffer.cleanup(d, mode);
	};
	
	/**
	 * get a cleaned up copy
	 */
	Mat.prototype.getClean = function(d, mode) {
		var M = this.getCopy();
		M.cleanup(d, mode);
		return M;
	};
	
	/**
	 * Returns whether or not a diagonal element is 0
	 * use on r diagonal form qr decomposition to determine
	 * if matrix is ful rank
	 * p is a precision parameter for round()
	 */
	Mat.prototype.diagHasZero = function(p) {
		if ( !p ) p = 6;
		for ( var i = 0; i < this._rows; i++ )
			if ( round(this.at(i,i), p) == 0 ) return true;
		return false;
	};
	
	/**
	 * Frobenius Norm
	 */
	function mat_frobenius_norm() {
		var d = 0;
		for ( var i = 0; i < this._cols; i++ ) {
			for ( var j = 0; j < this._rows; j++ ) {
				d += this.at(i,j) * this.at(i,j);
			}
		}
		return Math.sqrt(d);
	}
	
	/**
	 * Frobenius Norm
	 */
	function mat_squared_frobenius_norm() {
		var d = 0;
		for ( var i = 0; i < this._cols; i++ ) {
			for ( var j = 0; j < this._rows; j++ ) {
				d += this.at(i,j) * this.at(i,j);
			}
		}
		return d;
	}
	
	/** Default Matrix Norm **/
	Mat.prototype.norm = mat_frobenius_norm;
	
	/**
	 * Computes the QR decomposition
	 * returns {Q,R}
	 * @TODO fix!
	 * trying to adapt from http://www.iaa.ncku.edu.tw/~dychiang/lab/program/mohr3d/source/Jama%5CQRDecomposition.html
	 */
	Mat.prototype.QR = function() {
		
		// @TODO implement diagnonal matrix subclass to replace r
		var 
		qr = this.getCopy(), 
		rdiag = new Mat(this._type, this._cols, this._cols),
		q = new Mat(this._type, this._cols, this._cols),
		r = new Mat(this._type, this._cols, this._cols);
		
		pushVectorNormState('euclidean');
		for ( var k = 0; k < qr._cols; k++ ) {
			// Compute 2-norm of the kth column
			var nrm = qr.getCol(k)._buffer.norm();
			
			if ( nrm != 0 ) {
				// form the kth Householder vector
				if ( qr.at(k, k) < 0 )
					nrm = -nrm;
				for ( var i = k; i < qr._rows; i++ )
					qr.set(k, i, qr.at(k, i) / nrm);
				qr.set(k, k, qr.at(k, k) + 1.0);
				
				// apply transformation to remaining columns
				for ( var j = k + 1; j < qr._cols; j++ ) {
					var s = 0.0;
					for ( var i = k; i < qr._rows; i++ )
						s += qr.at(k,i) * qr.at(j,i);
					s = -s / qr.at(k, k);
					for ( var i = k; i < qr._rows; i++ )
						qr.set(j, i, s * qr.at(k, i));
				}
			}
			rdiag.set(k, k, -nrm);
		}
		popVectorNormState();
		
		// get r
		for ( var i = 0; i < this._cols; i++ ) {
			for ( var j = 0; j < this._cols; j++ ) {
				if ( i < j )
					r.set(j,i,qr.at(j,i));
				else if ( i == j )
					r.set(j,i,rdiag.at(i,i));
			}
		}
		
		// get q
		for ( var k = this._cols - 1; k >= 0; k-- ) {
			q.set(k,k,1);
			for ( var j = k; j < this._cols; j++ ) {
				if ( round(qr.at(k,k), 6) != 0 ) {
					var s = 0.0;
					for ( var i = k; i < this._rows; i++ )
						s += qr.at(k,i) * qr.at(j,i);
					s = -s / qr.at(k,k);
					for ( var i = k; i < this._rows; i++ )
						q.set(j,i,q.at(j,i) + qr.at(k,i) * s);
				}
			}
		}
		
		return {Q:q, R:r};
	};
	
	/**
	 * Compute a covariance matrix
	 * returns a SymMat with Float64 precision or type
	 */
	Mat.prototype.covMat = function(biased, type) {

		if ( !type ) type = DEFAULT_TYPE;

		var Q = new CovMat(type, this._cols);
				
		// memoize columns
		var cols = [];
		
		for ( var i = 0; i < this._cols; i++ ) {
			if ( !cols[i] ) cols[i] = this.getCol(i)._buffer;
			Q.set(i, i, cols[i].var(biased));
			for ( var j = i + 1; j < this._cols; j++ ) {
				if ( !cols[j] ) cols[j] = this.getCol(j)._buffer;
				Q.set(i, j, cols[i].cov(cols[j], biased));
			}
		}
		
		return Q;
	};
	
	/**
	 * Compute a correlation matrix
	 * returns a SymMat with Float64 precision or type
	 */
	Mat.prototype.corMat = function(biased, type) {

		if ( !type ) type = DEFAULT_TYPE;

		var Q = new CovMat(type, this._cols, null, true);
				
		// memoize columns and their stds
		var cols = [], stds = [];
		
		for ( var i = 0; i < this._cols; i++ ) {
			if ( !cols[i] ) {
				cols[i] = this.getCol(i)._buffer;
				stds[i] = cols[i].std();
			}
			Q.set(i, i, 1);
			for ( var j = i + 1; j < this._cols; j++ ) {
				if ( !cols[j] ) {
					cols[j] = this.getCol(j)._buffer;
					stds[j] = cols[j].std();
				}
				Q.set(i, j, cols[i].cov(cols[j], biased) / (stds[i] * stds[j]));
			}
		}
		
		return Q;
	};
	
	/**
	 * Extract the diagonal matrix
	 */
	Mat.prototype.getDiag = function(type) {
		if ( !type ) type = this._type;
		
		var M = new DiagMat(type, this._rows);
		for ( var i = 0; i < this._rows; i++ )
			M.set(i,i,this.at(i,i));
			
		return M;
	};
	
	/**
	 * Diagonal Matrix
	 */
	function DiagMat(type, size, data) {
		// @TODO handle if data is passed!
		if ( typeof data === "object" ) {
			var name = data.constructor.name;
						
			// if arr is a Mat class, copy it
			// @TODO fix for miniifcation
			
			if ( !type ) type = data._type;
			
			if ( name === 'SymMat' || name === 'CovMat' ) {
				Mat.call(this,
						type,
						data._cols,
						data._cols,
						data._buffer.getCopy());
			}
			else if ( name === 'Mat' ) {
				// @TODO fix copy's data (i.e., get first triangle)
				
			}
			else if ( name === 'Vec' ) {
			
			}
			// else if array...
		}
		else {
			if ( !size ) size = DEFAULT_SIZE;
			if ( !type ) type = DEFAULT_TYPE;
			Mat.call(this,
					type,
					size,
					size,
					new Vec(type, size));
		}
	}
	
	// set DiagMat as subclass of Mat
	DiagMat.prototype = Object.create(Mat.prototype);
	DiagMat.prototype.constructor = DiagMat;
	
	/**
	 * Override basic functionality
	 */
	DiagMat.prototype.at = function(i, j) {
		if ( i != j ) return 0;
		return this._buffer._buffer[i];
	};
	DiagMat.prototype.at_r = function(i, j) {
		return this.at(i,j);
	};
	DiagMat.prototype.set = function(i, j, a) {
		if ( i == j ) this._buffer._buffer[i] = a;
	};
	DiagMat.prototype.set_r = function(i, j, a) {
		this.set(i,j,a);
	};
	DiagMat.prototype.getCol = function(i) {
		var M = new Mat(this._type, 1, this._cols);
		M.set(i,i,this.at(i,i));
		return M;
	};
	DiagMat.prototype.getRow = function(i) {
		var M = new Mat(this._type, this._rows, 1);
		M.set(i,i,this.at(i,i));
		return M;
	};
	
	/**
	 * get a Mat
	 */
	DiagMat.prototype.getMat = function() {
		var M = new Mat(this._type, this._rows, this._cols);
		for ( var i = 0; i < M._rows; i++ ) {
			M.set(i,i,this.at(i,i));
		}
		return M;
	};
	
	/**
	 * get a SymMat
	 */
	DiagMat.prototype.getSymMat = function() {
		var M = new SymMat(this._type, this._rows);
		for ( var i = 0; i < M._rows; i++ ) {
			M.set(i,i,this.at(i,i));
		}
		return M;
	};
	 
	/**
	 * Symmetric Matrix
	 * @TODO eventually add support to initialize with data other than a SymMat
	 */
	function SymMat(type, size, copy) {

		if ( typeof copy === "object" ) {
			var name = copy.constructor.name;
						
			// if arr is a Mat class, copy it
			// @TODO fix for miniifcation
			
			if ( !type ) type = copy._type;
			
			if ( name === 'SymMat' || name === 'CovMat' ) {
				Mat.call(this,
						type,
						copy._cols,
						copy._cols,
						copy._buffer.getCopy());
			}
			else if ( name === 'Mat' ) {
				// @TODO fix copy's data (i.e., get first triangle)
				
			}
			else if ( name === 'Vec' ) {
			
			}
			// else if array...
		}
		else {
			if ( !size ) size = DEFAULT_SIZE;
			if ( !type ) type = DEFAULT_TYPE;
			Mat.call(this,
					type,
					size,
					size,
					new Vec(type, size + ((size * size - size)/2)));
		}
	}
	
	// set Symmetric Matrix as subclass of Mat
	SymMat.prototype = Object.create(Mat.prototype);
	SymMat.prototype.constructor = SymMat;
	
	/**
	 * Override at & set for SymMat
	 * http://www.codeguru.com/cpp/cpp/algorithms/general/article.php/c11211/TIP-Half-Size-Triangular-Matrix.htm
	 */
	SymMat.prototype.getCopy = function(type) {
		return new SymMat(type, null, this);
	};
	function getSymIndex(col,row,n) {
		if ( row <= col )
			return row * n - (row - 1) * ((row - 1) + 1) / 2 + col - row;
		else
			return col * n - (col - 1) * ((col - 1) + 1) / 2 + row - col;
	}
	SymMat.prototype.at = function(i, j) {
		return this._buffer.at(getSymIndex(i, j, this.cols()));
	};
	SymMat.prototype.set = function(i, j, a) {
		this._buffer.set(getSymIndex(i, j, this.cols()), a);
	};
	SymMat.prototype.at_r = function(i, j) {
		return this.at(i,j);
	};
	SymMat.prototype.set_r = function(i, j, a) {
		this.set(i,j,a);
	};
	SymMat.prototype.transpose = function() {
		return new SymMat(null, null, this);
	};
	SymMat.prototype.getCol = function(i) {
		var C = new Mat(this._type, this._rows, 1);
		for ( var c = 0; c < this._rows; c++ )
			C.set(0, c, this.at(c, i));
		return C;
	};
	
	/**
	 * get to a super Mat
	 * O(n^2)
	 */
	SymMat.prototype.getMat = function(type) {
		
		if ( !type ) type = this._type;
		
		var M = new Mat(type, this._rows, this._rows);
		for ( var i = 0; i < this._rows; i++ )
			for ( var j = 0; j < this._rows; j++ )
				M.set(i,j,this.at(i,j));
		
		return M;
	};
	
	/**
	 * Randomizes to an unweighted graph
	 * p is the probability that any two nodes are connected by an edge
	 */
	SymMat.prototype.randomUnweightedGraph = function(p) {
		this.reset();
		if ( !p ) p = 0.5;
		for ( var i = 0; i < this._rows; i++ ) {
			for ( var j = i + 1; j < this._rows; j++ ) {
				if ( Math.random() <= p ) this.set(i, j, 1); 
			}
		}
	};
	
	/**
	 * returns an array neigborhood for some node
	 * defines connection by G(i,j) != 0
	 */
	SymMat.prototype.neighbourhood = function(n) {
		var neighbourhood = [], numNodes = 0;
		for ( var i = 0; i < this._rows; i++ ) {
			if ( i == n ) continue;
			if ( this.at(n,i) != 0 ) neighbourhood[numNodes++] = i;
		}
		return neighbourhood;
	};
	
	/**
	 * returns unweighted degree for some node
	 */
	SymMat.prototype.degree = function(n) {
		var deg = 0;
		for ( var i = 0; i < this._rows; i++ ) {
			if ( i == n ) continue;
			if ( this.at(n,i) != 0 ) deg++;
		}
		return deg;
	};
	
	/**
	 * Clustering Coefficients for some node n
	 */
	SymMat.prototype.clusterCoeff = function(n) {
		var combos = choose(this.degree(n), 2), links = 0;
		
		if ( !combos ) return 0;
		
		for ( var i = 0; i < this._rows; i++ ) {
			if ( i == n ) continue;
			if ( this.at(n,i) != 0 ) links++;
		}
		
		return links / combos;
	};
	
	/**
	 * Average Clustering Coefficient
	 */
	SymMat.prototype.avgClusterCoeff = function() {
		var c = 0;
		for ( var i = 0; i < this._rows; i++ )
			c += this.clusterCoeff(i);
		return c / this._rows;
	};
	
	/**
	 * Global Clustering Coefficient
	 * @TODO check... i don't think this is right
	 */
	SymMat.prototype.globalCLusterCoeff = function() {
		var c = 0;
		for ( var i = 0; i < this._rows; i++ ) {
			var n = this.degree(i);
			c += this.clusterCoeff(i) * choose(n, 2);
		}
		return c / this._rows;
	};
	
	/**
	 * Cov/Cor Matrix Helper Class
	 * so you can easily switch between the two
	 */
	function CovMat(type, size, data, isCor) {	
	
		// set to covariance by default
		this._isCor = !!isCor;
			
	 	if ( typeof data === "object" ) {
			var name = data.constructor.name;
			
			if ( !type ) type = data._type;

			// if data is a SymMat class, copy it
			// @TODO fix for miniifcation
			if ( name === 'SymMat' || name === 'Mat' ) {
				SymMat.call(this,
						type,
						data._cols,
						data._buffer.getCopy());
			}
			else if ( name === 'CovMat' ) {
				
				// override isCor
				this._isCor = data._isCor;
			
				SymMat.call(this,
						data.type,
						data._rows,
						data._buffer); // @TODO don't use copy right? because it's made anyway? fix above...
			}
		}
		else {
			if ( !size ) size = DEFAULT_SIZE;
			if ( !type ) type = DEFAULT_TYPE;
			
			SymMat.call(this,
					type,
					size,
					size,
					new Vec(type, size + ((size * size - size)/2)));
		}
	}
	 
	// set CovMat as subclass of SymMat
	CovMat.prototype = Object.create(SymMat.prototype);
	CovMat.prototype.constructor = CovMat;
	
	// override getCopy
	CovMat.prototype.getCopy = function(type) {
		return new CovMat(type, null, this);
	};
	
	// check if this is a covariance matrix
	CovMat.prototype.isCov = function() {
		return !this._isCor;
	};
	// check if this is a correlation matrix
	CovMat.prototype.isCor = function() {
		return this._isCor;
	};
	
	/**
	 * get a SymMat from a CovMat
	 */
	CovMat.prototype.getSymMat = function() {
		return new SymMat(this._type, this._rows, this._rows, this._buffer);
	};
	
	/**
	 * get a correlation matrix from a covariance matrix
	 */
	CovMat.prototype.getCorMat = function() {
		if ( this._isCor )
			return this._getCopy();
			
		var M = new CovMat(this._type, this._rows, null, true);
		for ( var i = 0; i < M._rows; i++ )
			for ( var j = i; j < M._rows; j++ ) {
				if ( i == j ) M.set(i,j,1);
				else {
					var stdp = Math.sqrt(this.at(i,i)) * Math.sqrt(this.at(j,j));
					M.set(i, j, this.at(i,j) / stdp);
				}
			}
			
		return M;
	};
	
	/**
	 * get a covariance matrix from a correlation matrix
	 * @TODO should we store the stds/variances in the class?
	 * if no stds are passed, returning an empty CovMat
	 */
	CovMat.prototype.getCovMat = function(stds) {
	
		if ( !this._isCor )
			return this._getCopy();
			
		var M = new CovMat(this._type, this._rows, null, false);
		
		if ( !stds || stds.size() != this._rows ) return M;
		
		for ( var i = 0; i < M._rows; i++ )
			for ( var j = i; j < M._rows; j++ ) {
				if ( i == j ) M.set(i,j,stds.at(i) * stds.at(i));
				else {
					var stdp = this.at(i,i) * this.at(j,j);
					M.set(i, j, this.at(i,j) * stdp);
				}
			}
			
		return M;
	};
	
	return {
		// Public Number Operators
		factorial: function(n) { return factorial(n); },
		choose: function(n,k) { return choose(n,k); },
		round: function(value, precision, mode) { return round(value, precision, mode); },
		sign: function(x) { return sign(x); },
		
		// Unit Conversion Operators
		degToRad: function(x) { return degToRad(x); },
		radToDeg: function(x) { return radToDeg(x); },
		
		// Public Vector Constructors
		Vec: function(size, type, vec) { return new Vec(type, size, vec); },
		Vec3d: function() { return new Vec('Float64Array', 3); },
		Vec3f: function() { return new Vec('Float32Array', 3); },
		Vec3i: function() { return new Vec('Int32Array', 3); },
		Vec3u: function() { return new Vec('Uint32Array', 3); },
		Vec4d: function() { return new Vec('Float64Array', 4); },
		Vec4f: function() { return new Vec('Float32Array', 4); },
		Vec4i: function() { return new Vec('Int32Array', 4); },
		Vec4u: function() { return new Vec('Uint32Array', 4); },
		RandVec: function(size, a, b, type) { var V = new Vec(type, size); V.randomizeRange(a, b); return V; },
		
		// Vector State Functions
		pushVectorNorm: function(norm) { pushVectorNormState(norm); },
		popVectorNorm: function() { popVectorNormState(); },
		currentVectorNorm: function() { return _vector_norm; },
		
		// Public Matrix Constructors
		Mat: function(rows, cols, type, mat) { return new Mat(type, rows, cols, mat); },
		Eye: function(size, type) { var M = new Mat(type, size, size); M.toIdentity(); return M; },
		Mat3d: function() { return new Mat('Float64Array', 3, 3); },
		Mat3f: function() { return new Mat('Float32Array', 3, 3); },
		Mat3i: function() { return new Mat('Int32Array', 3, 3); },
		Mat3u: function() { return new Mat('Uint32Array', 3, 3); },
		Mat4d: function() { return new Mat('Float64Array', 4, 4); },
		Mat4f: function() { return new Mat('Float32Array', 4, 4); },
		Mat4i: function() { return new Mat('Int32Array', 4, 4); },
		Mat4u: function() { return new Mat('Uint32Array', 4, 4); },
		Diag: function(size, type, data) { return new DiagMat(type, size, data); },
		RandMat: function(rows, cols, a, b, type) { var M = new Mat(type, rows, cols); M.randomizeRange(a, b); return M; },
		RandDiag: function(size, a, b, type) { var M = new DiagMat(type, size); M.randomizeRange(a, b); return M; },
		
		SymMat: function(size, type, copy) { return new SymMat(type, size, copy); },
		RandGraph: function(size, p, type) { if ( !type ) type = 'Int8Array'; var G = new SymMat(type, size); G.randomUnweightedGraph(p); return G; }
	}
}();
