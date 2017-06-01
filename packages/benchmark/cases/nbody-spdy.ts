function solarMass() {
    "use speedyjs";

    return 4 * Math.PI * Math.PI;
}

function daysPerYear() {
    "use speedyjs";
    return 365.24;
}

class Body {

    constructor(
        public x: number,
        public y: number,
        public z: number,
        public vx: number,
        public vy: number,
        public vz: number,
        public mass: number
    ) {
        "use speedyjs";
    }

    offsetMomentum(px: number, py: number, pz: number) {
        "use speedyjs";

        this.vx = -px / solarMass();
        this.vy = -py / solarMass();
        this.vz = -pz / solarMass();
    }
}

function Jupiter(): Body {
    "use speedyjs";

    return new Body(
        4.84143144246472090e+00,
        -1.16032004402742839e+00,
        -1.03622044471123109e-01,
        1.66007664274403694e-03 * daysPerYear(),
        7.69901118419740425e-03 * daysPerYear(),
        -6.90460016972063023e-05 * daysPerYear(),
        9.54791938424326609e-04 * solarMass()
    );
}

function Saturn(): Body {
    "use speedyjs";

    return new Body(
        8.34336671824457987e+00,
        4.12479856412430479e+00,
        -4.03523417114321381e-01,
        -2.76742510726862411e-03 * daysPerYear(),
        4.99852801234917238e-03 * daysPerYear(),
        2.30417297573763929e-05 * daysPerYear(),
        2.85885980666130812e-04 * solarMass()
    );
}

function Uranus(): Body {
    "use speedyjs";

    return new Body(
        1.28943695621391310e+01,
        -1.51111514016986312e+01,
        -2.23307578892655734e-01,
        2.96460137564761618e-03 * daysPerYear(),
        2.37847173959480950e-03 * daysPerYear(),
        -2.96589568540237556e-05 * daysPerYear(),
        4.36624404335156298e-05 * solarMass()
    );
}

function Neptune(): Body {
    "use speedyjs";

    return new Body(
        1.53796971148509165e+01,
        -2.59193146099879641e+01,
        1.79258772950371181e-01,
        2.68067772490389322e-03 * daysPerYear(),
        1.62824170038242295e-03 * daysPerYear(),
        -9.51592254519715870e-05 * daysPerYear(),
        5.15138902046611451e-05 * solarMass()
    );
}

function Sun(): Body {
    "use speedyjs";

    return new Body(
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, solarMass()
    );
}

class NBodySystem {
    public bodies: Array< Body >;
    constructor(bodies: Array< Body >) {
        "use speedyjs";

        let px = 0.0;
        let py = 0.0;
        let pz = 0.0;
        const size= bodies.length;
        for (let i: int = 0; i < size; i++) {
            const b = bodies[i];
            const m = b.mass;
            px += b.vx * m;
            py += b.vy * m;
            pz += b.vz * m;
        }
        this.bodies = bodies;
        this.bodies[0].offsetMomentum(px, py, pz);
    }

    advance(dt: number): void {
        "use speedyjs";

        let dx: number,
            dy: number,
            dz: number,
            ix: number,
            iy: number,
            iz: number,
            bivx: number,
            bivy: number,
            bivz: number,
            distance: number,
            mag: number;

        const bodies = this.bodies;
        const size = bodies.length;

        for (let i = 0; i < size; ++i) {
            const bodyi = bodies[i];

            ix = bodyi.x;
            iy = bodyi.y;
            iz = bodyi.z;

            bivx = bodyi.vx;
            bivy = bodyi.vy;
            bivz = bodyi.vz;

            for (let j = i + 1; j < size; ++j) {
                const bodyj = bodies[j];
                dx = ix - bodyj.x;
                dy = iy - bodyj.y;
                dz = iz - bodyj.z;

                const distanceSq = dx * dx + dy * dy + dz * dz;
                distance = Math.sqrt(distanceSq);
                mag = dt / (distanceSq * distance);

                const bim = bodyi.mass * mag;
                const bjm = bodyj.mass * mag;

                bivx -= dx * bjm;
                bivy -= dy * bjm;
                bivz -= dz * bjm;

                bodyj.vx += dx * bim;
                bodyj.vy += dy * bim;
                bodyj.vz += dz * bim;
            }

            bodyi.vx = bivx;
            bodyi.vy = bivy;
            bodyi.vz = bivz;

            bodyi.x += dt * bivx;
            bodyi.y += dt * bivy;
            bodyi.z += dt * bivz;
        }
    }

    energy(): number {
        "use speedyjs";
        
        let dx: number, dy: number, dz: number, distance: number;
        let ix: number, iy: number, iz: number, vx: number, vy: number, vz: number, bim: number;
        let e = 0.0;
        const size = this.bodies.length;

        for (let i = 0; i < size; ++i) {
            const bodyi: Body = this.bodies[i];

            ix = bodyi.x;
            iy = bodyi.y;
            iz = bodyi.z;

            vx = bodyi.vx;
            vy = bodyi.vy;
            vz = bodyi.vz;

            bim = bodyi.mass;

            e += 0.5 * bim * (vx * vx + vy * vy + vz * vz);

            for (let j = i + 1; j < size; ++j) {
                const bodyj = this.bodies[j];
                dx = ix - bodyj.x;
                dy = iy - bodyj.y;
                dz = iz - bodyj.z;

                distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                e -= bim * bodyj.mass / distance;
            }
        }
        return e;
    }
}

export async function nbody(n: int) {
    "use speedyjs";

    const bodies: NBodySystem = new NBodySystem([Sun(), Jupiter(), Saturn(), Uranus(), Neptune()]);
    for (let i = 0; i < n; i++) {
        bodies.advance(0.01);
    }
    return bodies.energy();
}

/*
 var n: uint32 = 500000;
 console.time('t');
 var bodies: NBodySystem = new NBodySystem(new Array< Body >(Sun(), Jupiter(), Saturn(), Uranus(), Neptune()));
 //console.log(bodies.energy().toFixed(9));
 for (var i: uint32 = 0; i < n; i++) {
 bodies.advance(0.01);
 }
 //console.log(bodies.energy().toFixed(9));
 // -0.169075164
 // -0.169096567
 console.timeEnd('t');
 */