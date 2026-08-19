package com.aijournal.gateway.filter;

import java.net.InetAddress;
import java.net.InetSocketAddress;

// Shared trust-boundary check for ClientIpHeaderFilter and RateLimiterConfig's
// ipKeyResolver - both read X-Forwarded-For/X-Real-IP to see past the
// host-nginx -> frontend-container -> gateway proxy chain, but that is only
// safe if the immediate TCP peer is actually one of those trusted local
// hops. gateway-service's own port is published on the host (needed so the
// frontend container can reach it), which means anyone who connects to it
// directly - bypassing nginx entirely - can set arbitrary X-Forwarded-For/
// X-Real-IP headers of their own. Without this check, that forged header
// would be trusted unconditionally, defeating both the login-history IP
// record and (more seriously) the per-IP rate limiter on login/MFA/
// password-reset, since an attacker could mint a fresh bucket key on every
// request just by changing the header. Only a loopback or RFC1918-private
// immediate peer (i.e. something that could only be another container on
// this host's Docker network, not the public internet) is trusted to supply
// a forwarded-for header at all.
public final class TrustedProxyAddresses {

    private TrustedProxyAddresses() {
    }

    public static boolean isTrustedPeer(InetSocketAddress remoteAddress) {
        if (remoteAddress == null || remoteAddress.getAddress() == null) {
            return false;
        }
        InetAddress address = remoteAddress.getAddress();
        return address.isLoopbackAddress() || address.isSiteLocalAddress() || address.isLinkLocalAddress();
    }
}
