function gcd(x, y) {
    while (y != 0) {
        var z = x % y;
        x = y;
        y = z;
    }
    return x;
}

function F(n) {
    var f = 1;
    for (var i=2; i<=n; i++) {
        f *= i;
    }
    return f;
}

function P(n, m) {
    var f = 1;
    for (var i=n-m+1; i<=n; i++) {
        f *= i;
    }
    return f;
}

function C(n, m) {
    return P(n, m) / F(m);
}


