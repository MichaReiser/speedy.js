
/** Random.js library.
 *
 * The code is licensed as LGPL.
 */

/* 
 A C-program for MT19937, with initialization improved 2002/1/26.
 Coded by Takuji Nishimura and Makoto Matsumoto.

 Before using, initialize the state by using init_genrand(seed)
 or init_by_array(init_key, key_length).

 Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions
 are met:

 1. Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the distribution.

 3. The names of its contributors may not be used to endorse or promote
 products derived from this software without specific prior written
 permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


 Any feedback is very welcome.
 http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
 email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
 */

 #include<vector>
 #include<cmath>

const unsigned N = 624;
const unsigned M = 397;
const unsigned MATRIX_A = 0x9908b0df;
const unsigned UPPER_MASK = 0x80000000;
const unsigned LOWER_MASK = 0x7fffffff;
const double LOG4 = std::log(4.0);
const double SG_MAGICCONST = 1.0 + std::log(4.5);

class Random {
    std::vector<unsigned> mt;
    size_t mti;
    bool pythonCompatibility = false;
    bool skip = false;
    double lastNormal = std::nan("");

public:
    Random(unsigned seed):
        mt { std::vector<unsigned> (N) }, mti { N + 1 }, pythonCompatibility { false }, skip { false }, lastNormal { std::nan("") }
     {
        //this.init_genrand(seed);
        std::vector<unsigned> initKey = { seed };

        init_by_array(initKey, 1);
    }

    /* initialize by an array with array-length */
    /* init_key is the array for initializing keys */
    /* key_length is its length */
    /* slight change for C++, 2004/2/26 */
    void init_by_array(const std::vector<unsigned>& init_key, size_t key_length) {
        init_genrand(19650218);

        size_t i = 1;
        size_t j = 0;
        size_t k = N > key_length ? N : key_length;

        for (; k; --k) {
            unsigned s = mt[i-1] ^ (mt[i-1] >> 30);
            mt[i] = (mt[i] ^ (((((s & 0xffff0000) >> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525))) + init_key[j] + j; /* non linear */
            mt[i] >>= 0; /* for WORDSIZE > 32 machines */
            ++i; ++j;
            if (i>=N) { mt[0] = mt[N-1]; i=1; }
            if (j>=key_length) j=0;
        }

        for (k=N-1; k; --k) {
            unsigned s = mt[i-1] ^ (mt[i-1] >> 30);
            mt[i] = (mt[i] ^ (((((s & 0xffff0000) >> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941)) - i; /* non linear */
            mt[i] >>= 0; /* for WORDSIZE > 32 machines */
            ++i;
            if (i>=N) { mt[0] = mt[N-1]; i=1; }
        }

        mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */
    }

    /* initializes mt[N] with a seed */
    void init_genrand(size_t s) {
        mt[0] = s >> 0;
        for (mti=1; mti<N; ++mti) {
            unsigned s = mt[mti-1] ^ (mt[mti-1] >> 30);
            mt[mti] = (((((s & 0xffff0000) >> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253) + mti;
            /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
            /* In the previous versions, MSBs of the seed affect   */
            /* only MSBs of the array mt[].                        */
            /* 2002/01/09 modified by Makoto Matsumoto             */
            mt[mti] >>= 0;
            /* for >32 bit machines */
        }
    }

    /* generates a random number on [0,0xffffffff]-interval */
    unsigned genrand_int32() {
        std::vector<unsigned> mag01 = { 0x0, MATRIX_A };
        unsigned y {};

        if (mti >= N) { /* generate N words at one time */
            unsigned kk {};

            if (mti == N+1)   /* if init_genrand() has not been called, */
                init_genrand(5489); /* a default initial seed is used */

            for (kk=0;kk<N-M;++kk) {
                y = (mt[kk]&UPPER_MASK)|(mt[kk+1]&LOWER_MASK);
                mt[kk] = mt[kk+M] ^ (y >> 1) ^ mag01[y & 0x1];
            }
            for (;kk<N-1;++kk) {
                y = (mt[kk]&UPPER_MASK)|(mt[kk+1]&LOWER_MASK);
                mt[kk] = mt[kk+(M-N)] ^ (y >> 1) ^ mag01[y & 0x1];
            }
            y = (mt[N-1]&UPPER_MASK)|(mt[0]&LOWER_MASK);
            mt[N-1] = mt[M-1] ^ (y >> 1) ^ mag01[y & 0x1];

            mti = 0;
        }

        y = mt[mti];
        ++mti;

        /* Tempering */
        y ^= (y >> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >> 18);

        return y >> 0;
    }

    /* generates a random number on [0,0x7fffffff]-interval */
    unsigned genrand_int31() {
        return (genrand_int32()>>1);
    }

    /* generates a random number on [0,1]-real-interval */
    double genrand_real1() {
        return (genrand_int32()) *(1.0/4294967295.0);
    }

    /* generates a random number on [0,1)-real-interval */
    double random() {
        if (pythonCompatibility) {
            if (skip) {
                genrand_int32();
            }
            skip = true;
        }
        return (genrand_int32())*(1.0/4294967296.0);
        /* divided by 2^32 */
    }

    /* generates a random number on (0,1)-real-interval */
    double genrand_real3 () {
        return ((genrand_int32())+ 0.5)*(1.0/4294967296.0);
        /* divided by 2^32 */
    }

    /* generates a random number on [0,1) with 53-bit resolution*/
    double genrand_res53() {
        unsigned a = genrand_int32() >> 5;
        unsigned b = genrand_int32() >> 6;
        return(a*67108864.0+b)*(1.0/9007199254740992.0);
    }


    /* These real versions are due to Isaku Wada, 2002/01/09 added */


    /**************************************************************************/
    double exponential(double lambda) {
        double r = random();
        return -std::log(r) / lambda;
    };

    double gamma(double alpha, double beta) {
        /* Based on Python 2.6 source code of random.py.
         */

        if (alpha > 1.0) {
            double ainv = std::sqrt(2.0 * alpha - 1.0);
            double bbb = alpha - LOG4;
            double ccc = alpha + ainv;

            while (true) {
                double u1 = random();
                if ((u1 < 1e-7)) {
                    continue;
                }
                double u2 = 1.0 - random();
                double v = std::log(u1 / (1.0 - u1)) / ainv;
                double x = alpha * std::exp(v);
                double z = u1 * u1 * u2;
                double r = bbb + ccc * v - x;
                if ((r + SG_MAGICCONST - 4.5 * z >= 0.0) || (r >= std::log(z))) {
                    return x * beta;
                }
            }
        } else if (alpha == 1.0) {
            double u = random();
            while (u <= 1e-7) {
                u = random();
            }
            return - std::log(u) * beta;
        } else {
            double x {};
            while (true) {
                double u = random();
                double b = (std::exp(1.0) + alpha) / std::exp(1.0);
                double p = b * u;
                if (p <= 1.0) {
                    x = std::pow(p, 1.0 / alpha);
                } else {
                    x = - std::log((b - p) / alpha);
                }
                double u1 = random();
                if (p > 1.0) {
                    if (u1 <= std::pow(x, (alpha - 1.0))) {
                        break;
                    }
                } else if (u1 <= std::exp(-x)) {
                    break;
                }
            }
            return x * beta;
        }

    }

    double normal(double mu, double sigma) {
        double z = lastNormal;
        lastNormal = std::nan("");
        if (std::isnan(z)) {
            double a = random() * 2.0 * M_PI;
            double b = std::sqrt(-2.0 * std::log(1.0 - random()));
            z = std::cos(a) * b;
            lastNormal = std::sin(a) * b;
        }
        return mu + z * sigma;
    }

    double pareto(double alpha) {
        double u = random();
        return 1.0 / std::pow((1 - u), 1.0 / alpha);
    }

    double triangular(double lower, double upper, double mode) {
        double c = (mode - lower) / (upper - lower);
        double u = random();

        if (u <= c) {
            return lower + std::sqrt(u * (upper - lower) * (mode - lower));
        } else {
            return upper - std::sqrt((1 - u) * (upper - lower) * (upper - mode));
        }
    }

    double uniform(double lower, double upper) {
        return lower + random() * (upper - lower);
    }

    double weibull(double alpha, double beta) {
        double u = 1.0 - random();
        return alpha * std::pow(-std::log(u), 1.0 / beta);
    }
};

extern "C" {
    double simjs(size_t seed) {
        Random random { seed };
        return random.normal(1.0, 1.2);
    }
}
