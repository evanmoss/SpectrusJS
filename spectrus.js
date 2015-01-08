/**
 * @Author: Evan Moss
 * @Website: evanmoss.info
 * @Copyright: Copyright 2014-2015. All Rights Reserved. Something something fair use license.  Don't copy and redistribute without attribution.
 * @Git: https://github.com/evanmoss/spectrusjs
 */
var Spectrus = (function(){
	
	/**
	 * swap function
	 */
	function swap(a, b) {
		var tmp = a;
		a = b;
		b = tmp;
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
				this._buffer = new window[this._type](vec._buffer);
			}
			
			else if ( name === 'Array' ) {
				this._type = type || DEFAULT_TYPE;
				this._buffer = new window[this._type](vec);
			}
		}
		else {
			this._type = type || DEFAULT_TYPE;
			this._buffer = new window[this._type](size || DEFAULT_SIZE);
		}
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
		if ( typeof choose_map[n] === "undefined" ) choose_map[n] = [];
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
				else if ( name === 'Array' ) {
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
	
	Mat.prototype.getCopy = function() {
		return new Mat(null, null, null, this);
	};
	
	Mat.prototype.data = function() {
		return this._buffer;
	};
	
	Mat.prototype.type = function() {
		return this._type;
	};
	
	/** Debug function prints mat to console (Row-major) **/
	Mat.prototype.print_r = function() {
		for ( var i = 0; i < this._cols; i++ ) {
			var str = "";
			for ( var j = 0; j < this._rows; j++ ) {
				str += "\t";
				str += this._type[0] == 'F' ? this.at(i,j).toFixed(20) : this.at(i,j); 
			}
			console.log(str);
		}		
	};
	
	/** Debug function prints mat to console (Column-major) **/
	Mat.prototype.print = function() {
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
		return this._buffer.at(j * this._cols + i);
	};
	/** Setter (Column-major) **/
	Mat.prototype.set = function(i, j, a) {
		this._buffer.set(j * this._cols + i, a);
	};
	
	/** Access (Row-major) **/
	Mat.prototype.at_r = function(i, j) {
		return this._buffer.at(i * this._cols + j);
	};
	/** Setter (Column-major) **/
	Mat.prototype.set_r = function(i, j, a) {
		this._buffer.set(i * this._cols + j, a);
	};
	
	/**
	 * Transpose
	 */
	Mat.prototype.transpose = function() {
		var M = new Mat(this._type, this._rows, this._cols);
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
		var M = this.getCopy();
		
		for ( var i = 0, len = M._buffer.size(); i < len; i++ )
			M._buffer[i] * a;
		
		return M;
	};
	
	/**
	 * Add two matrices
	 */
	Mat.prototype.add = function(a) {
		if ( this._rows != a._rows || this._cols != a._cols ) return;
		var M = new Mat(this._type, this._rows, this._cols);
		
		for ( var i = 0; i < M._cols; i++ )
			for ( var j = 0; j < M._rows; j++ )
				M.set(i, j, this.at(i,j) + a.at(i,j));
		
		return M;
	};
	
	/**
	 * Subtract two matrices
	 */
	Mat.prototype.subtract = function(a) {
		if ( this._rows != a._rows || this._cols != a._cols ) return;
		var M = new Mat(this._type, this._rows, this._cols);
		
		for ( var i = 0; i < M._cols; i++ )
			for ( var j = 0; j < M._rows; j++ )
				M.set(i, j, this.at(i,j) - a.at(i,j));
		
		return M;
	};
	
	/**
	 * Tensor product of two matrices
	 */
	Mat.prototype.tensorProduct = function(a) {
		if ( this._rows != a._rows || this._cols != a._cols ) return;
		var M = new Mat(this._type, this._rows, this._cols);
		
		for ( var i = 0; i < M._cols; i++ )
			for ( var j = 0; j < M._rows; j++ )
				M.set(i, j, this.at(i,j) * a.at(i,j));
		
		return M;
	};
	
	/**
	 * Tensor quotient of two matrices
	 */
	Mat.prototype.tensorProduct = function(a) {
		if ( this._rows != a._rows || this._cols != a._cols ) return;
		var M = new Mat(this._type, this._rows, this._cols);
		
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
	 * Multiply two matrices
	 */
	Mat.prototype.multiply = function(a) {
		// check m for nxm * mxp
		if ( this._rows != a._cols ) return;
		var M = new Mat(this._type, this._cols, a._rows);
		
		for ( var c = 0; c < M._cols; c++ )
			for ( var r = 0; r < M._rows; r++ ) {
				var AB = 0;
				for ( var m = 0; m < this._rows; m++ )
					AB += this.at(c, m) * a.at(m, r);
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
	 * returns the trace of a matrix
	 */
	Mat.prototype.trace = function() {
		// check that matrix is square
		if ( !this.isSquare() ) return;
		
		var trace = 0;
		for ( var i = 0; i < this._rows; i++ )
			trace += this.at(i,i);
		
		return trace;
	};
	
	/**
	 * returns the determinant of a matrix
	 * adapted from http://professorjava.weebly.com/matrix-determinant.html
	 */
	Mat.prototype.det = function() {
		// check taht matrix is square
		if ( !this.isSquare() ) return;
		
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
	 * Symmetric Matrix
	 * @TODO eventually add support to initialize with data other than a SymMat
	 */
	function SymMat(type, size, copy) {

		if ( typeof copy === "object" ) {
			var name = copy.constructor.name;
			// if arr is a Mat class, copy it
			// @TODO fix for miniifcation
			if ( name === 'SymMat' ) {
				
				if ( !type ) type = copy._type;
				Mat.call(this,
						type,
						copy._cols,
						copy._cols,
						copy._buffer.getCopy());
			}
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
	SymMat.prototype.degree(n) {
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
	
	return {
		// Public Number Operators
		factorial: function(n) { return factorial(n); },
		choose: function(n,k) { return choose(n,k); },
		
		// Unit Conversion Operators
		degToRad: function(x) { return degToRad(x); },
		radToDeg: function(x) { return radToDeg(x); },
		
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
		currentVectorNorm: function() { return _vector_norm; },
		
		// Public Matrix Constructors
		Mat: function(type, rows, cols, mat) { return new Mat(type, rows, cols, mat); },
		Mat3d: function() { return new Mat('Float64Array', 3, 3); },
		Mat3f: function() { return new Mat('Float32Array', 3, 3); },
		Mat3i: function() { return new Mat('Int32Array', 3, 3); },
		Mat3u: function() { return new Mat('Uint32Array', 3, 3); },
		Mat4d: function() { return new Mat('Float64Array', 4, 4); },
		Mat4f: function() { return new Mat('Float32Array', 4, 4); },
		Mat4i: function() { return new Mat('Int32Array', 4, 4); },
		Mat4u: function() { return new Mat('Uint32Array', 4, 4); },
		
		SymMat: function(type, size, copy) { return new SymMat(type, size, copy); }
	}
}());
