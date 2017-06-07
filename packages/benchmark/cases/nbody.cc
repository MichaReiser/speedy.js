#include <cmath>
#include <vector>

const double SOLAR_MASS = 4 * M_PI * M_PI;
const double DAYS_PER_YEAR = 365.24;

struct Body {
    double x;
    double y;
    double z;
    double vx;
    double vy;
    double vz;
    double mass;

    Body(double x, double y, double z, double vx, double vy, double vz, double mass) :
        x { x }, y { y }, z { z }, vx { vx }, vy { vy }, vz { vz }, mass { mass }
        {}

    void offsetMomentum(double px, double py, double pz) {
        vx = -px / SOLAR_MASS;
        vy = -py / SOLAR_MASS;
        vz = -pz / SOLAR_MASS;
    }
};

Body Jupiter() {
    return Body(
        4.84143144246472090e+00,
        -1.16032004402742839e+00,
        -1.03622044471123109e-01,
        1.66007664274403694e-03 * DAYS_PER_YEAR,
        7.69901118419740425e-03 * DAYS_PER_YEAR,
        -6.90460016972063023e-05 * DAYS_PER_YEAR,
        9.54791938424326609e-04 * SOLAR_MASS
    );
}

Body Saturn() {
    return Body(
        8.34336671824457987e+00,
        4.12479856412430479e+00,
        -4.03523417114321381e-01,
        -2.76742510726862411e-03 * DAYS_PER_YEAR,
        4.99852801234917238e-03 * DAYS_PER_YEAR,
        2.30417297573763929e-05 * DAYS_PER_YEAR,
        2.85885980666130812e-04 * SOLAR_MASS
    );
}

Body Uranus()  {
    return Body(
        1.28943695621391310e+01,
        -1.51111514016986312e+01,
        -2.23307578892655734e-01,
        2.96460137564761618e-03 * DAYS_PER_YEAR,
        2.37847173959480950e-03 * DAYS_PER_YEAR,
        -2.96589568540237556e-05 * DAYS_PER_YEAR,
        4.36624404335156298e-05 * SOLAR_MASS
    );
}

Body Neptune()  {
    return Body(
        1.53796971148509165e+01,
        -2.59193146099879641e+01,
        1.79258772950371181e-01,
        2.68067772490389322e-03 * DAYS_PER_YEAR,
        1.62824170038242295e-03 * DAYS_PER_YEAR,
        -9.51592254519715870e-05 * DAYS_PER_YEAR,
        5.15138902046611451e-05 * SOLAR_MASS
    );
}

Body Sun() {
    return Body(
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, SOLAR_MASS
    );
}

class NBodySystem {
    std::vector<Body> bodies;

    public:
    NBodySystem(const std::vector<Body> &bodies): bodies { bodies } {
        double px = 0.0;
        double py = 0.0;
        double pz = 0.0;

        for (auto const& b : bodies) {
            px += b.vx * b.mass;
            py += b.vy * b.mass;
            pz += b.vz * b.mass;
        }

        this->bodies[0].offsetMomentum(px, py, pz);
    }

    void advance(double dt) {
        for (auto bodyi = bodies.begin(); bodyi < bodies.end(); ++bodyi) {
            double bivx = bodyi->vx;
            double bivy = bodyi->vy;
            double bivz = bodyi->vz;

            for (auto bodyj = bodyi + 1; bodyj < bodies.end(); ++bodyj) {
                double dx = bodyi->x - bodyj->x;
                double dy = bodyi->y - bodyj->y;
                double dz = bodyi->z - bodyj->z;

                double distanceSq = std::pow(dx, 2) + std::pow(dy, 2) + std::pow(dz, 2);
                double distance = std::sqrt(distanceSq);
                double mag = dt / (distanceSq * distance);

                double bim = bodyi->mass * mag;
                double bjm = bodyj->mass * mag;

                bivx -= dx * bjm;
                bivy -= dy * bjm;
                bivz -= dz * bjm;

                bodyj->vx += dx * bim;
                bodyj->vy += dy * bim;
                bodyj->vz += dz * bim;
            }

            bodyi->vx = bivx;
            bodyi->vy = bivy;
            bodyi->vz = bivz;

            bodyi->x += dt * bivx;
            bodyi->y += dt * bivy;
            bodyi->z += dt * bivz;
        }
    }

    double energy() const {
        double e = 0.0;
        for (auto bodyi = bodies.begin(); bodyi < bodies.end(); ++bodyi) {
            e += 0.5 * bodyi->mass * (std::pow(bodyi->vx, 2) + std::pow(bodyi->vy, 2) + std::pow(bodyi->vz, 2));

            for (auto bodyj = bodyi + 1; bodyj < bodies.end(); ++bodyj) {
                double dx = bodyi->x - bodyj->x;
                double dy = bodyi->y - bodyj->y;
                double dz = bodyi->z - bodyj->z;

                double distance = std::sqrt(std::pow(dx, 2) + std::pow(dy, 2)+ std::pow(dz, 2));
                e -= bodyi->mass * bodyj->mass / distance;
            }
        }
        return e;
    }
};

extern "C" {

double nbody(size_t n) {
    std::vector<Body> bodies = { Sun(), Jupiter(), Saturn(), Uranus(), Neptune() };
    NBodySystem system { bodies };
    for (size_t i = 0; i < n; ++i) {
        system.advance(0.01);
    }
    return system.energy();
}
}
