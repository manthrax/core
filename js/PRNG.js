
export default class PRNG {

    static wichmannHillRNG = (s1 = 100, s2 = 100, s3 = 100) => () =>
    ((s1 = (171 * s1) % 30269) / 30269 +
      (s2 = (172 * s1) % 30307) / 30307 +
      (s3 = (170 * s1) % 30323) / 30323) %
    1;

    static SinRNG(seed) {
        return {
            seed: (seed === undefined) ? (+new Date() + Math.random()) : seed,
            random: function() {
                this.seed = Math.sin(this.seed) * 10000;
                return this.seed - Math.floor(this.seed);
            }
        }
    }

    static AleaRNG(seed) {
        return {
            seed: (seed === undefined) ? +new Date() + Math.random() : seed,
            random: function() {
                function Mash() {
                    var n = 4022871197;
                    return function(r) {
                        for (var t, s, u = 0, e = 0.02519603282416938; u < r.length; u++)
                            s = r.charCodeAt(u),
                            f = (e * (n += s) - (n * e | 0)),
                            n = 4294967296 * ((t = f * (e * n | 0)) - (t | 0)) + (t | 0);
                        return (n | 0) * 2.3283064365386963e-10;
                    }
                }
                return function() {
                    var m = Mash(), a = m(" "), b = m(" "), c = m(" "), x = 1, y;
                    seed = seed.toString(),
                    a -= m(seed),
                    b -= m(seed),
                    c -= m(seed);
                    a < 0 && a++,
                    b < 0 && b++,
                    c < 0 && c++;
                    return function() {
                        var y = x * 2.3283064365386963e-10 + a * 2091639;
                        a = b,
                        b = c;
                        return c = y - (x = y | 0);
                    }
                    ;
                }
            }()
        }
    }
}
